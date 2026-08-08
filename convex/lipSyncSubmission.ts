"use node"

import { parseBuffer } from "music-metadata"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"
import { action } from "./_generated/server"
import { authComponent } from "./auth"
import { r2 } from "./assets"

const MAX_AUDIO_BYTES = 20 * 1024 * 1024
const MIN_AUDIO_SECONDS = 2
const MAX_AUDIO_SECONDS = 60
const UUID_AUDIO_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/audio\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function cleanFileName(value: string) {
  const fileName = value
    .replace(/[\\/\0\r\n]/g, "-")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 180)
  if (!fileName) throw new Error("Audio filename is required")
  return fileName
}

function isOwnedStagedAudioKey(userId: string, key: string) {
  const prefix = `users/${userId}/videos/`
  return key.startsWith(prefix) && UUID_AUDIO_PATH.test(key.slice(prefix.length))
}

function normalizedAudioFormat(container: string | undefined) {
  const value = container?.toLowerCase() ?? ""
  if (value.includes("mpeg")) return { extension: "mp3", contentType: "audio/mpeg" }
  if (value.includes("wave") || value.includes("wav")) {
    return { extension: "wav", contentType: "audio/wav" }
  }
  if (value.includes("mp4") || value.includes("m4a")) {
    return { extension: "m4a", contentType: "audio/mp4" }
  }
  if (value.includes("aac")) return { extension: "aac", contentType: "audio/aac" }
  if (value.includes("ogg")) return { extension: "ogg", contentType: "audio/ogg" }
  throw new Error("Use an MP3, WAV, M4A, AAC, or OGG audio file")
}

export const createAndQueue = action({
  args: {
    characterId: v.id("characters"),
    characterImageKey: v.string(),
    sourceAudioKey: v.string(),
    sourceFileName: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"videos">> => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    if (!isOwnedStagedAudioKey(user._id, args.sourceAudioKey)) {
      throw new Error("Uploaded audio does not belong to this account")
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
    const allowedCharacterImageKeys = new Set([
      character.primaryImageKey,
      ...character.referenceImageKeys,
      ...(character.creationImages ?? []).map((image) => image.key),
      ...(character.creationImageKeys ?? []),
    ])
    if (!allowedCharacterImageKeys.has(args.characterImageKey)) {
      throw new Error("Selected character image not found")
    }

    const object = await r2.getMetadata(ctx, args.sourceAudioKey)
    if (
      !object ||
      object.size === undefined ||
      object.size <= 0 ||
      object.size > MAX_AUDIO_BYTES
    ) {
      throw new Error("Audio must be smaller than 20 MB")
    }
    const response = await fetch(
      await r2.getUrl(args.sourceAudioKey, { expiresIn: 5 * 60 }),
      { redirect: "error" }
    )
    if (!response.ok) {
      throw new Error(`Could not validate the uploaded audio (${response.status})`)
    }
    const blob = await response.blob()
    if (blob.size !== object.size || blob.size > MAX_AUDIO_BYTES) {
      throw new Error("Uploaded audio size does not match its R2 metadata")
    }

    let metadata
    try {
      metadata = await parseBuffer(
        new Uint8Array(await blob.arrayBuffer()),
        object.contentType,
        { duration: true, skipCovers: true }
      )
    } catch {
      throw new Error("Could not read this audio file")
    }
    const durationSeconds = metadata.format.duration
    if (!durationSeconds || !Number.isFinite(durationSeconds)) {
      throw new Error("Could not determine the audio duration")
    }
    if (
      durationSeconds < MIN_AUDIO_SECONDS ||
      durationSeconds > MAX_AUDIO_SECONDS
    ) {
      throw new Error("Audio must be between 2 and 60 seconds")
    }
    const format = normalizedAudioFormat(metadata.format.container)
    const verifiedKey = `users/${user._id}/videos/${crypto.randomUUID()}/audio/source.${format.extension}`
    await r2.store(ctx, blob, {
      key: verifiedKey,
      type: format.contentType,
      cacheControl: "public, max-age=31536000, immutable",
    })
    await r2.deleteObject(ctx, args.sourceAudioKey)

    try {
      return await ctx.runMutation(
        internal.videos.internalCreateLipSyncAndQueue,
        {
          userId: user._id,
          characterId: args.characterId,
          characterImageKey: args.characterImageKey,
          sourceAudioKey: verifiedKey,
          sourceAudioContentType: format.contentType,
          sourceFileName: cleanFileName(args.sourceFileName),
          sourceDurationSeconds: durationSeconds,
          sourceFileSize: blob.size,
        }
      )
    } catch (error) {
      await r2.deleteObject(ctx, verifiedKey)
      throw error
    }
  },
})
