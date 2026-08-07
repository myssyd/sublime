"use node"

import { StripeSubscriptions } from "@convex-dev/stripe"
import type { StripeEventHandlers } from "@convex-dev/stripe"
import type { GenericActionCtx, GenericDataModel } from "convex/server"
import { ConvexError, v } from "convex/values"
import StripeSDK from "stripe"
import { authComponent } from "./auth"
import {
  PAID_PLAN_IDS,
  PLANS,
  TOPUP_AMOUNT,
  isPaidPlan,
  type BillingPeriod,
  type PaidPlan,
} from "./billing"
import { components, internal } from "./_generated/api"
import { action, type ActionCtx } from "./_generated/server"

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3004"

type RegisteredEvent =
  | "checkout.session.completed"
  | "invoice.paid"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.payment_failed"
  | "charge.refunded"

type SublimeStripeEventHandlers = Pick<StripeEventHandlers, RegisteredEvent>

type ResolvedPrice =
  | { kind: "subscription"; plan: PaidPlan; period: BillingPeriod }
  | { kind: "topup" }

export const stripeClient = new StripeSubscriptions(components.stripe, {})

function envPrice(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function subscriptionPriceId(plan: PaidPlan, period: BillingPeriod) {
  return envPrice(
    `STRIPE_${plan.toUpperCase()}_${
      period === "yearly" ? "ANNUAL" : "MONTHLY"
    }_PRICE_ID`
  )
}

function topupPriceId() {
  return envPrice("STRIPE_TOPUP_PRICE_ID")
}

function resolvePriceId(priceId: string): ResolvedPrice | null {
  for (const plan of PAID_PLAN_IDS) {
    const monthly = process.env[
      `STRIPE_${plan.toUpperCase()}_MONTHLY_PRICE_ID`
    ]?.trim()
    const annual = process.env[
      `STRIPE_${plan.toUpperCase()}_ANNUAL_PRICE_ID`
    ]?.trim()
    if (priceId === monthly) return { kind: "subscription", plan, period: "monthly" }
    if (priceId === annual) return { kind: "subscription", plan, period: "yearly" }
  }
  return priceId === process.env.STRIPE_TOPUP_PRICE_ID?.trim()
    ? { kind: "topup" }
    : null
}

export const createSubscriptionCheckout = action({
  args: {
    plan: v.union(
      v.literal("starter"),
      v.literal("creator"),
      v.literal("pro")
    ),
    period: v.union(v.literal("monthly"), v.literal("yearly")),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ sessionId: string; url: string | null }> => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")

    const existing = await ctx.runQuery(
      internal.credits.getSubscriptionByUserId,
      { userId: user._id }
    )
    if (
      existing &&
      (existing.status === "active" || existing.status === "past_due")
    ) {
      throw new ConvexError({
        kind: "subscription_already_active",
        message: "Manage your existing plan through the billing portal.",
      })
    }

    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: user._id,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    })
    await ctx.runMutation(internal.credits.linkStripeCustomer, {
      userId: user._id,
      stripeCustomerId: customer.customerId,
    })

    return await stripeClient.createCheckoutSession(ctx, {
      priceId: subscriptionPriceId(args.plan, args.period),
      customerId: customer.customerId,
      mode: "subscription",
      successUrl: `${SITE_URL}/billing?status=success`,
      cancelUrl: `${SITE_URL}/billing?status=canceled`,
      subscriptionMetadata: { userId: user._id },
      metadata: { userId: user._id, app: "sublime" },
      params: {
        automatic_tax: { enabled: true },
        billing_address_collection: "auto",
        customer_update: { address: "auto", name: "auto" },
        tax_id_collection: { enabled: true },
      },
    })
  },
})

export const createTopupCheckout = action({
  args: {},
  handler: async (ctx): Promise<{ sessionId: string; url: string | null }> => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const subscription = await ctx.runQuery(
      internal.credits.getSubscriptionByUserId,
      { userId: user._id }
    )
    if (!subscription || subscription.status !== "active") {
      throw new ConvexError({
        kind: "topup_requires_subscription",
        message: "Choose a paid plan before purchasing top-up credits.",
      })
    }

    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: user._id,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    })
    return await stripeClient.createCheckoutSession(ctx, {
      priceId: topupPriceId(),
      customerId: customer.customerId,
      mode: "payment",
      successUrl: `${SITE_URL}/billing?status=topup_success`,
      cancelUrl: `${SITE_URL}/billing?status=canceled`,
      paymentIntentMetadata: {
        userId: user._id,
        kind: "topup",
        app: "sublime",
      },
      metadata: { userId: user._id, kind: "topup", app: "sublime" },
      params: {
        automatic_tax: { enabled: true },
        billing_address_collection: "auto",
        customer_update: { address: "auto", name: "auto" },
        tax_id_collection: { enabled: true },
      },
    })
  },
})

export const createCustomerPortal = action({
  args: {},
  handler: async (ctx): Promise<{ url: string }> => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const subscription = await ctx.runQuery(
      internal.credits.getSubscriptionByUserId,
      { userId: user._id }
    )
    if (!subscription?.stripeCustomerId) {
      throw new ConvexError({
        kind: "no_stripe_customer",
        message: "Choose a plan before opening the billing portal.",
      })
    }
    return await stripeClient.createCustomerPortalSession(ctx, {
      customerId: subscription.stripeCustomerId,
      returnUrl: `${SITE_URL}/billing`,
    })
  },
})

async function resolveUserId(
  genericCtx: GenericActionCtx<GenericDataModel>,
  metadata: Record<string, string> | undefined,
  customerId: string | undefined
) {
  if (metadata?.userId) return metadata.userId
  if (!customerId) return null
  const ctx = genericCtx as unknown as ActionCtx
  const subscription = await ctx.runQuery(
    internal.credits.getSubscriptionByCustomerId,
    { stripeCustomerId: customerId }
  )
  return subscription?.userId ?? null
}

function invoiceSubscriptionId(invoice: StripeSDK.Invoice) {
  const parent = invoice.parent?.subscription_details?.subscription
  const lineParent =
    invoice.lines.data[0]?.parent?.subscription_item_details?.subscription
  const legacy = (
    invoice.lines.data[0] as
      | { subscription?: string | { id?: string } | null }
      | undefined
  )?.subscription
  const reference = parent ?? lineParent ?? legacy
  return typeof reference === "string" ? reference : reference?.id ?? null
}

export const stripeEventHandlers: SublimeStripeEventHandlers = {
  "checkout.session.completed": async (genericCtx, event) => {
    const ctx = genericCtx as unknown as ActionCtx
    const session = event.data.object
    const customerId =
      typeof session.customer === "string" ? session.customer : undefined
    const userId = await resolveUserId(
      genericCtx,
      session.metadata ?? undefined,
      customerId
    )
    if (!userId) return
    if (customerId) {
      await ctx.runMutation(internal.credits.linkStripeCustomer, {
        userId,
        stripeCustomerId: customerId,
      })
    }
    if (
      session.mode === "payment" &&
      session.payment_status === "paid" &&
      session.metadata?.kind === "topup"
    ) {
      await ctx.runMutation(internal.credits.applyTopup, {
        userId,
        stripeEventId: event.id,
      })
    }
  },

  "invoice.paid": async (genericCtx, event) => {
    const ctx = genericCtx as unknown as ActionCtx
    const invoice = event.data.object
    if (
      invoice.billing_reason !== "subscription_create" &&
      invoice.billing_reason !== "subscription_cycle" &&
      invoice.billing_reason !== "subscription_update"
    ) {
      return
    }
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : undefined
    const subscriptionId = invoiceSubscriptionId(invoice)
    if (!customerId || !subscriptionId) return

    const stripe = new StripeSDK(envPrice("STRIPE_SECRET_KEY"))
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const item = subscription.items.data[0]
    const priceId = item?.price?.id
    const resolved = priceId ? resolvePriceId(priceId) : null
    if (!item || !resolved || resolved.kind !== "subscription") return
    const userId = await resolveUserId(
      genericCtx,
      subscription.metadata ?? undefined,
      customerId
    )
    if (!userId) return

    if (invoice.billing_reason === "subscription_update") {
      const existing = await ctx.runQuery(
        internal.credits.getSubscriptionByUserId,
        { userId }
      )
      const oldTotal =
        existing && isPaidPlan(existing.plan)
          ? PLANS[existing.plan].monthlyAllowance *
            (existing.billingPeriod === "yearly" ? 12 : 1)
          : 0
      const newTotal =
        PLANS[resolved.plan].monthlyAllowance *
        (resolved.period === "yearly" ? 12 : 1)
      const span = item.current_period_end - item.current_period_start
      const remaining =
        span > 0
          ? Math.max(
              0,
              Math.min(
                1,
                (item.current_period_end - Math.floor(Date.now() / 1000)) /
                  span
              )
            )
          : 1
      await ctx.runMutation(internal.credits.applyUpgradeDelta, {
        userId,
        plan: resolved.plan,
        monthlyAllowance: PLANS[resolved.plan].monthlyAllowance,
        billingPeriod: resolved.period,
        deltaCredits: Math.max(
          0,
          Math.round((newTotal - oldTotal) * remaining)
        ),
        stripeEventId: event.id,
      })
      return
    }

    await ctx.runMutation(internal.credits.applySubscriptionRenewal, {
      userId,
      plan: resolved.plan,
      monthlyAllowance: PLANS[resolved.plan].monthlyAllowance,
      billingPeriod: resolved.period,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeEventId: event.id,
      stripeInvoiceId: invoice.id,
      currentPeriodStart: item.current_period_start
        ? item.current_period_start * 1000
        : undefined,
      currentPeriodEnd: item.current_period_end
        ? item.current_period_end * 1000
        : undefined,
    })
  },

  "customer.subscription.updated": async (genericCtx, event) => {
    const ctx = genericCtx as unknown as ActionCtx
    const subscription = event.data.object
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : undefined
    const userId = await resolveUserId(
      genericCtx,
      subscription.metadata ?? undefined,
      customerId
    )
    const item = subscription.items.data[0]
    if (!userId || !customerId || !item) return

    const status =
      subscription.status === "active"
        ? "active"
        : subscription.status === "past_due"
          ? "past_due"
          : subscription.status === "canceled"
            ? "canceled"
            : "incomplete"
    await ctx.runMutation(internal.credits.updateSubscriptionStatus, {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: item.current_period_start
        ? item.current_period_start * 1000
        : undefined,
      currentPeriodEnd: item.current_period_end
        ? item.current_period_end * 1000
        : undefined,
    })

  },

  "customer.subscription.deleted": async (genericCtx, event) => {
    const ctx = genericCtx as unknown as ActionCtx
    const subscription = event.data.object
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : undefined
    const userId = await resolveUserId(
      genericCtx,
      subscription.metadata ?? undefined,
      customerId
    )
    if (userId) {
      await ctx.runMutation(internal.credits.applySubscriptionCancellation, {
        userId,
        stripeEventId: event.id,
      })
    }
  },

  "invoice.payment_failed": async (genericCtx, event) => {
    const ctx = genericCtx as unknown as ActionCtx
    const invoice = event.data.object
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : undefined
    const subscriptionId = invoiceSubscriptionId(invoice)
    if (!customerId || !subscriptionId) return
    const sub = await ctx.runQuery(
      internal.credits.getSubscriptionByCustomerId,
      { stripeCustomerId: customerId }
    )
    if (!sub) return
    await ctx.runMutation(internal.credits.updateSubscriptionStatus, {
      userId: sub.userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: "past_due",
      billingPeriod: sub.billingPeriod,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    })
  },

  "charge.refunded": async (genericCtx, event) => {
    const ctx = genericCtx as unknown as ActionCtx
    const charge = event.data.object
    if (charge.metadata?.kind !== "topup") return
    const customerId =
      typeof charge.customer === "string" ? charge.customer : undefined
    const userId = await resolveUserId(
      genericCtx,
      charge.metadata ?? undefined,
      customerId
    )
    if (!userId || charge.amount <= 0) return
    const credits = Math.round(
      TOPUP_AMOUNT * (charge.amount_refunded / charge.amount)
    )
    if (credits <= 0) return
    await ctx.runMutation(internal.credits.applyRefund, {
      userId,
      credits,
      stripeEventId: event.id,
      notes: `Refunded charge ${charge.id}`,
    })
  },
}
