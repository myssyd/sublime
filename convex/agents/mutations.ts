import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Internal mutation to create a landing page with sections (called by agent)
export const createPageWithSections = internalMutation({
  args: {
    userId: v.id("users"),
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
    sections: v.array(
      v.object({
        type: v.string(),
        order: v.number(),
        content: v.any(),
        variants: v.optional(v.array(v.any())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify user exists and check limits
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const limits = { free: 3, pro: Infinity };
    if (user.usage.pagesCreated >= limits[user.plan]) {
      throw new Error("Page limit reached. Please upgrade to Pro.");
    }

    // Create the landing page
    const pageId = await ctx.db.insert("landingPages", {
      userId: args.userId,
      name: args.name,
      businessContext: args.businessContext,
      theme: args.theme,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    // Create all sections
    for (const section of args.sections) {
      await ctx.db.insert("sections", {
        landingPageId: pageId,
        type: section.type,
        order: section.order,
        isVisible: true,
        content: section.content,
        variants: section.variants,
        selectedVariant: section.variants ? 0 : undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Increment user's page count
    await ctx.db.patch(args.userId, {
      usage: {
        ...user.usage,
        pagesCreated: user.usage.pagesCreated + 1,
      },
    });

    return pageId;
  },
});

// Internal mutation to update a section (called by comment agent)
export const updateSectionContent = internalMutation({
  args: {
    sectionId: v.id("sections"),
    content: v.any(),
    previousContent: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    await ctx.db.patch(args.sectionId, {
      content: args.content,
      updatedAt: Date.now(),
    });

    // Update the landing page timestamp
    await ctx.db.patch(section.landingPageId, {
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Internal mutation to add a new section to an existing page
export const addSection = internalMutation({
  args: {
    landingPageId: v.id("landingPages"),
    type: v.string(),
    content: v.any(),
    order: v.optional(v.number()),
    variants: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.landingPageId);
    if (!page) {
      throw new Error("Landing page not found");
    }

    // Get existing sections to determine order
    const existingSections = await ctx.db
      .query("sections")
      .withIndex("by_page", (q) => q.eq("landingPageId", args.landingPageId))
      .collect();

    const order = args.order ?? existingSections.length;
    const now = Date.now();

    // If inserting in the middle, shift other sections
    if (order < existingSections.length) {
      for (const section of existingSections) {
        if (section.order >= order) {
          await ctx.db.patch(section._id, { order: section.order + 1 });
        }
      }
    }

    const sectionId = await ctx.db.insert("sections", {
      landingPageId: args.landingPageId,
      type: args.type,
      order,
      isVisible: true,
      content: args.content,
      variants: args.variants,
      selectedVariant: args.variants ? 0 : undefined,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.landingPageId, { updatedAt: now });

    return sectionId;
  },
});

// Internal mutation to delete a section
export const deleteSection = internalMutation({
  args: {
    sectionId: v.id("sections"),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    // Delete comments on this section
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete the section
    await ctx.db.delete(args.sectionId);

    // Update landing page timestamp
    await ctx.db.patch(section.landingPageId, { updatedAt: Date.now() });

    return { success: true };
  },
});

// Internal mutation to update the theme
export const updateTheme = internalMutation({
  args: {
    landingPageId: v.id("landingPages"),
    theme: v.object({
      primaryColor: v.string(),
      secondaryColor: v.string(),
      accentColor: v.string(),
      backgroundColor: v.string(),
      textColor: v.string(),
      fontFamily: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.landingPageId);
    if (!page) {
      throw new Error("Landing page not found");
    }

    await ctx.db.patch(args.landingPageId, {
      theme: args.theme,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
