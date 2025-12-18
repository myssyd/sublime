import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// Queries
// ============================================================================

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) return [];

    const websites = await ctx.db
      .query("websites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return websites;
  },
});

export const get = query({
  args: { id: v.id("websites") },
  handler: async (ctx, args) => {
    const website = await ctx.db.get(args.id);
    return website;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const website = await ctx.db
      .query("websites")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return website;
  },
});

export const getWithPages = query({
  args: { id: v.id("websites") },
  handler: async (ctx, args) => {
    const website = await ctx.db.get(args.id);
    if (!website) return null;

    const pages = await ctx.db
      .query("pages")
      .withIndex("by_website", (q) => q.eq("websiteId", args.id))
      .collect();

    return { ...website, pages };
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
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
      borderRadius: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) throw new Error("User not found");

    // Generate slug if not provided
    const slug =
      args.slug ||
      args.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const websiteId = await ctx.db.insert("websites", {
      userId: user._id,
      name: args.name,
      slug,
      businessContext: args.businessContext,
      theme: args.theme,
      navigation: {
        links: [],
      },
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Increment pages created count
    await ctx.db.patch(user._id, {
      usage: {
        ...user.usage,
        pagesCreated: user.usage.pagesCreated + 1,
      },
    });

    return websiteId;
  },
});

export const update = mutation({
  args: {
    id: v.id("websites"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
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
        borderRadius: v.optional(v.string()),
      })
    ),
    navigation: v.optional(
      v.object({
        logo: v.optional(v.string()),
        logoText: v.optional(v.string()),
        links: v.array(
          v.object({
            label: v.string(),
            pageId: v.optional(v.id("pages")),
            url: v.optional(v.string()),
            isExternal: v.optional(v.boolean()),
          })
        ),
        ctaButton: v.optional(
          v.object({
            text: v.string(),
            pageId: v.optional(v.id("pages")),
            url: v.optional(v.string()),
          })
        ),
      })
    ),
    footer: v.optional(v.any()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const website = await ctx.db.get(id);
    if (!website) throw new Error("Website not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("websites") },
  handler: async (ctx, args) => {
    const website = await ctx.db.get(args.id);
    if (!website) throw new Error("Website not found");

    // Delete all pages
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_website", (q) => q.eq("websiteId", args.id))
      .collect();

    for (const page of pages) {
      // Delete all sections for this page
      const sections = await ctx.db
        .query("pageSections")
        .withIndex("by_page", (q) => q.eq("pageId", page._id))
        .collect();

      for (const section of sections) {
        await ctx.db.delete(section._id);
      }

      await ctx.db.delete(page._id);
    }

    // Delete the website
    await ctx.db.delete(args.id);

    return args.id;
  },
});

export const publish = mutation({
  args: { id: v.id("websites") },
  handler: async (ctx, args) => {
    const website = await ctx.db.get(args.id);
    if (!website) throw new Error("Website not found");

    await ctx.db.patch(args.id, {
      status: "published",
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const unpublish = mutation({
  args: { id: v.id("websites") },
  handler: async (ctx, args) => {
    const website = await ctx.db.get(args.id);
    if (!website) throw new Error("Website not found");

    await ctx.db.patch(args.id, {
      status: "draft",
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
