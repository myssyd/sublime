"use node"

import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"
import { action, type ActionCtx } from "./_generated/server"
import { authComponent } from "./auth"
import { r2 } from "./assets"
import { parseInstagramReelUrl } from "./lib/instagram"
import {
  detectVideoFormat,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  MIN_VIDEO_SECONDS,
  readMp4Duration,
} from "./lib/videoValidation"

const UUID_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/source\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ValidatedSource = {
  sourceVideoKey: string
  sourceFileName: string
  sourceKind: "upload" | "instagram"
  sourceUrl?: string
  sourceDurationSeconds: number
  sourceFileSize: number
}

function isOwnedStagedVideoKey(userId: string, key: string) {
  const prefix = `users/${userId}/videos/`
  return key.startsWith(prefix) && UUID_PATH.test(key.slice(prefix.length))
}

function cleanFileName(value: string) {
  const fileName = value
    .replace(/[\\/\0\r\n]/g, "-")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 180)
  if (!fileName) throw new Error("Source filename is required")
  return fileName
}

async function validateUploadedSource(
  ctx: ActionCtx,
  userId: string,
  sourceVideoKey: string,
  sourceFileName: string
): Promise<ValidatedSource> {
  if (!isOwnedStagedVideoKey(userId, sourceVideoKey)) {
    throw new Error("Uploaded video does not belong to this account")
  }
  const object = await r2.getMetadata(ctx, sourceVideoKey)
  if (
    !object ||
    object.size === undefined ||
    object.size <= 0 ||
    object.size > MAX_VIDEO_BYTES
  ) {
    throw new Error("Uploaded video must be smaller than 200 MB")
  }

  const response = await fetch(
    await r2.getUrl(sourceVideoKey, { expiresIn: 5 * 60 }),
    { redirect: "error" }
  )
  if (!response.ok) {
    throw new Error(`Could not validate the uploaded video (${response.status})`)
  }
  const blob = await response.blob()
  if (blob.size !== object.size || blob.size > MAX_VIDEO_BYTES) {
    throw new Error("Uploaded video size does not match its R2 metadata")
  }
  const format = detectVideoFormat(
    new Uint8Array(await blob.slice(0, 16).arrayBuffer())
  )
  if (format !== "mp4") {
    throw new Error("Kling requires an MP4 or MOV reference video")
  }
  const durationSeconds = await readMp4Duration(blob)
  if (
    durationSeconds < MIN_VIDEO_SECONDS ||
    durationSeconds > MAX_VIDEO_SECONDS
  ) {
    throw new Error("Reference videos must be between 3 and 10 seconds")
  }

  const verifiedKey = `users/${userId}/videos/${crypto.randomUUID()}/source/reference.mp4`
  await r2.store(ctx, blob, {
    key: verifiedKey,
    type: "video/mp4",
    cacheControl: "public, max-age=31536000, immutable",
  })
  await r2.deleteObject(ctx, sourceVideoKey)

  return {
    sourceVideoKey: verifiedKey,
    sourceFileName: cleanFileName(sourceFileName),
    sourceKind: "upload",
    sourceDurationSeconds: durationSeconds,
    sourceFileSize: blob.size,
  }
}

async function validateInstagramSource(
  ctx: ActionCtx,
  sourceVideoKey: string,
  sourceUrl: string | undefined
): Promise<ValidatedSource> {
  if (!sourceUrl) throw new Error("Instagram source URL is required")
  const reel = parseInstagramReelUrl(sourceUrl)
  const source = await ctx.runQuery(
    internal.videoSources.internalGetReadyInstagramSource,
    { externalId: reel.shortcode }
  )
  if (
    !source ||
    source.sourceUrl !== reel.url ||
    source.videoKey !== sourceVideoKey
  ) {
    throw new Error("Fetch this Instagram Reel before cloning it")
  }
  const object = await r2.getMetadata(ctx, source.videoKey)
  if (
    !object ||
    object.size === undefined ||
    object.size !== source.fileSize ||
    object.size <= 0 ||
    object.size > MAX_VIDEO_BYTES
  ) {
    throw new Error("The cached Instagram Reel is unavailable")
  }
  if (
    source.durationSeconds < MIN_VIDEO_SECONDS ||
    source.durationSeconds > MAX_VIDEO_SECONDS
  ) {
    throw new Error("The cached Instagram Reel has an unsupported duration")
  }

  return {
    sourceVideoKey: source.videoKey,
    sourceFileName: source.fileName,
    sourceKind: "instagram",
    sourceUrl: source.sourceUrl,
    sourceDurationSeconds: source.durationSeconds,
    sourceFileSize: source.fileSize,
  }
}

export const createAndQueue = action({
  args: {
    characterId: v.id("characters"),
    characterImageKey: v.string(),
    sourceVideoKey: v.string(),
    sourceFileName: v.string(),
    sourceKind: v.union(v.literal("upload"), v.literal("instagram")),
    sourceUrl: v.optional(v.string()),
    prompt: v.string(),
    keepAudio: v.boolean(),
  },
  handler: async (ctx, args): Promise<Id<"videos">> => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const prompt = args.prompt.trim()
    if (prompt.length > 2_000) throw new Error("Direction is too long")

    const character = await ctx.runQuery(internal.characters.internalGetOwned, {
      id: args.characterId,
      userId: user._id,
    })
    if (
      !character ||
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

    const source =
      args.sourceKind === "upload"
        ? await validateUploadedSource(
            ctx,
            user._id,
            args.sourceVideoKey,
            args.sourceFileName
          )
        : await validateInstagramSource(
            ctx,
            args.sourceVideoKey,
            args.sourceUrl
          )

    try {
      return await ctx.runMutation(internal.videos.internalCreateAndQueue, {
        userId: user._id,
        characterId: args.characterId,
        characterImageKey: args.characterImageKey,
        ...source,
        prompt,
        keepAudio: args.keepAudio,
      })
    } catch (error) {
      if (source.sourceKind === "upload") {
        await r2.deleteObject(ctx, source.sourceVideoKey)
      }
      throw error
    }
  },
})
