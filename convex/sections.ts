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
    templateId: v.optional(v.string()),
    styleOverrides: v.optional(
      v.object({
        section: v.optional(v.string()),
        elements: v.optional(v.any()),
      })
    ),
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
      templateId: args.templateId,
      order: args.order,
      isVisible: true,
      content: args.content,
      styleOverrides: args.styleOverrides,
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
    templateId: v.optional(v.string()),
    order: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
    content: v.optional(v.any()),
    styleOverrides: v.optional(
      v.object({
        section: v.optional(v.string()),
        elements: v.optional(v.any()),
      })
    ),
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

// Switch section template
export const switchTemplate = mutation({
  args: {
    id: v.id("sections"),
    templateId: v.string(),
    mappedContent: v.optional(v.any()),
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

    // Update template and optionally content
    const updates: Record<string, unknown> = {
      templateId: args.templateId,
      updatedAt: now,
    };

    // If mapped content is provided (from AI), use it
    if (args.mappedContent !== undefined) {
      updates.content = args.mappedContent;
    }

    // Clear style overrides when switching templates (they may not apply)
    updates.styleOverrides = undefined;

    await ctx.db.patch(args.id, updates);

    // Update landing page timestamp
    await ctx.db.patch(section.landingPageId, { updatedAt: now });

    return { success: true };
  },
});

// Update section style overrides
export const updateStyleOverrides = mutation({
  args: {
    id: v.id("sections"),
    styleOverrides: v.object({
      section: v.optional(v.string()),
      elements: v.optional(v.any()),
    }),
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
      throw new Error("Unauthorized: Section not found");
    }

    // Get existing overrides
    const existingOverrides = section.styleOverrides || {};
    const existingElements = existingOverrides.elements || {};
    const incomingElements = args.styleOverrides.elements || {};

    // Build new overrides, preserving existing unless explicitly overridden
    const newOverrides: { section?: string; elements?: Record<string, string> } = {};

    // Handle section-level overrides
    // If incoming section is provided and non-empty, use it
    // If incoming section is undefined, keep existing
    // If incoming section is empty string, this intentionally clears it
    if (args.styleOverrides.section !== undefined) {
      if (args.styleOverrides.section && args.styleOverrides.section.trim()) {
        newOverrides.section = args.styleOverrides.section;
      }
      // else: explicitly clearing section (empty string passed)
    } else if (existingOverrides.section) {
      // Preserve existing section if no new value provided
      newOverrides.section = existingOverrides.section;
    }

    // Handle element-level overrides - merge additively
    const mergedElements: Record<string, string> = { ...existingElements };
    for (const [selector, classes] of Object.entries(incomingElements)) {
      if (typeof classes === "string" && classes.trim()) {
        // Add or update this selector's classes
        mergedElements[selector] = classes;
      }
      // Note: To remove a selector, you'd pass empty string or use a separate mutation
    }

    if (Object.keys(mergedElements).length > 0) {
      newOverrides.elements = mergedElements;
    }

    // Determine final value
    const finalOverrides =
      Object.keys(newOverrides).length > 0 ? newOverrides : undefined;

    await ctx.db.patch(args.id, {
      styleOverrides: finalOverrides,
      updatedAt: now,
    });

    // Update landing page timestamp
    await ctx.db.patch(section.landingPageId, { updatedAt: now });

    // Return the saved overrides for debugging
    return { success: true, styleOverrides: finalOverrides };
  },
});
