import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./auth";

// List all landing pages for current user
export const list = query({
  args: {},
  handler: async (ctx: any) => {
    const user = await getAuthUser(ctx);

    const pages = await ctx.db
      .query("landingPages")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return pages;
  },
});

// Get a single landing page by ID
export const get = query({
  args: { id: v.id("landingPages") },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    const page = await ctx.db.get(args.id);

    // Check ownership
    if (!page || page.userId !== user._id) {
      return null;
    }

    return page;
  },
});

// Create a new landing page
export const create = mutation({
  args: {
    name: v.string(),
    businessContext: v.object({
      name: v.string(),
      description: v.string(),
      industry: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      uniqueValue: v.optional(v.string()),
    }),
    theme: v.object({
      primaryColor: v.string(),
      secondaryColor: v.string(),
      accentColor: v.string(),
      backgroundColor: v.string(),
      textColor: v.string(),
      fontFamily: v.string(),
    }),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);
    const now = Date.now();

    // Check page limit
    const limits = {
      free: 3,
      pro: Infinity,
    };

    if (user.usage.pagesCreated >= limits[user.plan as "free" | "pro"]) {
      throw new Error("Page limit reached. Please upgrade to Pro.");
    }

    // Create the landing page
    const pageId = await ctx.db.insert("landingPages", {
      userId: user._id,
      name: args.name,
      businessContext: args.businessContext,
      theme: args.theme,
      status: "generating",
      createdAt: now,
      updatedAt: now,
    });

    // Increment page count
    await ctx.db.patch(user._id, {
      usage: {
        ...user.usage,
        pagesCreated: user.usage.pagesCreated + 1,
      },
    });

    return pageId;
  },
});

// Update landing page
export const update = mutation({
  args: {
    id: v.id("landingPages"),
    name: v.optional(v.string()),
    businessContext: v.optional(
      v.object({
        name: v.string(),
        description: v.string(),
        industry: v.optional(v.string()),
        targetAudience: v.optional(v.string()),
        uniqueValue: v.optional(v.string()),
      })
    ),
    theme: v.optional(
      v.object({
        primaryColor: v.string(),
        secondaryColor: v.string(),
        accentColor: v.string(),
        backgroundColor: v.string(),
        textColor: v.string(),
        fontFamily: v.string(),
      })
    ),
    status: v.optional(
      v.union(
        v.literal("generating"),
        v.literal("draft"),
        v.literal("published")
      )
    ),
    generationThreadId: v.optional(v.id("threads")),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    const page = await ctx.db.get(args.id);
    if (!page || page.userId !== user._id) {
      throw new Error("Page not found");
    }

    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete landing page
export const remove = mutation({
  args: { id: v.id("landingPages") },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    const page = await ctx.db.get(args.id);
    if (!page || page.userId !== user._id) {
      throw new Error("Page not found");
    }

    // Delete all sections
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_page", (q: any) => q.eq("landingPageId", args.id))
      .collect();

    for (const section of sections) {
      // Delete comments on section
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_section", (q: any) => q.eq("sectionId", section._id))
        .collect();

      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }

      await ctx.db.delete(section._id);
    }

    // Delete the page
    await ctx.db.delete(args.id);

    // Note: We don't decrement pagesCreated as it's a lifetime count

    return { success: true };
  },
});
