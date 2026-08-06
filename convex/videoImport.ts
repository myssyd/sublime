"use node"

import { v } from "convex/values"
import { authComponent } from "./auth"
import { r2 } from "./assets"
import { internal } from "./_generated/api"
import { action, type ActionCtx } from "./_generated/server"
import { parseInstagramReelUrl } from "./lib/instagram"
import {
  detectVideoFormat,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  MIN_VIDEO_SECONDS,
  readMp4Duration,
} from "./lib/videoValidation"

type CobaltResponse =
  | {
      status: "tunnel" | "redirect"
      url: string
      filename?: string
    }
  | {
      status: "picker" | "local-processing"
    }
  | {
      status: "error"
      error?: {
        code?: string
      }
    }

type ImportedReelResult = {
  key: string
  fileName: string
  sourceUrl: string
  durationSeconds: number
  fileSize: number
  previewUrl: string
  reused: boolean
}

type ReadyInstagramSource = {
  sourceUrl: string
  videoKey: string
  fileName: string
  durationSeconds: number
  fileSize: number
}

type ClaimInstagramSourceResult =
  | { state: "claimed" }
  | { state: "busy" }
  | { state: "ready"; source: ReadyInstagramSource }

function getCobaltEndpoint() {
  const value = process.env.COBALT_API_URL?.trim()
  if (!value) {
    throw new Error(
      "Instagram Reel import is not configured. Add COBALT_API_URL to the Convex environment."
    )
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error("COBALT_API_URL is invalid")
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("COBALT_API_URL must be an HTTP or HTTPS URL")
  }
  return url
}

function safeFilename(
  value: string | undefined,
  shortcode: string,
  extension: "mp4" | "webm"
) {
  const fallback = `instagram-reel-${shortcode}.${extension}`
  if (!value) return fallback
  const cleaned = value
    .replace(/[\\/\0\r\n]/g, "-")
    .replace(/[^a-zA-Z0-9._ -]/g, "")
    .trim()
    .slice(0, 120)
    .replace(/\.(mp4|mov|webm)$/i, "")
  return cleaned ? `${cleaned}.${extension}` : fallback
}

function sharedReelKey(shortcode: string) {
  return `sources/instagram/reels/${shortcode}/reference.mp4`
}

async function reuseReadyReel(
  ctx: ActionCtx,
  source: ReadyInstagramSource
): Promise<ImportedReelResult | null> {
  const videoObject = await r2.getMetadata(ctx, source.videoKey)
  if (!videoObject) return null
  if (videoObject.size && videoObject.size !== source.fileSize) return null

  return {
    key: source.videoKey,
    fileName: source.fileName,
    sourceUrl: source.sourceUrl,
    durationSeconds: source.durationSeconds,
    fileSize: source.fileSize,
    previewUrl: await r2.getUrl(source.videoKey, { expiresIn: 60 * 60 }),
    reused: true,
  }
}

async function storeSharedReel(
  ctx: ActionCtx,
  reel: { shortcode: string; url: string },
  blob: Blob,
  fileName: string,
  durationSeconds: number,
  reused: boolean
): Promise<ImportedReelResult> {
  const videoKey = sharedReelKey(reel.shortcode)
  const existingVideo = await r2.getMetadata(ctx, videoKey)
  if (
    existingVideo?.size !== undefined &&
    existingVideo.size !== blob.size
  ) {
    throw new Error("The cached Reel does not match the downloaded video")
  }
  if (!existingVideo) {
    try {
      await r2.store(ctx, blob, {
        key: videoKey,
        type: "video/mp4",
        cacheControl: "public, max-age=31536000, immutable",
      })
    } catch (error) {
      if (!(await r2.getMetadata(ctx, videoKey))) throw error
    }
  }

  return {
    key: videoKey,
    fileName,
    sourceUrl: reel.url,
    durationSeconds,
    fileSize: existingVideo?.size ?? blob.size,
    previewUrl: await r2.getUrl(videoKey, { expiresIn: 60 * 60 }),
    reused: reused || existingVideo !== null,
  }
}

export const importInstagramReel = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args): Promise<ImportedReelResult> => {
    if (!(await authComponent.getAuthUser(ctx))) {
      throw new Error("Not authenticated")
    }

    const reel = parseInstagramReelUrl(args.url)
    const videoKey = sharedReelKey(reel.shortcode)
    const claimId = crypto.randomUUID()
    let claim: ClaimInstagramSourceResult = await ctx.runMutation(
      internal.videoSources.internalClaimInstagramSource,
      {
        externalId: reel.shortcode,
        sourceUrl: reel.url,
        videoKey,
        claimId,
        forceReady: false,
      }
    )
    if (claim.state === "ready") {
      const reused = await reuseReadyReel(ctx, claim.source)
      if (reused) return reused
      claim = await ctx.runMutation(
        internal.videoSources.internalClaimInstagramSource,
        {
          externalId: reel.shortcode,
          sourceUrl: reel.url,
          videoKey,
          claimId,
          forceReady: true,
        }
      )
    }
    if (claim.state === "busy") {
      throw new Error(
        "This Reel is already being imported. Try fetching it again in a moment."
      )
    }

    try {
      const cobaltEndpoint = getCobaltEndpoint()
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      }
      const apiKey = process.env.COBALT_API_KEY?.trim()
      if (apiKey) headers.Authorization = `Api-Key ${apiKey}`

      const resolveResponse = await fetch(cobaltEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: reel.url,
          downloadMode: "auto",
          videoQuality: "1080",
          filenameStyle: "basic",
          disableMetadata: true,
          alwaysProxy: true,
        }),
      })
      const result = (await resolveResponse.json().catch(() => null)) as
        | CobaltResponse
        | null

      if (!resolveResponse.ok || !result) {
        throw new Error(
          `Could not resolve this Reel (${resolveResponse.status}). Make sure it is public.`
        )
      }
      if (result.status === "error") {
        const code = result.error?.code
        throw new Error(
          code
            ? `Could not import this Reel (${code}). Make sure it is public.`
            : "Could not import this Reel. Make sure it is public."
        )
      }
      if (result.status !== "tunnel" && result.status !== "redirect") {
        throw new Error("This Instagram post did not resolve to a single video")
      }

      const downloadUrl = new URL(result.url)
      if (downloadUrl.origin !== cobaltEndpoint.origin) {
        throw new Error("The Reel resolver returned an unsafe download URL")
      }

      const downloadResponse = await fetch(downloadUrl, { redirect: "error" })
      if (!downloadResponse.ok) {
        throw new Error(
          `Could not download this Reel (${downloadResponse.status})`
        )
      }
      const contentLength = Number(
        downloadResponse.headers.get("content-length") ??
          downloadResponse.headers.get("estimated-content-length")
      )
      if (Number.isFinite(contentLength) && contentLength > MAX_VIDEO_BYTES) {
        throw new Error("The Reel must be smaller than 200 MB")
      }

      const blob = await downloadResponse.blob()
      if (blob.size > MAX_VIDEO_BYTES) {
        throw new Error("The Reel must be smaller than 200 MB")
      }
      const headerBytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer())
      const extension = detectVideoFormat(headerBytes)
      if (extension !== "mp4") {
        throw new Error("Kling requires an MP4 or MOV reference video")
      }
      const durationSeconds = await readMp4Duration(blob)
      if (
        durationSeconds < MIN_VIDEO_SECONDS ||
        durationSeconds > MAX_VIDEO_SECONDS
      ) {
        throw new Error("The Reel must be between 3 and 10 seconds for Kling")
      }

      const fileName = safeFilename(result.filename, reel.shortcode, extension)
      const imported = await storeSharedReel(
        ctx,
        reel,
        blob,
        fileName,
        durationSeconds,
        false
      )
      await ctx.runMutation(
        internal.videoSources.internalCompleteInstagramSource,
        {
          externalId: reel.shortcode,
          claimId,
          fileName: imported.fileName,
          durationSeconds: imported.durationSeconds,
          fileSize: imported.fileSize,
        }
      )
      return imported
    } catch (error) {
      await ctx.runMutation(internal.videoSources.internalFailInstagramSource, {
        externalId: reel.shortcode,
        claimId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },
})
