"use node"

import { fal } from "@fal-ai/client"
import { v } from "convex/values"
import { r2 } from "./assets"
import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import {
  DEFAULT_VIDEO_MODEL,
  isSeedanceVideoModel,
  type VideoModel,
} from "./lib/videoModel"

const VIDEO_MODEL_ENDPOINTS: Record<VideoModel, string> = {
  "kling-o3-pro": "fal-ai/kling-video/o3/pro/video-to-video/edit",
  "seedance-2.0-fast":
    "bytedance/seedance-2.0/fast/reference-to-video",
  "seedance-2.5": "bytedance/seedance-2.5/reference-to-video",
}
const LIP_SYNC_MODEL = "fal-ai/sync-lipsync/v3/image-to-video"
const MOTION_CONTROL_MODEL =
  "fal-ai/kling-video/v3/standard/motion-control"
const FFMPEG_METADATA_MODEL = "fal-ai/ffmpeg-api/metadata"
const FFMPEG_SCALE_MODEL = "fal-ai/workflow-utilities/scale-video"
const FFMPEG_MERGE_AUDIO_MODEL = "fal-ai/ffmpeg-api/merge-audio-video"
const SEEDANCE_MAX_REFERENCE_BYTES = 50 * 1024 * 1024

type VideoGenerationResult = {
  requestId?: string
  data?: {
    video?: { url?: string }
    videos?: Array<{ url?: string }>
  }
}

type MetadataResult = {
  data?: {
    media?: {
      file_size?: number
      audio?: unknown
      resolution?: { width?: number; height?: number }
    }
  }
}

type VideoUtilityResult = {
  data?: { video?: { url?: string } }
}

type LipSyncResult = {
  requestId?: string
  data?: {
    video?: { url?: string }
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function referenceToken(model: VideoModel, kind: "Image" | "Video", index: number) {
  return model === "seedance-2.5"
    ? `[${kind}${index}]`
    : `@${kind}${index}`
}

async function prepareSeedanceSource(sourceVideoUrl: string) {
  const metadata = (await fal.subscribe(FFMPEG_METADATA_MODEL, {
    input: { media_url: sourceVideoUrl, extract_frames: false },
    logs: false,
  })) as MetadataResult
  const media = metadata.data?.media
  const width = media?.resolution?.width
  const height = media?.resolution?.height
  const shortSide = width && height ? Math.min(width, height) : undefined
  const shouldScale =
    (shortSide !== undefined && (shortSide < 480 || shortSide > 720)) ||
    (media?.file_size ?? 0) > SEEDANCE_MAX_REFERENCE_BYTES

  if (!shouldScale) {
    return { videoUrl: sourceVideoUrl, hasAudio: Boolean(media?.audio) }
  }
  if (!width || !height) {
    throw new Error("Could not inspect the Seedance reference video")
  }

  const scaled = (await fal.subscribe(FFMPEG_SCALE_MODEL, {
    input: {
      video_url: sourceVideoUrl,
      ...(width <= height ? { width: 720 } : { height: 720 }),
    },
    logs: true,
  })) as VideoUtilityResult
  const scaledUrl = scaled.data?.video?.url
  if (!scaledUrl) throw new Error("Could not normalize the Seedance reference video")
  return { videoUrl: scaledUrl, hasAudio: Boolean(media?.audio) }
}

async function restoreOriginalAudio(
  generatedVideoUrl: string,
  sourceVideoUrl: string
) {
  const merged = (await fal.subscribe(FFMPEG_MERGE_AUDIO_MODEL, {
    input: {
      video_url: generatedVideoUrl,
      audio_url: sourceVideoUrl,
    },
    logs: true,
  })) as VideoUtilityResult
  const mergedUrl = merged.data?.video?.url
  if (!mergedUrl) throw new Error("Could not restore the original audio")
  return mergedUrl
}

export const generateClone = internalAction({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const startedAt = Date.now()
    let providerSucceeded = false
    let reservationKey: string | undefined
    let modelEndpoint = VIDEO_MODEL_ENDPOINTS[DEFAULT_VIDEO_MODEL]
    await ctx.runMutation(internal.videos.internalSetProcessing, {
      videoId: args.videoId,
    })

    try {
      const apiKey = process.env.FAL_KEY
      if (!apiKey) throw new Error("FAL_KEY is not configured")
      fal.config({ credentials: apiKey })

      const { video, character } = await ctx.runQuery(
        internal.videos.internalGetGenerationContext,
        { videoId: args.videoId }
      )
      reservationKey = video.creditReservationKey
      if (!reservationKey) throw new Error("Video credit reservation is missing")
      if (!character.primaryImageKey) {
        throw new Error("Character has no approved hero image")
      }
      if (!video.sourceVideoKey) {
        throw new Error("Clone source video is missing")
      }
      const videoModel = video.model ?? DEFAULT_VIDEO_MODEL
      modelEndpoint = VIDEO_MODEL_ENDPOINTS[videoModel]
      const selectedLookImageKey =
        video.characterImageKey ?? character.primaryImageKey
      const hasSeparateLookImage =
        selectedLookImageKey !== character.primaryImageKey
      const supportingImageKeys = character.referenceImageKeys.filter(
        (key) => key !== selectedLookImageKey
      )
      const [
        sourceVideoUrl,
        characterFrontalImageUrl,
        supportingImageUrls,
        selectedLookImageUrl,
      ] = await Promise.all([
        r2.getUrl(video.sourceVideoKey, { expiresIn: 60 * 60 }),
        r2.getUrl(character.primaryImageKey, { expiresIn: 60 * 60 }),
        Promise.all(
          supportingImageKeys.map((key) =>
            r2.getUrl(key, { expiresIn: 60 * 60 })
          )
        ),
        hasSeparateLookImage
          ? r2.getUrl(selectedLookImageKey, { expiresIn: 60 * 60 })
          : Promise.resolve(undefined),
      ])

      let seedanceSource:
        | { videoUrl: string; hasAudio: boolean }
        | undefined
      let result: VideoGenerationResult

      if (isSeedanceVideoModel(videoModel)) {
        seedanceSource = await prepareSeedanceSource(sourceVideoUrl)
        const imageUrls = [
          selectedLookImageUrl ?? characterFrontalImageUrl,
          characterFrontalImageUrl,
          ...supportingImageUrls,
        ]
          .filter((url, index, values) => values.indexOf(url) === index)
          .slice(0, videoModel === "seedance-2.0-fast" ? 9 : 50)
        const videoReference = referenceToken(videoModel, "Video", 1)
        const lookReference = referenceToken(videoModel, "Image", 1)
        const identityReferences = imageUrls
          .slice(1)
          .map((_, index) => referenceToken(videoModel, "Image", index + 2))
        const direction = [
          `Edit ${videoReference} by replacing only the primary on-camera performer with the person from ${lookReference}.`,
          `Preserve ${videoReference}'s complete performance: choreography, timing, body motion, framing, camera movement, lighting, environment, cuts, and pacing, except where the additional creative direction explicitly requests a change.`,
          `Use ${lookReference} as the sole source of truth for outfit, styling, and accessories.`,
          identityReferences.length
            ? `Use ${[lookReference, ...identityReferences].join(", ")} together for facial identity, hair, skin tone, and body proportions; the additional identity images must not override the outfit from ${lookReference}.`
            : `Use ${lookReference} for facial identity, hair, skin tone, and body proportions.`,
          "Keep the character's identity, proportions, and wardrobe consistent in every frame.",
          "Render photorealistically with stable hands, clean occlusions, natural motion blur, and no identity drift.",
          character.identityPrompt,
          video.prompt
            ? `Additional creative direction: ${video.prompt}`
            : undefined,
        ]
          .filter(Boolean)
          .join(" ")

        result = (await fal.subscribe(modelEndpoint, {
          input: {
            prompt: direction,
            video_urls: [seedanceSource.videoUrl],
            image_urls: imageUrls,
            resolution: "720p",
            duration: String(
              Math.max(4, Math.ceil(video.sourceDurationSeconds ?? 4))
            ),
            aspect_ratio: "auto",
            generate_audio: false,
            ...(videoModel === "seedance-2.5"
              ? { end_user_id: video.userId }
              : {}),
          },
          logs: true,
        })) as VideoGenerationResult
      } else {
        const direction = [
          "Edit @Video1 by replacing only the primary on-camera performer with @Element1.",
          "Preserve the source performance: choreography, timing, body motion, framing, camera movement, lighting, environment, cuts, and pacing, except where the additional creative direction explicitly requests a change.",
          selectedLookImageUrl
            ? "Use @Image1 as the sole source of truth for outfit, styling, and accessories. Use @Element1 as the sole source of truth for facial identity, hair, skin tone, and body proportions."
            : "Use the exact outfit, styling, and accessories shown in @Element1's frontal image.",
          selectedLookImageUrl
            ? "Keep @Element1's identity and body proportions and @Image1's wardrobe consistent in every frame."
            : "Keep @Element1's face, hair, skin tone, body proportions, and wardrobe consistent in every frame.",
          "Render photorealistically with stable hands, clean occlusions, natural motion blur, and no identity drift.",
          character.identityPrompt,
          video.prompt
            ? `Additional creative direction: ${video.prompt}`
            : undefined,
        ]
          .filter(Boolean)
          .join(" ")

        result = (await fal.subscribe(modelEndpoint, {
          input: {
            prompt: direction,
            video_url: sourceVideoUrl,
            keep_audio: video.keepAudio,
            shot_type: "customize",
            ...(selectedLookImageUrl
              ? { image_urls: [selectedLookImageUrl] }
              : {}),
            elements: [
              {
                frontal_image_url: characterFrontalImageUrl,
                reference_image_urls: supportingImageUrls,
              },
            ],
          },
          logs: true,
        })) as VideoGenerationResult
      }

      let outputUrl =
        result.data?.video?.url ?? result.data?.videos?.[0]?.url ?? null
      if (!outputUrl) throw new Error("The video model returned no output video")

      await ctx.runMutation(internal.credits.recordProviderSuccess, {
        reservationKey,
        operation: "video_clone",
        model: modelEndpoint,
        providerRequestId: result.requestId,
        elapsedMs: Date.now() - startedAt,
      })
      providerSucceeded = true

      if (
        seedanceSource &&
        video.keepAudio &&
        seedanceSource.hasAudio
      ) {
        outputUrl = await restoreOriginalAudio(outputUrl, sourceVideoUrl)
      }

      await ctx.runMutation(internal.videos.internalMarkProviderSuccess, {
        videoId: args.videoId,
        providerRequestId: result.requestId,
        providerOutputUrl: outputUrl,
      })

      const response = await fetch(outputUrl)
      if (!response.ok) {
        throw new Error(`Could not download video output (${response.status})`)
      }
      const blob = await response.blob()
      const sourceDirectory = video.sourceVideoKey.match(
        /^(users\/[^/]+\/videos\/[^/]+)\/source\//
      )?.[1]
      const outputVideoKey = await r2.store(ctx, blob, {
        key: `${sourceDirectory ?? `users/${video.userId}/videos/${args.videoId}`}/output/${crypto.randomUUID()}.mp4`,
        type: blob.type || "video/mp4",
        cacheControl: "public, max-age=31536000, immutable",
      })

      await ctx.runMutation(internal.videos.internalComplete, {
        videoId: args.videoId,
        outputVideoKey,
        providerRequestId: result.requestId,
        elapsedMs: Date.now() - startedAt,
      })
    } catch (error) {
      const message = errorMessage(error).slice(0, 1500)
      if (!providerSucceeded && reservationKey) {
        await ctx.runMutation(internal.credits.recordProviderFailure, {
          reservationKey,
          operation: "video_clone",
          model: modelEndpoint,
          elapsedMs: Date.now() - startedAt,
          reason: message,
        })
      }
      await ctx.runMutation(internal.videos.internalFail, {
        videoId: args.videoId,
        error: message,
        elapsedMs: Date.now() - startedAt,
      })
      throw error
    }
  },
})

export const generateMotionControl = internalAction({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const startedAt = Date.now()
    let providerSucceeded = false
    let reservationKey: string | undefined
    await ctx.runMutation(internal.videos.internalSetProcessing, {
      videoId: args.videoId,
    })

    try {
      const apiKey = process.env.FAL_KEY
      if (!apiKey) throw new Error("FAL_KEY is not configured")
      fal.config({ credentials: apiKey })

      const { video, character } = await ctx.runQuery(
        internal.videos.internalGetGenerationContext,
        { videoId: args.videoId }
      )
      reservationKey = video.creditReservationKey
      if (!reservationKey) {
        throw new Error("Motion Control credit reservation is missing")
      }
      if (!video.sourceVideoKey) {
        throw new Error("Motion reference video is missing")
      }
      const characterImageKey =
        video.characterImageKey ?? character.primaryImageKey
      if (!characterImageKey) {
        throw new Error("Character image is missing")
      }

      const [imageUrl, sourceVideoUrl] = await Promise.all([
        r2.getUrl(characterImageKey, { expiresIn: 60 * 60 }),
        r2.getUrl(video.sourceVideoKey, { expiresIn: 60 * 60 }),
      ])
      const result = (await fal.subscribe(MOTION_CONTROL_MODEL, {
        input: {
          image_url: imageUrl,
          video_url: sourceVideoUrl,
          character_orientation: video.characterOrientation ?? "video",
          keep_original_sound: video.keepAudio,
          ...(video.prompt ? { prompt: video.prompt } : {}),
        },
        logs: true,
      })) as VideoGenerationResult
      const outputUrl = result.data?.video?.url ?? null
      if (!outputUrl) {
        throw new Error("Motion Control returned no output video")
      }

      await ctx.runMutation(internal.credits.recordProviderSuccess, {
        reservationKey,
        operation: "motion_control",
        model: MOTION_CONTROL_MODEL,
        providerRequestId: result.requestId,
        elapsedMs: Date.now() - startedAt,
      })
      providerSucceeded = true
      await ctx.runMutation(internal.videos.internalMarkProviderSuccess, {
        videoId: args.videoId,
        providerRequestId: result.requestId,
        providerOutputUrl: outputUrl,
      })

      const response = await fetch(outputUrl)
      if (!response.ok) {
        throw new Error(
          `Could not download Motion Control output (${response.status})`
        )
      }
      const blob = await response.blob()
      const sourceDirectory = video.sourceVideoKey.match(
        /^(users\/[^/]+\/videos\/[^/]+)\/source\//
      )?.[1]
      const outputVideoKey = await r2.store(ctx, blob, {
        key: `${sourceDirectory ?? `users/${video.userId}/videos/${args.videoId}`}/output/${crypto.randomUUID()}.mp4`,
        type: blob.type || "video/mp4",
        cacheControl: "public, max-age=31536000, immutable",
      })

      await ctx.runMutation(internal.videos.internalComplete, {
        videoId: args.videoId,
        outputVideoKey,
        providerRequestId: result.requestId,
        elapsedMs: Date.now() - startedAt,
      })
    } catch (error) {
      const message = errorMessage(error).slice(0, 1500)
      if (!providerSucceeded && reservationKey) {
        await ctx.runMutation(internal.credits.recordProviderFailure, {
          reservationKey,
          operation: "motion_control",
          model: MOTION_CONTROL_MODEL,
          elapsedMs: Date.now() - startedAt,
          reason: message,
        })
      }
      await ctx.runMutation(internal.videos.internalFail, {
        videoId: args.videoId,
        error: message,
        elapsedMs: Date.now() - startedAt,
      })
      throw error
    }
  },
})

export const generateLipSync = internalAction({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const startedAt = Date.now()
    let providerSucceeded = false
    let reservationKey: string | undefined
    await ctx.runMutation(internal.videos.internalSetProcessing, {
      videoId: args.videoId,
    })

    try {
      const apiKey = process.env.FAL_KEY
      if (!apiKey) throw new Error("FAL_KEY is not configured")
      fal.config({ credentials: apiKey })

      const { video, character } = await ctx.runQuery(
        internal.videos.internalGetGenerationContext,
        { videoId: args.videoId }
      )
      reservationKey = video.creditReservationKey
      if (!reservationKey) {
        throw new Error("Lip-sync credit reservation is missing")
      }
      if (!video.sourceAudioKey) {
        throw new Error("Lip-sync source audio is missing")
      }
      const characterImageKey =
        video.characterImageKey ?? character.primaryImageKey
      if (!characterImageKey) {
        throw new Error("Character image is missing")
      }

      const [imageUrl, audioUrl] = await Promise.all([
        r2.getUrl(characterImageKey, { expiresIn: 60 * 60 }),
        r2.getUrl(video.sourceAudioKey, { expiresIn: 60 * 60 }),
      ])
      const result = (await fal.subscribe(LIP_SYNC_MODEL, {
        input: {
          image_url: imageUrl,
          audio_url: audioUrl,
        },
        logs: true,
      })) as LipSyncResult
      const outputUrl = result.data?.video?.url ?? null
      if (!outputUrl) throw new Error("Sync returned no output video")

      await ctx.runMutation(internal.credits.recordProviderSuccess, {
        reservationKey,
        operation: "lip_sync",
        model: LIP_SYNC_MODEL,
        providerRequestId: result.requestId,
        elapsedMs: Date.now() - startedAt,
      })
      providerSucceeded = true
      await ctx.runMutation(internal.videos.internalMarkProviderSuccess, {
        videoId: args.videoId,
        providerRequestId: result.requestId,
        providerOutputUrl: outputUrl,
      })

      const response = await fetch(outputUrl)
      if (!response.ok) {
        throw new Error(`Could not download lip-sync output (${response.status})`)
      }
      const blob = await response.blob()
      const sourceDirectory = video.sourceAudioKey.match(
        /^(users\/[^/]+\/videos\/[^/]+)\/audio\//
      )?.[1]
      const outputVideoKey = await r2.store(ctx, blob, {
        key: `${sourceDirectory ?? `users/${video.userId}/videos/${args.videoId}`}/output/${crypto.randomUUID()}.mp4`,
        type: blob.type || "video/mp4",
        cacheControl: "public, max-age=31536000, immutable",
      })

      await ctx.runMutation(internal.videos.internalComplete, {
        videoId: args.videoId,
        outputVideoKey,
        providerRequestId: result.requestId,
        elapsedMs: Date.now() - startedAt,
      })
    } catch (error) {
      const message = errorMessage(error).slice(0, 1500)
      if (!providerSucceeded && reservationKey) {
        await ctx.runMutation(internal.credits.recordProviderFailure, {
          reservationKey,
          operation: "lip_sync",
          model: LIP_SYNC_MODEL,
          elapsedMs: Date.now() - startedAt,
          reason: message,
        })
      }
      await ctx.runMutation(internal.videos.internalFail, {
        videoId: args.videoId,
        error: message,
        elapsedMs: Date.now() - startedAt,
      })
      throw error
    }
  },
})
