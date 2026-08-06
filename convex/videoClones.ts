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
    const clones = await ctx.db
      .query("videoClones")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(40)
    return Promise.all(
      clones.map(async (clone) => {
        const character = await ctx.db.get(clone.characterId)
        return {
          ...clone,
          characterName: character?.name ?? "Deleted character",
          characterImageUrl: character
            ? publicAssetUrl(character.primaryImageKey)
            : null,
          sourceVideoUrl: publicAssetUrl(clone.sourceVideoKey),
          outputVideoUrl: clone.outputVideoKey
            ? publicAssetUrl(clone.outputVideoKey)
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
    const cloneId = await ctx.db.insert("videoClones", {
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
      { cloneId },
      { retry: false }
    )
    return cloneId
  },
})

export const internalGetGenerationContext = internalQuery({
  args: { cloneId: v.id("videoClones") },
  handler: async (ctx, args) => {
    const clone = await ctx.db.get(args.cloneId)
    if (!clone) throw new Error("Video clone not found")
    const character = await ctx.db.get(clone.characterId)
    if (!character) throw new Error("Character not found")
    return { clone, character }
  },
})

export const internalSetProcessing = internalMutation({
  args: { cloneId: v.id("videoClones") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cloneId, {
      status: "processing",
      error: undefined,
      updatedAt: Date.now(),
    })
  },
})

export const internalComplete = internalMutation({
  args: {
    cloneId: v.id("videoClones"),
    outputVideoKey: v.string(),
    providerRequestId: v.optional(v.string()),
    elapsedMs: v.number(),
  },
  handler: async (ctx, args) => {
    const clone = await ctx.db.get(args.cloneId)
    if (!clone) return
    await ctx.db.patch(args.cloneId, {
      status: "completed",
      outputVideoKey: args.outputVideoKey,
      providerRequestId: args.providerRequestId,
      updatedAt: Date.now(),
    })
    await ctx.db.insert("usage", {
      userId: clone.userId,
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
    cloneId: v.id("videoClones"),
    error: v.string(),
    elapsedMs: v.number(),
  },
  handler: async (ctx, args) => {
    const clone = await ctx.db.get(args.cloneId)
    if (!clone) return
    await ctx.db.patch(args.cloneId, {
      status: "failed",
      error: args.error,
      updatedAt: Date.now(),
    })
    await ctx.db.insert("usage", {
      userId: clone.userId,
      operation: "video_clone",
      provider: "fal",
      model: "fal-ai/kling-video/o3/pro/video-to-video/edit",
      status: "failed",
      elapsedMs: args.elapsedMs,
      createdAt: Date.now(),
    })
  },
})
