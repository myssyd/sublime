import { ConvexError, v } from "convex/values"
import type { Doc as AuthDoc } from "./betterAuth/_generated/dataModel"
import { components } from "./_generated/api"
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"
import { authComponent } from "./auth"
import { availableBalances, grantAdminCredits } from "./credits"

const MAX_LISTED_USERS = 200
const MAX_GRANT_CREDITS = 1_000_000

function configuredAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase()
}

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await authComponent.getAuthUser(ctx)
  const adminEmail = configuredAdminEmail()

  if (!adminEmail || user.email.trim().toLowerCase() !== adminEmail) {
    throw new ConvexError({
      kind: "forbidden",
      message: "You do not have access to admin tools.",
    })
  }

  return user
}

export const isAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    const adminEmail = configuredAdminEmail()
    return Boolean(
      user &&
        adminEmail &&
        user.email.trim().toLowerCase() === adminEmail
    )
  },
})

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      limit: MAX_LISTED_USERS,
      sortBy: { field: "createdAt", direction: "desc" },
      paginationOpts: { cursor: null, numItems: MAX_LISTED_USERS },
    })
    const users = result.page as AuthDoc<"user">[]

    const subscriptions = await Promise.all(
      users.map((user) =>
        ctx.db
          .query("subscriptions")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique()
      )
    )

    return users.map((user, index) => {
      const subscription = subscriptions[index]
      const balance = subscription
        ? availableBalances(subscription)
        : {
            subscriptionBalance: 0,
            topupBalance: 0,
            adminBalance: 0,
            reservedCredits: 0,
            total: 0,
          }

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
        createdAt: user.createdAt,
        plan: subscription?.plan ?? "none",
        status: subscription?.status ?? "inactive",
        ...balance,
      }
    })
  },
})

export const grantCredits = mutation({
  args: {
    userId: v.string(),
    credits: v.number(),
    grantId: v.string(),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)

    if (
      !Number.isSafeInteger(args.credits) ||
      args.credits <= 0 ||
      args.credits > MAX_GRANT_CREDITS
    ) {
      throw new ConvexError({
        kind: "invalid_credit_grant",
        message: `Enter a whole number between 1 and ${MAX_GRANT_CREDITS.toLocaleString()}.`,
      })
    }
    if (!args.grantId.trim() || args.grantId.length > 100) {
      throw new ConvexError({
        kind: "invalid_grant_id",
        message: "This credit grant could not be identified.",
      })
    }

    const targetUser = await authComponent.getAnyUserById(ctx, args.userId)
    if (!targetUser) {
      throw new ConvexError({
        kind: "user_not_found",
        message: "That user no longer exists.",
      })
    }

    await grantAdminCredits(ctx, {
      userId: targetUser._id,
      credits: args.credits,
      grantId: args.grantId,
      adminEmail: admin.email,
    })

    return { success: true as const }
  },
})
