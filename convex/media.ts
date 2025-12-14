import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./auth";

// List all media for current user
export const list = query({
  args: {},
  handler: async (ctx: any) => {
    const user = await getAuthUser(ctx);

    const media = await ctx.db
      .query("media")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return media;
  },
});

// Get media by tag
export const listByTag = query({
  args: { tag: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    const allMedia = await ctx.db
      .query("media")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    return allMedia.filter((m: any) => m.tags.includes(args.tag));
  },
});

// Get a single media item
export const get = query({
  args: { id: v.id("media") },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    const media = await ctx.db.get(args.id);
    if (!media || media.userId !== user._id) {
      return null;
    }

    return media;
  },
});

// Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx: any) => {
    await getAuthUser(ctx); // Ensure authenticated
    return await ctx.storage.generateUploadUrl();
  },
});

// Create media record after upload
export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    tags: v.array(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    // Get the URL for the uploaded file
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get storage URL");
    }

    const mediaId = await ctx.db.insert("media", {
      userId: user._id,
      storageId: args.storageId,
      url,
      filename: args.filename,
      mimeType: args.mimeType,
      tags: args.tags,
      width: args.width,
      height: args.height,
      createdAt: Date.now(),
    });

    return { mediaId, url };
  },
});

// Update media tags
export const updateTags = mutation({
  args: {
    id: v.id("media"),
    tags: v.array(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    const media = await ctx.db.get(args.id);
    if (!media || media.userId !== user._id) {
      throw new Error("Media not found");
    }

    await ctx.db.patch(args.id, { tags: args.tags });

    return { success: true };
  },
});

// Store extracted colors (for logos)
export const setExtractedColors = mutation({
  args: {
    id: v.id("media"),
    colors: v.array(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    const media = await ctx.db.get(args.id);
    if (!media || media.userId !== user._id) {
      throw new Error("Media not found");
    }

    await ctx.db.patch(args.id, { extractedColors: args.colors });

    return { success: true };
  },
});

// Delete media
export const remove = mutation({
  args: { id: v.id("media") },
  handler: async (ctx: any, args: any) => {
    const user = await getAuthUser(ctx);

    const media = await ctx.db.get(args.id);
    if (!media || media.userId !== user._id) {
      throw new Error("Media not found");
    }

    // Delete from storage
    await ctx.storage.delete(media.storageId);

    // Delete record
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
