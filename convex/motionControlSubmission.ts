"use node"

import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"
import { action } from "./_generated/server"
import { authComponent } from "./auth"
import { r2 } from "./assets"
import { characterImageSourceValidator } from "./lib/image"
import {
  detectVideoFormat,
  MAX_VIDEO_BYTES,
  MIN_VIDEO_SECONDS,
  readMp4Duration,
} from "./lib/videoValidation"

const MAX_MOTION_VIDEO_SECONDS = 30
const UUID_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/source\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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
  if (!fileName) throw new Error("Motion filename is required")
  return fileName
}

export const createAndQueue = action({
  args: {
    characterId: v.id("characters"),
    characterImage: characterImageSourceValidator,
    sourceVideoKey: v.string(),
    sourceFileName: v.string(),
    prompt: v.string(),
    keepAudio: v.boolean(),
    characterOrientation: v.union(v.literal("video"), v.literal("image")),
  },
  handler: async (ctx, args): Promise<Id<"videos">> => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const prompt = args.prompt.trim()
    if (prompt.length > 2_000) throw new Error("Direction is too long")
    if (!isOwnedStagedVideoKey(user._id, args.sourceVideoKey)) {
      throw new Error("Uploaded motion video does not belong to this account")
    }

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
    const imageIsOwned =
      args.characterImage.kind === "identity"
        ? [character.primaryImageKey, ...character.referenceImageKeys].includes(
            args.characterImage.key
          )
        : Boolean(
            await ctx.runQuery(internal.images.internalGetOwned, {
              id: args.characterImage.imageId,
              userId: user._id,
              characterId: args.characterId,
            })
          )
    if (!imageIsOwned) {
      throw new Error("Selected character image not found")
    }

    const object = await r2.getMetadata(ctx, args.sourceVideoKey)
    if (
      !object ||
      object.size === undefined ||
      object.size <= 0 ||
      object.size > MAX_VIDEO_BYTES
    ) {
      throw new Error("Motion video must be smaller than 200 MB")
    }
    const response = await fetch(
      await r2.getUrl(args.sourceVideoKey, { expiresIn: 5 * 60 }),
      { redirect: "error" }
    )
    if (!response.ok) {
      throw new Error(`Could not validate the motion video (${response.status})`)
    }
    const blob = await response.blob()
    if (blob.size !== object.size || blob.size > MAX_VIDEO_BYTES) {
      throw new Error("Uploaded video size does not match its R2 metadata")
    }
    const format = detectVideoFormat(
      new Uint8Array(await blob.slice(0, 16).arrayBuffer())
    )
    if (format !== "mp4") {
      throw new Error("Kling requires an MP4 or MOV motion video")
    }
    const durationSeconds = await readMp4Duration(blob)
    const maxDuration =
      args.characterOrientation === "video" ? MAX_MOTION_VIDEO_SECONDS : 10
    if (
      durationSeconds < MIN_VIDEO_SECONDS ||
      durationSeconds > maxDuration
    ) {
      throw new Error(
        args.characterOrientation === "video"
          ? "Motion videos must be between 3 and 30 seconds"
          : "Image-oriented motion videos must be between 3 and 10 seconds"
      )
    }

    const verifiedKey = `users/${user._id}/videos/${crypto.randomUUID()}/source/motion.mp4`
    await r2.store(ctx, blob, {
      key: verifiedKey,
      type: "video/mp4",
      cacheControl: "public, max-age=31536000, immutable",
    })
    await r2.deleteObject(ctx, args.sourceVideoKey)

    try {
      return await ctx.runMutation(
        internal.videos.internalCreateMotionControlAndQueue,
        {
          userId: user._id,
          characterId: args.characterId,
          characterImage: args.characterImage,
          sourceVideoKey: verifiedKey,
          sourceFileName: cleanFileName(args.sourceFileName),
          sourceDurationSeconds: durationSeconds,
          sourceFileSize: blob.size,
          prompt,
          keepAudio: args.keepAudio,
          characterOrientation: args.characterOrientation,
        }
      )
    } catch (error) {
      await r2.deleteObject(ctx, verifiedKey)
      throw error
    }
  },
})
