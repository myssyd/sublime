import { v } from "convex/values"
import { authComponent } from "./auth"
import { publicAssetUrl } from "./assets"
import { videoPool } from "./jobs"
import { internal } from "./_generated/api"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []
    const videos = await ctx.db
      .query("videos")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(40)
    return Promise.all(
      videos.map(async (video) => {
        const character = await ctx.db.get(video.characterId)
        return {
          ...video,
          characterName: character?.name ?? "Deleted character",
          characterImageUrl: character
            ? publicAssetUrl(character.primaryImageKey)
            : null,
          sourceVideoUrl: publicAssetUrl(video.sourceVideoKey),
          outputVideoUrl: video.outputVideoKey
            ? publicAssetUrl(video.outputVideoKey)
            : null,
        }
      })
    )
  },
})

export const createAndQueue = mutation({
  args: {
    characterId: v.id("characters"),
    sourceVideoKey: v.string(),
    sourceFileName: v.string(),
    prompt: v.string(),
    keepAudio: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const character = await ctx.db.get(args.characterId)
    if (!character || character.userId !== user._id) {
      throw new Error("Character not found")
    }
    const now = Date.now()
    const videoId = await ctx.db.insert("videos", {
      userId: user._id,
      characterId: args.characterId,
      sourceVideoKey: args.sourceVideoKey,
      sourceFileName: args.sourceFileName,
      prompt: args.prompt.trim(),
      keepAudio: args.keepAudio,
      provider: "fal-kling-o3-pro",
      status: "queued",
      createdAt: now,
      updatedAt: now,
    })
    await videoPool.enqueueAction(
      ctx,
      internal.videoGeneration.generateClone,
      { videoId },
      { retry: false }
    )
    return videoId
  },
})

export const internalGetGenerationContext = internalQuery({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId)
    if (!video) throw new Error("Video not found")
    const character = await ctx.db.get(video.characterId)
    if (!character) throw new Error("Character not found")
    return { video, character }
  },
})

export const internalSetProcessing = internalMutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.videoId, {
      status: "processing",
      error: undefined,
      updatedAt: Date.now(),
    })
  },
})

export const internalComplete = internalMutation({
  args: {
    videoId: v.id("videos"),
    outputVideoKey: v.string(),
    providerRequestId: v.optional(v.string()),
    elapsedMs: v.number(),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId)
    if (!video) return
    await ctx.db.patch(args.videoId, {
      status: "completed",
      outputVideoKey: args.outputVideoKey,
      providerRequestId: args.providerRequestId,
      updatedAt: Date.now(),
    })
    await ctx.db.insert("usage", {
      userId: video.userId,
      operation: "video_clone",
      provider: "fal",
      model: "fal-ai/kling-video/o3/pro/video-to-video/edit",
      status: "completed",
      providerRequestId: args.providerRequestId,
      elapsedMs: args.elapsedMs,
      createdAt: Date.now(),
    })
  },
})

export const internalFail = internalMutation({
  args: {
    videoId: v.id("videos"),
    error: v.string(),
    elapsedMs: v.number(),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId)
    if (!video) return
    await ctx.db.patch(args.videoId, {
      status: "failed",
      error: args.error,
      updatedAt: Date.now(),
    })
    await ctx.db.insert("usage", {
      userId: video.userId,
      operation: "video_clone",
      provider: "fal",
      model: "fal-ai/kling-video/o3/pro/video-to-video/edit",
      status: "failed",
      elapsedMs: args.elapsedMs,
      createdAt: Date.now(),
    })
  },
})
