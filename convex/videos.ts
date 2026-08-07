import { v } from "convex/values"
import { paginationOptsValidator } from "convex/server"
import { authComponent } from "./auth"
import { publicAssetUrl } from "./assets"
import { videoPool } from "./jobs"
import { internal } from "./_generated/api"
import { videoCreditsForDuration } from "./billing"
import { reserveCredits } from "./credits"
import {
  internalMutation,
  internalQuery,
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
        const characterImageKey =
          video.characterImageKey ?? character?.primaryImageKey
        return {
          ...video,
          characterName: character?.name ?? "Deleted character",
          characterImageUrl: characterImageKey
            ? publicAssetUrl(characterImageKey)
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

export const listPage = query({
  args: {
    characterId: v.optional(v.id("characters")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      }
    }

    const videos = args.characterId
      ? ctx.db
          .query("videos")
          .withIndex("by_user_character", (q) =>
            q.eq("userId", user._id).eq("characterId", args.characterId!)
          )
          .order("desc")
      : ctx.db
          .query("videos")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
    const result = await videos.paginate(args.paginationOpts)

    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (video) => {
          const character = await ctx.db.get(video.characterId)
          const characterImageKey =
            video.characterImageKey ?? character?.primaryImageKey
          return {
            ...video,
            characterName: character?.name ?? "Deleted character",
            characterImageUrl: characterImageKey
              ? publicAssetUrl(characterImageKey)
              : null,
            sourceVideoUrl: publicAssetUrl(video.sourceVideoKey),
            outputVideoUrl: video.outputVideoKey
              ? publicAssetUrl(video.outputVideoKey)
              : null,
          }
        })
      ),
    }
  },
})

export const internalCreateAndQueue = internalMutation({
  args: {
    userId: v.string(),
    characterId: v.id("characters"),
    characterImageKey: v.string(),
    sourceVideoKey: v.string(),
    sourceFileName: v.string(),
    sourceKind: v.union(v.literal("upload"), v.literal("instagram")),
    sourceUrl: v.optional(v.string()),
    sourceDurationSeconds: v.number(),
    sourceFileSize: v.number(),
    prompt: v.string(),
    keepAudio: v.boolean(),
  },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.characterId)
    if (
      !character ||
      character.userId !== args.userId ||
      character.status === "draft" ||
      !character.primaryImageKey
    ) {
      throw new Error("Character not found")
    }
    const allowedCharacterImageKeys = new Set([
      character.primaryImageKey,
      ...character.referenceImageKeys,
      ...(character.creationImages ?? []).map((image) => image.key),
      ...(character.creationImageKeys ?? []),
    ])
    if (!allowedCharacterImageKeys.has(args.characterImageKey)) {
      throw new Error("Selected character image not found")
    }
    if (
      args.sourceDurationSeconds < 3 ||
      args.sourceDurationSeconds > 10
    ) {
      throw new Error("Reference videos must be between 3 and 10 seconds")
    }
    if (args.sourceFileSize > 200 * 1024 * 1024) {
      throw new Error("Reference videos must be smaller than 200 MB")
    }
    const now = Date.now()
    const videoId = await ctx.db.insert("videos", {
      userId: args.userId,
      characterId: args.characterId,
      characterImageKey: args.characterImageKey,
      sourceVideoKey: args.sourceVideoKey,
      sourceFileName: args.sourceFileName,
      sourceKind: args.sourceKind,
      sourceUrl: args.sourceUrl,
      sourceDurationSeconds: args.sourceDurationSeconds,
      sourceFileSize: args.sourceFileSize,
      prompt: args.prompt.trim(),
      keepAudio: args.keepAudio,
      provider: "fal-kling-o3-pro",
      status: "queued",
      createdAt: now,
      updatedAt: now,
    })
    const creditReservationKey = `video-clone:${videoId}`
    const credits = videoCreditsForDuration(args.sourceDurationSeconds)
    await reserveCredits(ctx, {
      userId: args.userId,
      credits,
      reservationKey: creditReservationKey,
      kind: "video_clone",
      refId: videoId,
    })
    await ctx.db.patch(videoId, {
      creditReservationKey,
      creditsCharged: credits,
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

export const internalMarkProviderSuccess = internalMutation({
  args: {
    videoId: v.id("videos"),
    providerRequestId: v.optional(v.string()),
    providerOutputUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.videoId, {
      providerRequestId: args.providerRequestId,
      providerOutputUrl: args.providerOutputUrl,
      updatedAt: Date.now(),
    })
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
      providerOutputUrl: undefined,
      updatedAt: Date.now(),
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
  },
})
