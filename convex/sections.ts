import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./auth";

// List all sections for a landing page
export const listByPage = query({
  args: { landingPageId: v.id("landingPages") },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    // Verify ownership of the landing page
    const page = await ctx.db.get(args.landingPageId);
    if (!page || page.userId !== user._id) {
      return [];
    }

    const sections = await ctx.db
      .query("sections")
      .withIndex("by_page", (q: any) => q.eq("landingPageId", args.landingPageId))
      .collect();

    // Sort by order
    return sections.sort((a: any, b: any) => a.order - b.order);
  },
});

// Get a single section
export const get = query({
  args: { id: v.id("sections") },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    const section = await ctx.db.get(args.id);
    if (!section) return null;

    // Verify ownership through landing page
    const page = await ctx.db.get(section.landingPageId);
    if (!page || page.userId !== user._id) {
      return null;
    }

    return section;
  },
});

// Create a new section
export const create = mutation({
  args: {
    landingPageId: v.id("landingPages"),
    type: v.string(),
    order: v.number(),
    content: v.any(),
    variants: v.optional(v.array(v.any())),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);
    const now = Date.now();

    // Verify ownership
    const page = await ctx.db.get(args.landingPageId);
    if (!page || page.userId !== user._id) {
      throw new Error("Landing page not found");
    }

    const sectionId = await ctx.db.insert("sections", {
      landingPageId: args.landingPageId,
      type: args.type,
      order: args.order,
      isVisible: true,
      content: args.content,
      variants: args.variants,
      selectedVariant: args.variants ? 0 : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Update landing page timestamp
    await ctx.db.patch(args.landingPageId, { updatedAt: now });

    return sectionId;
  },
});

// Update section content
export const update = mutation({
  args: {
    id: v.id("sections"),
    type: v.optional(v.string()),
    order: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
    content: v.optional(v.any()),
    variants: v.optional(v.array(v.any())),
    selectedVariant: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);
    const now = Date.now();

    const section = await ctx.db.get(args.id);
    if (!section) {
      throw new Error("Section not found");
    }

    // Verify ownership through landing page
    const page = await ctx.db.get(section.landingPageId);
    if (!page || page.userId !== user._id) {
      throw new Error("Section not found");
    }

    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    });

    // Update landing page timestamp
    await ctx.db.patch(section.landingPageId, { updatedAt: now });

    return { success: true };
  },
});

// Reorder sections
export const reorder = mutation({
  args: {
    landingPageId: v.id("landingPages"),
    sectionIds: v.array(v.id("sections")),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);
    const now = Date.now();

    // Verify ownership
    const page = await ctx.db.get(args.landingPageId);
    if (!page || page.userId !== user._id) {
      throw new Error("Landing page not found");
    }

    // Update order for each section
    for (let i = 0; i < args.sectionIds.length; i++) {
      const section = await ctx.db.get(args.sectionIds[i]);
      if (section && section.landingPageId === args.landingPageId) {
        await ctx.db.patch(args.sectionIds[i], { order: i, updatedAt: now });
      }
    }

    // Update landing page timestamp
    await ctx.db.patch(args.landingPageId, { updatedAt: now });

    return { success: true };
  },
});

// Delete a section
export const remove = mutation({
  args: { id: v.id("sections") },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    const section = await ctx.db.get(args.id);
    if (!section) {
      throw new Error("Section not found");
    }

    // Verify ownership through landing page
    const page = await ctx.db.get(section.landingPageId);
    if (!page || page.userId !== user._id) {
      throw new Error("Section not found");
    }

    // Delete comments on this section
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_section", (q: any) => q.eq("sectionId", args.id))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete the section
    await ctx.db.delete(args.id);

    // Update landing page timestamp
    await ctx.db.patch(section.landingPageId, { updatedAt: Date.now() });

    return { success: true };
  },
});
