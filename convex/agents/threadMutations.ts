import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Create a thread record in our database
export const createThread = internalMutation({
  args: {
    threadId: v.string(),
    userId: v.id("users"),
    purpose: v.union(v.literal("generation"), v.literal("editing")),
    landingPageId: v.optional(v.id("landingPages")),
  },
  handler: async (ctx, args) => {
    // Store in our threads table for reference
    const id = await ctx.db.insert("threads", {
      userId: args.userId,
      landingPageId: args.landingPageId,
      purpose: args.purpose,
      createdAt: Date.now(),
    });

    return id;
  },
});

// Get thread by agent thread ID
export const getThread = internalMutation({
  args: {
    userId: v.id("users"),
    purpose: v.union(v.literal("generation"), v.literal("editing")),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("purpose"), args.purpose))
      .order("desc")
      .first();

    return thread;
  },
});
