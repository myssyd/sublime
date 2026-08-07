import { ConvexError, v } from "convex/values"
import type { Doc, Id } from "./_generated/dataModel"
import {
  internalMutation,
  internalQuery,
  query,
  type MutationCtx,
} from "./_generated/server"
import { authComponent } from "./auth"
import { CREDIT_RATE_VERSION, TOPUP_AMOUNT } from "./billing"

type LedgerSource = "subscription" | "topup"
type LedgerReason =
  | "subscription_grant"
  | "upgrade_delta"
  | "topup"
  | "spend"
  | "refund"
  | "expiry"

type UsageOperation = "character_image" | "video_clone"

function availableBalances(sub: {
  subscriptionBalance: number
  topupBalance: number
  reservedSubscriptionCredits?: number
  reservedTopupCredits?: number
}) {
  const reservedSubscription = sub.reservedSubscriptionCredits ?? 0
  const reservedTopup = sub.reservedTopupCredits ?? 0
  const subscriptionBalance = Math.max(
    0,
    sub.subscriptionBalance - reservedSubscription
  )
  const topupBalance = Math.max(0, sub.topupBalance - reservedTopup)
  return {
    subscriptionBalance,
    topupBalance,
    reservedCredits: reservedSubscription + reservedTopup,
    total: subscriptionBalance + topupBalance,
  }
}

async function getOrCreateSubscription(
  ctx: MutationCtx,
  userId: string
): Promise<Doc<"subscriptions">> {
  const existing = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique()
  if (existing) return existing

  const id = await ctx.db.insert("subscriptions", {
    userId,
    plan: "none",
    status: "inactive",
    monthlyAllowance: 0,
    subscriptionBalance: 0,
    topupBalance: 0,
    reservedSubscriptionCredits: 0,
    reservedTopupCredits: 0,
  })
  const created = await ctx.db.get(id)
  if (!created) throw new Error("Could not create billing account")
  return created
}

async function applyDelta(
  ctx: MutationCtx,
  args: {
    userId: string
    delta: number
    reason: LedgerReason
    source: LedgerSource
    idempotencyKey: string
    usageId?: Id<"usage">
    stripeEventId?: string
    stripeInvoiceId?: string
    notes?: string
  }
) {
  const existing = await ctx.db
    .query("creditLedger")
    .withIndex("by_idempotency_key", (q) =>
      q.eq("idempotencyKey", args.idempotencyKey)
    )
    .unique()
  if (existing) return

  await ctx.db.insert("creditLedger", {
    ...args,
    createdAt: Date.now(),
  })
  const sub = await getOrCreateSubscription(ctx, args.userId)
  if (args.source === "subscription") {
    await ctx.db.patch(sub._id, {
      subscriptionBalance: sub.subscriptionBalance + args.delta,
    })
  } else {
    await ctx.db.patch(sub._id, {
      topupBalance: sub.topupBalance + args.delta,
    })
  }
}

export async function reserveCredits(
  ctx: MutationCtx,
  args: {
    userId: string
    credits: number
    reservationKey: string
    kind: string
    refId?: string
  }
) {
  if (!Number.isInteger(args.credits) || args.credits <= 0) {
    throw new Error("Credit reservations must be positive whole numbers")
  }

  const existing = await ctx.db
    .query("creditReservations")
    .withIndex("by_key", (q) => q.eq("reservationKey", args.reservationKey))
    .unique()
  if (existing) {
    if (
      existing.userId !== args.userId ||
      existing.credits !== args.credits ||
      existing.kind !== args.kind ||
      existing.refId !== args.refId
    ) {
      throw new Error("Credit reservation key was reused with different data")
    }
    if (existing.status === "active") return existing._id
    if (existing.status === "settled") {
      throw new ConvexError({
        kind: "credit_reservation_settled",
        message: "This generation has already been charged.",
      })
    }
  }

  const sub = await getOrCreateSubscription(ctx, args.userId)
  if (sub.status === "past_due") {
    throw new ConvexError({
      kind: "subscription_past_due",
      message: "Update your payment method to keep generating.",
    })
  }
  if (sub.status !== "active") {
    throw new ConvexError({
      kind: "subscription_required",
      message: "Choose a plan to start generating.",
    })
  }

  const available = availableBalances(sub)
  if (available.total < args.credits) {
    throw new ConvexError({
      kind: "insufficient_credits",
      needed: args.credits,
      balance: available.total,
      message: `This generation needs ${args.credits} credits.`,
    })
  }

  const subscriptionCredits = Math.min(
    available.subscriptionBalance,
    args.credits
  )
  const topupCredits = args.credits - subscriptionCredits
  const now = Date.now()
  const reservationId = existing
    ? existing._id
    : await ctx.db.insert("creditReservations", {
        userId: args.userId,
        reservationKey: args.reservationKey,
        credits: args.credits,
        subscriptionCredits,
        topupCredits,
        status: "active",
        kind: args.kind,
        refId: args.refId,
        subscriptionPeriodEnd:
          subscriptionCredits > 0 ? sub.currentPeriodEnd : undefined,
        attemptCount: 1,
        updatedAt: now,
      })

  if (existing) {
    await ctx.db.patch(existing._id, {
      subscriptionCredits,
      topupCredits,
      status: "active",
      releasedAt: undefined,
      releaseReason: undefined,
      attemptCount: (existing.attemptCount ?? 1) + 1,
      updatedAt: now,
    })
  }
  await ctx.db.patch(sub._id, {
    reservedSubscriptionCredits:
      (sub.reservedSubscriptionCredits ?? 0) + subscriptionCredits,
    reservedTopupCredits:
      (sub.reservedTopupCredits ?? 0) + topupCredits,
  })
  return reservationId
}

async function releaseReservation(
  ctx: MutationCtx,
  reservationKey: string,
  reason: string
) {
  const reservation = await ctx.db
    .query("creditReservations")
    .withIndex("by_key", (q) => q.eq("reservationKey", reservationKey))
    .unique()
  if (!reservation || reservation.status !== "active") return false

  const sub = await getOrCreateSubscription(ctx, reservation.userId)
  await ctx.db.patch(sub._id, {
    reservedSubscriptionCredits: Math.max(
      0,
      (sub.reservedSubscriptionCredits ?? 0) -
        reservation.subscriptionCredits
    ),
    reservedTopupCredits: Math.max(
      0,
      (sub.reservedTopupCredits ?? 0) - reservation.topupCredits
    ),
  })
  await ctx.db.patch(reservation._id, {
    status: "released",
    releasedAt: Date.now(),
    releaseReason: reason.slice(0, 500),
    updatedAt: Date.now(),
  })
  return true
}

async function settleReservation(
  ctx: MutationCtx,
  reservationKey: string,
  usageId: Id<"usage">
) {
  const reservation = await ctx.db
    .query("creditReservations")
    .withIndex("by_key", (q) => q.eq("reservationKey", reservationKey))
    .unique()
  if (!reservation) throw new Error("Credit reservation not found")
  if (reservation.status === "settled") return
  if (reservation.status !== "active") {
    throw new Error("Released credit reservation cannot be settled")
  }

  if (reservation.subscriptionCredits > 0) {
    await applyDelta(ctx, {
      userId: reservation.userId,
      delta: -reservation.subscriptionCredits,
      reason: "spend",
      source: "subscription",
      idempotencyKey: `spend_${usageId}__subscription`,
      usageId,
      notes: reservation.kind,
    })
  }
  if (reservation.topupCredits > 0) {
    await applyDelta(ctx, {
      userId: reservation.userId,
      delta: -reservation.topupCredits,
      reason: "spend",
      source: "topup",
      idempotencyKey: `spend_${usageId}__topup`,
      usageId,
      notes: reservation.kind,
    })
  }

  const sub = await getOrCreateSubscription(ctx, reservation.userId)
  await ctx.db.patch(sub._id, {
    reservedSubscriptionCredits: Math.max(
      0,
      (sub.reservedSubscriptionCredits ?? 0) -
        reservation.subscriptionCredits
    ),
    reservedTopupCredits: Math.max(
      0,
      (sub.reservedTopupCredits ?? 0) - reservation.topupCredits
    ),
  })
  await ctx.db.patch(reservation._id, {
    status: "settled",
    usageId,
    settledAt: Date.now(),
    updatedAt: Date.now(),
  })
}

const balanceValidator = v.object({
  subscriptionBalance: v.number(),
  topupBalance: v.number(),
  reservedCredits: v.number(),
  total: v.number(),
})

export const getMyBalance = query({
  args: {},
  returns: v.union(balanceValidator, v.null()),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return null
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique()
    return sub
      ? availableBalances(sub)
      : {
          subscriptionBalance: 0,
          topupBalance: 0,
          reservedCredits: 0,
          total: 0,
        }
  },
})

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return null
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique()
  },
})

export const getSubscriptionByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique(),
})

export const getSubscriptionByCustomerId = internalQuery({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .unique(),
})

export const createReservation = internalMutation({
  args: {
    userId: v.string(),
    credits: v.number(),
    reservationKey: v.string(),
    kind: v.string(),
    refId: v.optional(v.string()),
  },
  handler: async (ctx, args) => await reserveCredits(ctx, args),
})

export const createReservationBundle = internalMutation({
  args: {
    userId: v.string(),
    reservations: v.array(
      v.object({
        credits: v.number(),
        reservationKey: v.string(),
        kind: v.string(),
        refId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = []
    for (const reservation of args.reservations) {
      ids.push(
        await reserveCredits(ctx, {
          userId: args.userId,
          ...reservation,
        })
      )
    }
    return ids
  },
})

export const recordProviderSuccess = internalMutation({
  args: {
    reservationKey: v.string(),
    operation: v.union(
      v.literal("character_image"),
      v.literal("video_clone")
    ),
    model: v.string(),
    providerRequestId: v.optional(v.string()),
    elapsedMs: v.number(),
  },
  handler: async (ctx, args) => {
    const existingUsage = await ctx.db
      .query("usage")
      .withIndex("by_reservation", (q) =>
        q.eq("reservationKey", args.reservationKey)
      )
      .unique()
    if (existingUsage) return existingUsage._id

    const reservation = await ctx.db
      .query("creditReservations")
      .withIndex("by_key", (q) => q.eq("reservationKey", args.reservationKey))
      .unique()
    if (!reservation) throw new Error("Credit reservation not found")

    const usageId = await ctx.db.insert("usage", {
      userId: reservation.userId,
      operation: args.operation,
      provider: "fal",
      model: args.model,
      status: "completed",
      providerRequestId: args.providerRequestId,
      elapsedMs: args.elapsedMs,
      creditsCharged: reservation.credits,
      creditRateVersion: CREDIT_RATE_VERSION,
      billingStatus: "charged",
      reservationKey: args.reservationKey,
      createdAt: Date.now(),
    })
    await settleReservation(ctx, args.reservationKey, usageId)
    return usageId
  },
})

export const recordProviderFailure = internalMutation({
  args: {
    reservationKey: v.string(),
    operation: v.union(
      v.literal("character_image"),
      v.literal("video_clone")
    ),
    model: v.string(),
    elapsedMs: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db
      .query("creditReservations")
      .withIndex("by_key", (q) => q.eq("reservationKey", args.reservationKey))
      .unique()
    if (!reservation) return null

    const released = await releaseReservation(
      ctx,
      args.reservationKey,
      args.reason
    )
    const existingUsage = await ctx.db
      .query("usage")
      .withIndex("by_reservation", (q) =>
        q.eq("reservationKey", args.reservationKey)
      )
      .unique()
    if (existingUsage || !released) return existingUsage?._id ?? null

    return await ctx.db.insert("usage", {
      userId: reservation.userId,
      operation: args.operation as UsageOperation,
      provider: "fal",
      model: args.model,
      status: "failed",
      elapsedMs: args.elapsedMs,
      creditsCharged: 0,
      creditRateVersion: CREDIT_RATE_VERSION,
      billingStatus: "released",
      reservationKey: args.reservationKey,
      createdAt: Date.now(),
    })
  },
})

export const linkStripeCustomer = internalMutation({
  args: { userId: v.string(), stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const sub = await getOrCreateSubscription(ctx, args.userId)
    await ctx.db.patch(sub._id, { stripeCustomerId: args.stripeCustomerId })
  },
})

export const applySubscriptionRenewal = internalMutation({
  args: {
    userId: v.string(),
    plan: v.string(),
    monthlyAllowance: v.number(),
    billingPeriod: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripeEventId: v.string(),
    stripeInvoiceId: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sub = await getOrCreateSubscription(ctx, args.userId)
    const grantKey = `grant_${args.stripeEventId}`
    const existingGrant = await ctx.db
      .query("creditLedger")
      .withIndex("by_idempotency_key", (q) =>
        q.eq("idempotencyKey", grantKey)
      )
      .unique()

    if (!existingGrant) {
      const expirable = Math.max(
        0,
        sub.subscriptionBalance - (sub.reservedSubscriptionCredits ?? 0)
      )
      if (expirable > 0) {
        await applyDelta(ctx, {
          userId: args.userId,
          delta: -expirable,
          reason: "expiry",
          source: "subscription",
          idempotencyKey: `expiry_${args.stripeEventId}`,
          stripeEventId: args.stripeEventId,
        })
      }
      await applyDelta(ctx, {
        userId: args.userId,
        delta:
          args.monthlyAllowance * (args.billingPeriod === "yearly" ? 12 : 1),
        reason: "subscription_grant",
        source: "subscription",
        idempotencyKey: grantKey,
        stripeEventId: args.stripeEventId,
        stripeInvoiceId: args.stripeInvoiceId,
      })
    }

    await ctx.db.patch(sub._id, {
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      plan: args.plan,
      status: "active",
      monthlyAllowance: args.monthlyAllowance,
      billingPeriod: args.billingPeriod,
      cancelAtPeriodEnd: false,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
    })
  },
})

export const applyUpgradeDelta = internalMutation({
  args: {
    userId: v.string(),
    plan: v.string(),
    monthlyAllowance: v.number(),
    billingPeriod: v.string(),
    deltaCredits: v.number(),
    stripeEventId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.deltaCredits > 0) {
      await applyDelta(ctx, {
        userId: args.userId,
        delta: args.deltaCredits,
        reason: "upgrade_delta",
        source: "subscription",
        idempotencyKey: `upgrade_${args.stripeEventId}`,
        stripeEventId: args.stripeEventId,
      })
    }
    const sub = await getOrCreateSubscription(ctx, args.userId)
    await ctx.db.patch(sub._id, {
      plan: args.plan,
      monthlyAllowance: args.monthlyAllowance,
      billingPeriod: args.billingPeriod,
    })
  },
})

export const applyTopup = internalMutation({
  args: { userId: v.string(), stripeEventId: v.string() },
  handler: async (ctx, args) => {
    await applyDelta(ctx, {
      userId: args.userId,
      delta: TOPUP_AMOUNT,
      reason: "topup",
      source: "topup",
      idempotencyKey: `topup_${args.stripeEventId}`,
      stripeEventId: args.stripeEventId,
    })
  },
})

export const applyRefund = internalMutation({
  args: {
    userId: v.string(),
    credits: v.number(),
    stripeEventId: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await applyDelta(ctx, {
      userId: args.userId,
      delta: -args.credits,
      reason: "refund",
      source: "topup",
      idempotencyKey: `refund_${args.stripeEventId}`,
      stripeEventId: args.stripeEventId,
      notes: args.notes,
    })
  },
})

export const updateSubscriptionStatus = internalMutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    status: v.string(),
    billingPeriod: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sub = await getOrCreateSubscription(ctx, args.userId)
    await ctx.db.patch(sub._id, {
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      status: args.status,
      billingPeriod: args.billingPeriod ?? sub.billingPeriod,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
    })
  },
})

export const applySubscriptionCancellation = internalMutation({
  args: { userId: v.string(), stripeEventId: v.string() },
  handler: async (ctx, args) => {
    const sub = await getOrCreateSubscription(ctx, args.userId)
    const expirable = Math.max(
      0,
      sub.subscriptionBalance - (sub.reservedSubscriptionCredits ?? 0)
    )
    if (expirable > 0) {
      await applyDelta(ctx, {
        userId: args.userId,
        delta: -expirable,
        reason: "expiry",
        source: "subscription",
        idempotencyKey: `cancel_${args.stripeEventId}`,
        stripeEventId: args.stripeEventId,
      })
    }
    await ctx.db.patch(sub._id, {
      plan: "none",
      status: "canceled",
      monthlyAllowance: 0,
      stripeSubscriptionId: undefined,
      billingPeriod: undefined,
      cancelAtPeriodEnd: undefined,
      currentPeriodStart: undefined,
      currentPeriodEnd: undefined,
    })
  },
})
