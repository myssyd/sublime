"use node"

import { fal } from "@fal-ai/client"
import { v } from "convex/values"
import { r2 } from "./assets"
import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"

const KLING_CLONE_MODEL = "fal-ai/kling-video/o3/pro/video-to-video/edit"
const LIP_SYNC_MODEL = "fal-ai/sync-lipsync/v3/image-to-video"

type KlingResult = {
  requestId?: string
  data?: {
    video?: { url?: string }
    videos?: Array<{ url?: string }>
  }
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

export const generateClone = internalAction({
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
      if (!reservationKey) throw new Error("Video credit reservation is missing")
      if (!character.primaryImageKey) {
        throw new Error("Character has no approved hero image")
      }
      if (!video.sourceVideoKey) {
        throw new Error("Clone source video is missing")
      }
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
        video.prompt ? `Additional creative direction: ${video.prompt}` : undefined,
      ]
        .filter(Boolean)
        .join(" ")

      const result = (await fal.subscribe(KLING_CLONE_MODEL, {
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
      })) as KlingResult

      const outputUrl =
        result.data?.video?.url ?? result.data?.videos?.[0]?.url ?? null
      if (!outputUrl) throw new Error("Kling returned no output video")

      await ctx.runMutation(internal.credits.recordProviderSuccess, {
        reservationKey,
        operation: "video_clone",
        model: KLING_CLONE_MODEL,
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
        throw new Error(`Could not download Kling output (${response.status})`)
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
          model: KLING_CLONE_MODEL,
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
