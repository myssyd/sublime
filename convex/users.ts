import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent, createAuth } from "./auth";
import { getAuthUser } from "./auth";

// Get current authenticated user
export const me = query({
  args: {},
  handler: async (ctx: any) => {
    try {
      return await getAuthUser(ctx);
    } catch {
      return null;
    }
  },
});

// Get user by email (for agent actions)
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: { email: string }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();

    return user;
  },
});

// Ensure user exists in the users table after authentication
// This should be called after login to sync better-auth user with our users table
export const ensureUser = mutation({
  args: {},
  handler: async (ctx: any) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", session.user.email))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new user with default usage
    const now = Date.now();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    const userId = await ctx.db.insert("users", {
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      usage: {
        pagesCreated: 0,
        aiCallsThisMonth: 0,
        aiCallsResetAt: nextMonth.getTime(),
        storageUsedBytes: 0,
      },
      plan: "free",
      createdAt: now,
    });

    return userId;
  },
});

// Create user on first sign in (called by auth webhook) - kept for backwards compatibility
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new user with default usage
    const now = Date.now();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      image: args.image,
      usage: {
        pagesCreated: 0,
        aiCallsThisMonth: 0,
        aiCallsResetAt: nextMonth.getTime(),
        storageUsedBytes: 0,
      },
      plan: "free",
      createdAt: now,
    });

    return userId;
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    await ctx.db.patch(user._id, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.image !== undefined && { image: args.image }),
    });

    return { success: true };
  },
});

// Update user avatar from storage
export const updateAvatar = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    // Get the URL for the uploaded file
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get storage URL");
    }

    await ctx.db.patch(user._id, { image: url });

    return { success: true, url };
  },
});

// Delete user account and all associated data
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx: any) => {
    const user = await getAuthUser(ctx);

    // Delete all user's landing pages and their sections
    const pages = await ctx.db
      .query("landingPages")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    for (const page of pages) {
      // Delete sections for each page
      const sections = await ctx.db
        .query("sections")
        .withIndex("by_page", (q: any) => q.eq("landingPageId", page._id))
        .collect();

      for (const section of sections) {
        // Delete comments for each section
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_section", (q: any) => q.eq("sectionId", section._id))
          .collect();

        for (const comment of comments) {
          await ctx.db.delete(comment._id);
        }

        await ctx.db.delete(section._id);
      }

      await ctx.db.delete(page._id);
    }

    // Delete all user's media from storage and database
    const media = await ctx.db
      .query("media")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    for (const item of media) {
      await ctx.storage.delete(item.storageId);
      await ctx.db.delete(item._id);
    }

    // Delete user's threads and messages
    const threads = await ctx.db
      .query("threads")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    for (const thread of threads) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_thread", (q: any) => q.eq("threadId", thread._id))
        .collect();

      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }

      await ctx.db.delete(thread._id);
    }

    // Delete the user record
    await ctx.db.delete(user._id);

    return { success: true };
  },
});
