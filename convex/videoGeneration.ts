"use node"

import { fal } from "@fal-ai/client"
import { v } from "convex/values"
import { r2 } from "./assets"
import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"

const KLING_CLONE_MODEL = "fal-ai/kling-video/o3/pro/video-to-video/edit"

type KlingResult = {
  requestId?: string
  data?: {
    video?: { url?: string }
    videos?: Array<{ url?: string }>
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
      const characterImageKey = video.characterImageKey ?? character.primaryImageKey
      const supportingImageKeys = [
        character.primaryImageKey,
        ...character.referenceImageKeys,
      ].filter((key) => key !== characterImageKey)
      const [sourceVideoUrl, characterImageUrl, ...supportingImageUrls] =
        await Promise.all([
          r2.getUrl(video.sourceVideoKey, { expiresIn: 60 * 60 }),
          r2.getUrl(characterImageKey, { expiresIn: 60 * 60 }),
          ...supportingImageKeys.map((key) =>
            r2.getUrl(key, { expiresIn: 60 * 60 })
          ),
        ])

      const direction = [
        "Replace the main on-camera person in the reference video with @Element1.",
        "Preserve the original performance exactly: choreography, timing, body motion, framing, camera movement, lighting, environment, cuts, and pacing.",
        "Use the exact outfit, styling, and accessories shown in @Element1's frontal image. Treat that chosen image as the source of truth for wardrobe; supporting references are for identity and body consistency only.",
        "Keep @Element1's face, hair, skin tone, body proportions, and wardrobe identity consistent in every frame.",
        "Render photorealistically with stable hands, clean occlusions, natural motion blur, and no identity drift.",
        character.identityPrompt,
        video.prompt,
      ]
        .filter(Boolean)
        .join(" ")

      const result = (await fal.subscribe(KLING_CLONE_MODEL, {
        input: {
          prompt: direction,
          video_url: sourceVideoUrl,
          keep_audio: video.keepAudio,
          shot_type: "customize",
          elements: [
            {
              frontal_image_url: characterImageUrl,
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
