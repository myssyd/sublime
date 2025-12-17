import { mutation, query } from "./_generated/server";
import { getAuthUser } from "./auth";

// Plan limits configuration
// NOTE: Free tier limits raised to match pro for testing. Original free limits were:
// maxPages: 3, aiCallsPerMonth: 100, maxStorageBytes: 50MB
export const PLAN_LIMITS = {
  free: {
    maxPages: Infinity,
    aiCallsPerMonth: 2000,
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
  },
  pro: {
    maxPages: Infinity,
    aiCallsPerMonth: 2000,
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
  },
} as const;

function getNextMonthTimestamp(): number {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  return nextMonth.getTime();
}

// Get current usage stats
export const getUsage = query({
  args: {},
  handler: async (ctx: any) => {
    const user = await getAuthUser(ctx);
    const limits = PLAN_LIMITS[user.plan as "free" | "pro"];

    return {
      usage: user.usage,
      limits: {
        maxPages: limits.maxPages,
        aiCallsPerMonth: limits.aiCallsPerMonth,
        maxStorageBytes: limits.maxStorageBytes,
      },
      plan: user.plan,
    };
  },
});

// Check and increment AI calls
export const checkAndIncrementAiCalls = mutation({
  args: {},
  handler: async (ctx: any) => {
    const user = await getAuthUser(ctx);
    const limits = PLAN_LIMITS[user.plan as "free" | "pro"];
    const now = Date.now();

    // Reset if new month
    if (now > user.usage.aiCallsResetAt) {
      await ctx.db.patch(user._id, {
        usage: {
          ...user.usage,
          aiCallsThisMonth: 1,
          aiCallsResetAt: getNextMonthTimestamp(),
        },
      });
      return { allowed: true, remaining: limits.aiCallsPerMonth - 1 };
    }

    // Check limit
    if (user.usage.aiCallsThisMonth >= limits.aiCallsPerMonth) {
      return { allowed: false, remaining: 0 };
    }

    // Increment
    await ctx.db.patch(user._id, {
      usage: {
        ...user.usage,
        aiCallsThisMonth: user.usage.aiCallsThisMonth + 1,
      },
    });

    return {
      allowed: true,
      remaining: limits.aiCallsPerMonth - user.usage.aiCallsThisMonth - 1,
    };
  },
});

// Check if user can create a new page
export const canCreatePage = query({
  args: {},
  handler: async (ctx: any) => {
    const user = await getAuthUser(ctx);
    const limits = PLAN_LIMITS[user.plan as "free" | "pro"];
    return {
      canCreate: user.usage.pagesCreated < limits.maxPages,
      current: user.usage.pagesCreated,
      max: limits.maxPages,
    };
  },
});

// Increment page count
export const incrementPageCount = mutation({
  args: {},
  handler: async (ctx: any) => {
    const user = await getAuthUser(ctx);
    const limits = PLAN_LIMITS[user.plan as "free" | "pro"];

    if (user.usage.pagesCreated >= limits.maxPages) {
      throw new Error("Page limit reached. Please upgrade to Pro.");
    }

    await ctx.db.patch(user._id, {
      usage: {
        ...user.usage,
        pagesCreated: user.usage.pagesCreated + 1,
      },
    });

    return { success: true };
  },
});

// Update storage usage
export const updateStorageUsage = mutation({
  args: {},
  handler: async (ctx: any) => {
    const user = await getAuthUser(ctx);

    // Calculate total storage from media
    const userMedia = await ctx.db
      .query("media")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // For now, estimate 1MB per image (we'll get actual sizes later)
    const estimatedBytes = userMedia.length * 1024 * 1024;

    await ctx.db.patch(user._id, {
      usage: {
        ...user.usage,
        storageUsedBytes: estimatedBytes,
      },
    });

    return { storageUsedBytes: estimatedBytes };
  },
});
