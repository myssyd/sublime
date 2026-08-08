import { v } from "convex/values"
import { paginationOptsValidator } from "convex/server"
import type { Id } from "./_generated/dataModel"
import { authComponent } from "./auth"
import { publicAssetUrl } from "./assets"
import { videoPool } from "./jobs"
import { internal } from "./_generated/api"
import {
  lipSyncCreditsForDuration,
  motionControlCreditsForDuration,
  videoCreditsForDuration,
} from "./billing"
import { reserveCredits } from "./credits"
import {
  characterImageSourceValidator,
  type CharacterImageSource,
} from "./lib/image"
import {
  VIDEO_MODEL_MIN_SOURCE_SECONDS,
  videoModelValidator,
  type VideoModel,
} from "./lib/videoModel"
import {
  internalMutation,
  internalQuery,
  query,
  type MutationCtx,
} from "./_generated/server"

function providerForVideoModel(model: VideoModel) {
  if (model === "seedance-2.0-fast") return "fal-seedance-2.0-fast" as const
  if (model === "seedance-2.5") return "fal-seedance-2.5" as const
  return "fal-kling-o3-pro" as const
}

async function resolveCharacterImage(
  ctx: MutationCtx,
  args: {
    userId: string
    characterId: Id<"characters">
    source: CharacterImageSource
    primaryImageKey: string
    referenceImageKeys: string[]
  }
): Promise<{ key: string; imageId?: Id<"images"> } | null> {
  if (args.source.kind === "identity") {
    return args.source.key === args.primaryImageKey ||
      args.referenceImageKeys.includes(args.source.key)
      ? { key: args.source.key }
      : null
  }
  const image = await ctx.db.get(args.source.imageId)
  return (
    image?.userId === args.userId && image.characterId === args.characterId
  )
    ? { key: image.key, imageId: image._id }
    : null
}

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
          sourceVideoUrl: video.sourceVideoKey
            ? publicAssetUrl(video.sourceVideoKey)
            : null,
          outputVideoUrl: video.outputVideoKey
            ? publicAssetUrl(video.outputVideoKey)
            : null,
        }
      })
    )
  },
})

export const listForCharacter = query({
  args: { characterId: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []
    const characterId = ctx.db.normalizeId("characters", args.characterId)
    if (!characterId) return []
    const character = await ctx.db.get(characterId)
    if (!character || character.userId !== user._id) return []
    const videos = await ctx.db
      .query("videos")
      .withIndex("by_user_character", (q) =>
        q.eq("userId", user._id).eq("characterId", characterId)
      )
      .order("desc")
      .take(12)

    return videos.map((video) => ({
      ...video,
      sourceVideoUrl: video.sourceVideoKey
        ? publicAssetUrl(video.sourceVideoKey)
        : null,
      outputVideoUrl: video.outputVideoKey
        ? publicAssetUrl(video.outputVideoKey)
        : null,
    }))
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
            sourceVideoUrl: video.sourceVideoKey
              ? publicAssetUrl(video.sourceVideoKey)
              : null,
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
    characterImage: characterImageSourceValidator,
    sourceVideoKey: v.string(),
    sourceFileName: v.string(),
    sourceKind: v.union(v.literal("upload"), v.literal("instagram")),
    sourceUrl: v.optional(v.string()),
    sourceDurationSeconds: v.number(),
    sourceFileSize: v.number(),
    prompt: v.string(),
    keepAudio: v.boolean(),
    model: videoModelValidator,
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
    const characterImage = await resolveCharacterImage(ctx, {
      userId: args.userId,
      characterId: args.characterId,
      source: args.characterImage,
      primaryImageKey: character.primaryImageKey,
      referenceImageKeys: character.referenceImageKeys,
    })
    if (!characterImage) {
      throw new Error("Selected character image not found")
    }
    if (
      args.sourceDurationSeconds < VIDEO_MODEL_MIN_SOURCE_SECONDS[args.model] ||
      args.sourceDurationSeconds > 10
    ) {
      throw new Error(
        args.model === "kling-o3-pro"
          ? "Reference videos must be between 3 and 10 seconds"
          : "Seedance reference videos must be between 4 and 10 seconds"
      )
    }
    if (args.sourceFileSize > 200 * 1024 * 1024) {
      throw new Error("Reference videos must be smaller than 200 MB")
    }
    const now = Date.now()
    const videoId = await ctx.db.insert("videos", {
      userId: args.userId,
      characterId: args.characterId,
      videoKind: "reel_clone",
      characterImageKey: characterImage.key,
      characterImageId: characterImage.imageId,
      sourceVideoKey: args.sourceVideoKey,
      sourceFileName: args.sourceFileName,
      sourceKind: args.sourceKind,
      sourceUrl: args.sourceUrl,
      sourceDurationSeconds: args.sourceDurationSeconds,
      sourceFileSize: args.sourceFileSize,
      prompt: args.prompt.trim(),
      keepAudio: args.keepAudio,
      model: args.model,
      provider: providerForVideoModel(args.model),
      status: "queued",
      createdAt: now,
      updatedAt: now,
    })
    await ctx.db.patch(args.characterId, {
      videoCount: character.videoCount + 1,
      updatedAt: now,
    })
    const creditReservationKey = `video-clone:${videoId}`
    const credits = videoCreditsForDuration(
      args.sourceDurationSeconds,
      args.model
    )
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

export const internalCreateMotionControlAndQueue = internalMutation({
  args: {
    userId: v.string(),
    characterId: v.id("characters"),
    characterImage: characterImageSourceValidator,
    sourceVideoKey: v.string(),
    sourceFileName: v.string(),
    sourceDurationSeconds: v.number(),
    sourceFileSize: v.number(),
    prompt: v.string(),
    keepAudio: v.boolean(),
    characterOrientation: v.union(v.literal("video"), v.literal("image")),
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
    const characterImage = await resolveCharacterImage(ctx, {
      userId: args.userId,
      characterId: args.characterId,
      source: args.characterImage,
      primaryImageKey: character.primaryImageKey,
      referenceImageKeys: character.referenceImageKeys,
    })
    if (!characterImage) {
      throw new Error("Selected character image not found")
    }
    const maxDuration = args.characterOrientation === "video" ? 30 : 10
    if (
      args.sourceDurationSeconds < 3 ||
      args.sourceDurationSeconds > maxDuration
    ) {
      throw new Error(
        args.characterOrientation === "video"
          ? "Motion videos must be between 3 and 30 seconds"
          : "Image-oriented motion videos must be between 3 and 10 seconds"
      )
    }
    if (args.sourceFileSize > 200 * 1024 * 1024) {
      throw new Error("Motion videos must be smaller than 200 MB")
    }

    const now = Date.now()
    const videoId = await ctx.db.insert("videos", {
      userId: args.userId,
      characterId: args.characterId,
      videoKind: "motion_control",
      characterImageKey: characterImage.key,
      characterImageId: characterImage.imageId,
      sourceVideoKey: args.sourceVideoKey,
      sourceFileName: args.sourceFileName,
      sourceKind: "upload",
      sourceDurationSeconds: args.sourceDurationSeconds,
      sourceFileSize: args.sourceFileSize,
      prompt: args.prompt.trim(),
      keepAudio: args.keepAudio,
      characterOrientation: args.characterOrientation,
      provider: "fal-kling-v3-standard-motion-control",
      status: "queued",
      createdAt: now,
      updatedAt: now,
    })
    await ctx.db.patch(args.characterId, {
      videoCount: character.videoCount + 1,
      updatedAt: now,
    })
    const creditReservationKey = `motion-control:${videoId}`
    const credits = motionControlCreditsForDuration(
      args.sourceDurationSeconds
    )
    await reserveCredits(ctx, {
      userId: args.userId,
      credits,
      reservationKey: creditReservationKey,
      kind: "motion_control",
      refId: videoId,
    })
    await ctx.db.patch(videoId, {
      creditReservationKey,
      creditsCharged: credits,
    })
    await videoPool.enqueueAction(
      ctx,
      internal.videoGeneration.generateMotionControl,
      { videoId },
      { retry: false }
    )
    return videoId
  },
})

export const internalCreateLipSyncAndQueue = internalMutation({
  args: {
    userId: v.string(),
    characterId: v.id("characters"),
    characterImage: characterImageSourceValidator,
    sourceAudioKey: v.string(),
    sourceAudioContentType: v.string(),
    sourceFileName: v.string(),
    sourceDurationSeconds: v.number(),
    sourceFileSize: v.number(),
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
    const characterImage = await resolveCharacterImage(ctx, {
      userId: args.userId,
      characterId: args.characterId,
      source: args.characterImage,
      primaryImageKey: character.primaryImageKey,
      referenceImageKeys: character.referenceImageKeys,
    })
    if (!characterImage) {
      throw new Error("Selected character image not found")
    }
    if (
      args.sourceDurationSeconds < 2 ||
      args.sourceDurationSeconds > 60
    ) {
      throw new Error("Audio must be between 2 and 60 seconds")
    }
    if (args.sourceFileSize > 20 * 1024 * 1024) {
      throw new Error("Audio must be smaller than 20 MB")
    }

    const now = Date.now()
    const videoId = await ctx.db.insert("videos", {
      userId: args.userId,
      characterId: args.characterId,
      videoKind: "lip_sync",
      characterImageKey: characterImage.key,
      characterImageId: characterImage.imageId,
      sourceAudioKey: args.sourceAudioKey,
      sourceAudioContentType: args.sourceAudioContentType,
      sourceFileName: args.sourceFileName,
      sourceKind: "upload",
      sourceDurationSeconds: args.sourceDurationSeconds,
      sourceFileSize: args.sourceFileSize,
      prompt: "",
      keepAudio: true,
      provider: "fal-sync-lipsync-v3",
      status: "queued",
      createdAt: now,
      updatedAt: now,
    })
    await ctx.db.patch(args.characterId, {
      videoCount: character.videoCount + 1,
      updatedAt: now,
    })
    const creditReservationKey = `lip-sync:${videoId}`
    const credits = lipSyncCreditsForDuration(args.sourceDurationSeconds)
    await reserveCredits(ctx, {
      userId: args.userId,
      credits,
      reservationKey: creditReservationKey,
      kind: "lip_sync",
      refId: videoId,
    })
    await ctx.db.patch(videoId, {
      creditReservationKey,
      creditsCharged: credits,
    })
    await videoPool.enqueueAction(
      ctx,
      internal.videoGeneration.generateLipSync,
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
