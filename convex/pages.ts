import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// Queries
// ============================================================================

export const listByWebsite = query({
  args: { websiteId: v.id("websites") },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
      .collect();

    return pages;
  },
});

export const get = query({
  args: { id: v.id("pages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    return page;
  },
});

export const getBySlug = query({
  args: {
    websiteId: v.id("websites"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("pages")
      .withIndex("by_slug", (q) =>
        q.eq("websiteId", args.websiteId).eq("slug", args.slug)
      )
      .unique();

    return page;
  },
});

export const getHomePage = query({
  args: { websiteId: v.id("websites") },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
      .collect();

    return pages.find((p) => p.isHomePage) || pages[0] || null;
  },
});

export const getWithSections = query({
  args: { id: v.id("pages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    if (!page) return null;

    const sections = await ctx.db
      .query("pageSections")
      .withIndex("by_page", (q) => q.eq("pageId", args.id))
      .collect();

    // Sort by order
    sections.sort((a, b) => a.order - b.order);

    return { ...page, sections };
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    websiteId: v.id("websites"),
    name: v.string(),
    slug: v.string(),
    pageType: v.union(
      v.literal("landing"),
      v.literal("about"),
      v.literal("contact"),
      v.literal("services"),
      v.literal("portfolio"),
      v.literal("blog-list"),
      v.literal("blog-post"),
      v.literal("dashboard"),
      v.literal("custom")
    ),
    isHomePage: v.optional(v.boolean()),
    meta: v.optional(
      v.object({
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        ogImage: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const website = await ctx.db.get(args.websiteId);
    if (!website) throw new Error("Website not found");

    // If this is set as home page, unset any existing home page
    if (args.isHomePage) {
      const existingPages = await ctx.db
        .query("pages")
        .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
        .collect();

      for (const page of existingPages) {
        if (page.isHomePage) {
          await ctx.db.patch(page._id, { isHomePage: false });
        }
      }
    }

    const pageId = await ctx.db.insert("pages", {
      websiteId: args.websiteId,
      name: args.name,
      slug: args.slug,
      pageType: args.pageType,
      meta: args.meta,
      isHomePage: args.isHomePage || false,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return pageId;
  },
});

export const update = mutation({
  args: {
    id: v.id("pages"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    pageType: v.optional(
      v.union(
        v.literal("landing"),
        v.literal("about"),
        v.literal("contact"),
        v.literal("services"),
        v.literal("portfolio"),
        v.literal("blog-list"),
        v.literal("blog-post"),
        v.literal("dashboard"),
        v.literal("custom")
      )
    ),
    meta: v.optional(
      v.object({
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        ogImage: v.optional(v.string()),
      })
    ),
    themeOverrides: v.optional(
      v.object({
        backgroundColor: v.optional(v.string()),
        textColor: v.optional(v.string()),
      })
    ),
    isHomePage: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const page = await ctx.db.get(id);
    if (!page) throw new Error("Page not found");

    // If setting as home page, unset any existing home page
    if (args.isHomePage) {
      const existingPages = await ctx.db
        .query("pages")
        .withIndex("by_website", (q) => q.eq("websiteId", page.websiteId))
        .collect();

      for (const p of existingPages) {
        if (p.isHomePage && p._id !== id) {
          await ctx.db.patch(p._id, { isHomePage: false });
        }
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("pages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    if (!page) throw new Error("Page not found");

    // Delete all sections for this page
    const sections = await ctx.db
      .query("pageSections")
      .withIndex("by_page", (q) => q.eq("pageId", args.id))
      .collect();

    for (const section of sections) {
      await ctx.db.delete(section._id);
    }

    // Delete the page
    await ctx.db.delete(args.id);

    return args.id;
  },
});

export const duplicate = mutation({
  args: { id: v.id("pages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.id);
    if (!page) throw new Error("Page not found");

    // Create new page
    const newPageId = await ctx.db.insert("pages", {
      websiteId: page.websiteId,
      name: `${page.name} (Copy)`,
      slug: `${page.slug}-copy`,
      pageType: page.pageType,
      meta: page.meta,
      themeOverrides: page.themeOverrides,
      isHomePage: false,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Duplicate all sections
    const sections = await ctx.db
      .query("pageSections")
      .withIndex("by_page", (q) => q.eq("pageId", args.id))
      .collect();

    for (const section of sections) {
      await ctx.db.insert("pageSections", {
        pageId: newPageId,
        name: section.name,
        composition: section.composition,
        order: section.order,
        isVisible: section.isVisible,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return newPageId;
  },
});

export const reorderPages = mutation({
  args: {
    websiteId: v.id("websites"),
    pageIds: v.array(v.id("pages")),
  },
  handler: async (ctx, args) => {
    // This is mainly for UI ordering in the page list
    // We could add an "order" field to pages if needed
    return args.pageIds;
  },
});
