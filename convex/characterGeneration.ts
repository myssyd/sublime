"use node"

import { fal } from "@fal-ai/client"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { r2 } from "./assets"
import { internal } from "./_generated/api"
import { action, type ActionCtx } from "./_generated/server"
import {
  CHARACTER_IMAGE_CREDITS,
  imageCreditsForModel,
} from "./billing"

const SEEDREAM_TEXT_MODEL = "bytedance/seedream/v5/pro/text-to-image"
const SEEDREAM_EDIT_MODEL = "bytedance/seedream/v5/pro/edit"
const NANO_BANANA_TEXT_MODEL = "fal-ai/nano-banana"
const NANO_BANANA_EDIT_MODEL = "fal-ai/nano-banana/edit"
const MAX_PICTURE_ATTACHMENTS = 4
const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])
const PICTURE_REFERENCE_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/references\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ImageModel = "seedream-5" | "nano-banana"
type ImageAspectRatio =
  | "21:9"
  | "16:9"
  | "3:2"
  | "4:3"
  | "5:4"
  | "1:1"
  | "4:5"
  | "3:4"
  | "2:3"
  | "9:16"

const IMAGE_SIZES: Record<
  ImageAspectRatio,
  { width: number; height: number }
> = {
  "21:9": { width: 2016, height: 864 },
  "16:9": { width: 2048, height: 1152 },
  "3:2": { width: 1800, height: 1200 },
  "4:3": { width: 1600, height: 1200 },
  "5:4": { width: 1600, height: 1280 },
  "1:1": { width: 1536, height: 1536 },
  "4:5": { width: 1280, height: 1600 },
  "3:4": { width: 1200, height: 1600 },
  "2:3": { width: 1200, height: 1800 },
  "9:16": { width: 1152, height: 2048 },
}

type SeedreamResult = {
  requestId?: string
  data?: {
    images?: Array<{
      url?: string
      content_type?: string
    }>
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function configureFal() {
  const apiKey = process.env.FAL_KEY
  if (!apiKey) throw new Error("FAL_KEY is not configured")
  fal.config({ credentials: apiKey })
}

function isOwnedPictureReferenceKey(userId: string, key: string) {
  const prefix = `users/${userId}/pictures/`
  return key.startsWith(prefix) && PICTURE_REFERENCE_PATH.test(key.slice(prefix.length))
}

async function generateImage(args: {
  prompt: string
  referenceUrls?: string[]
  model?: ImageModel
  aspectRatio?: ImageAspectRatio
}) {
  const imageModel = args.model ?? "seedream-5"
  const aspectRatio = args.aspectRatio ?? "4:5"
  const hasReferences = Boolean(args.referenceUrls?.length)
  const model =
    imageModel === "nano-banana"
      ? hasReferences
        ? NANO_BANANA_EDIT_MODEL
        : NANO_BANANA_TEXT_MODEL
      : hasReferences
        ? SEEDREAM_EDIT_MODEL
        : SEEDREAM_TEXT_MODEL
  const input =
    imageModel === "nano-banana"
      ? {
          prompt: args.prompt,
          ...(hasReferences ? { image_urls: args.referenceUrls } : {}),
          aspect_ratio: aspectRatio,
          num_images: 1,
          output_format: "jpeg" as const,
          limit_generations: true,
        }
      : {
          prompt: args.prompt,
          ...(hasReferences ? { image_urls: args.referenceUrls } : {}),
          image_size: IMAGE_SIZES[aspectRatio],
          num_images: 1,
          output_format: "jpeg" as const,
        }
  const result = (await fal.subscribe(model, { input, logs: true })) as SeedreamResult
  const outputUrl = result.data?.images?.[0]?.url
  if (!outputUrl) throw new Error("The image model returned no image")
  return {
    outputUrl,
    model,
    requestId: result.requestId,
  }
}

async function generateBilledImage(
  ctx: ActionCtx,
  args: {
    userId: string
    reservationKey: string
    credits: number
    kind: string
    refId: string
    prompt: string
    referenceUrls?: string[]
    model?: ImageModel
    aspectRatio?: ImageAspectRatio
  }
) {
  await ctx.runMutation(internal.credits.createReservation, {
    userId: args.userId,
    credits: args.credits,
    reservationKey: args.reservationKey,
    kind: args.kind,
    refId: args.refId,
  })
  const startedAt = Date.now()
  const fallbackModel =
    args.model === "nano-banana"
      ? NANO_BANANA_EDIT_MODEL
      : args.referenceUrls?.length
        ? SEEDREAM_EDIT_MODEL
        : SEEDREAM_TEXT_MODEL
  try {
    const generated = await generateImage(args)
    await ctx.runMutation(internal.credits.recordProviderSuccess, {
      reservationKey: args.reservationKey,
      operation: "character_image",
      model: generated.model,
      providerRequestId: generated.requestId,
      elapsedMs: Date.now() - startedAt,
    })
    const response = await fetch(generated.outputUrl)
    if (!response.ok) {
      throw new Error(
        `Could not download the generated image (${response.status})`
      )
    }
    return {
      blob: await response.blob(),
      model: generated.model,
      requestId: generated.requestId,
    }
  } catch (error) {
    await ctx.runMutation(internal.credits.recordProviderFailure, {
      reservationKey: args.reservationKey,
      operation: "character_image",
      model: fallbackModel,
      elapsedMs: Date.now() - startedAt,
      reason: errorMessage(error),
    })
    throw error
  }
}

function heroPrompt(args: {
  sourceKind: "prompt" | "image"
  sourcePrompt?: string
  adjustment?: string
}) {
  const source =
    args.sourceKind === "image"
      ? `Use the supplied photographs as authoritative references for the same person. Preserve their exact recognizable facial identity, facial proportions, skin tone, hair, adult age, and distinctive features. Remove any surrounding text, logos, frames, other people, and distracting background details.${args.sourcePrompt ? ` Additional direction: ${args.sourcePrompt}` : ""}`
      : `Create this person: ${args.sourcePrompt}`
  const adjustment = args.adjustment?.trim()
    ? `\nRequested adjustment: ${args.adjustment.trim()}`
    : ""
  return `${source}

Create a canonical photorealistic identity-anchor portrait for video generation. Head-and-shoulders composition on a 4:5 canvas, face centered and large enough to inspect, eyes looking toward camera, clear front-facing facial geometry, natural relaxed expression, simple neutral studio background, soft even flattering light, and realistic skin texture. Use flattering, fashion-forward contemporary clothing without logos or text.

Present the character as an unmistakably adult, attractive Instagram creator with polished grooming, a fit and appealing physique, and a flattering fashion-forward outfit with confident, tasteful sex appeal. User direction about body type, clothing, styling, or modesty overrides these appearance defaults.

One person only. No text, lettering, watermark, border, duplicate face, cropped head, heavy retouching, extreme expression, sunglasses, hat, face obstruction, or dramatic colored lighting.${adjustment}`
}

function fullBodyPrompt(userDirection?: string) {
  const override = userDirection?.trim()
    ? `\nUser direction (authoritative): ${userDirection.trim()}`
    : ""
  return `Generate a new photorealistic identity reference of the EXACT SAME ADULT PERSON shown in the approved hero image. Preserve facial identity, facial proportions, skin tone, hair, age, and distinctive features exactly.

Show the person standing naturally from head to feet on a 4:5 canvas, both feet fully visible, confident relaxed posture, face clearly readable, clean neutral studio background, soft flattering lighting, and realistic skin and fabric detail. This is the canonical full-body identity reference for video generation.

Continue the hero's styling into one coherent full look. Unless user direction specifies otherwise, give the character a fit, attractive, well-proportioned physique and a stylish, body-flattering, fashion-forward outfit suitable for a polished Instagram creator. The look should feel confident and sexy while remaining tasteful, wearable, and non-explicit. User direction about body type, clothing, styling, or modesty always overrides these appearance defaults.${override}

One person only. No text, logos, props, sunglasses, hat, face obstruction, cropped feet, distorted anatomy, extra limbs, explicit nudity, or identity drift.`
}

async function storeGeneratedImage(
  ctx: ActionCtx,
  blob: Blob,
  key: string
) {
  return r2.store(ctx, blob, {
    key,
    type: blob.type || "image/jpeg",
    cacheControl: "public, max-age=31536000, immutable",
  })
}

export const generateHero = action({
  args: {
    characterId: v.id("characters"),
    adjustment: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ imageKey: string }> => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const character = await ctx.runQuery(internal.characters.internalGetOwned, {
      id: args.characterId,
      userId: user._id,
    })
    if (!character || character.status !== "draft" || !character.sourceKind) {
      throw new Error("Character draft not found")
    }
    configureFal()
    await ctx.runMutation(internal.characters.internalBeginGeneration, {
      id: args.characterId,
      userId: user._id,
      stage: "hero",
    })
    try {
      const referenceUrls = await Promise.all(
        (character.sourceImageKeys ?? []).map((key) =>
          r2.getUrl(key, { expiresIn: 60 * 60 })
        )
      )
      const generated = await generateBilledImage(ctx, {
        userId: user._id,
        reservationKey: `character-hero:${args.characterId}:${crypto.randomUUID()}`,
        credits: CHARACTER_IMAGE_CREDITS,
        kind: "character_hero",
        refId: args.characterId,
        prompt: heroPrompt({
          sourceKind: character.sourceKind,
          sourcePrompt: character.sourcePrompt,
          adjustment: args.adjustment,
        }),
        referenceUrls,
      })
      const imageKey = await storeGeneratedImage(
        ctx,
        generated.blob,
        `users/${user._id}/characters/${args.characterId}/heroes/${crypto.randomUUID()}.jpg`
      )
      await ctx.runMutation(internal.characters.internalCompleteHero, {
        id: args.characterId,
        userId: user._id,
        imageKey,
      })
      return { imageKey }
    } catch (error) {
      await ctx.runMutation(internal.characters.internalFailGeneration, {
        id: args.characterId,
        userId: user._id,
        error: errorMessage(error),
      })
      throw error
    }
  },
})

export const generateReferencePack = action({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args): Promise<{ referenceImageKeys: string[] }> => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const character = await ctx.runQuery(internal.characters.internalGetOwned, {
      id: args.characterId,
      userId: user._id,
    })
    if (!character || character.status !== "draft" || !character.primaryImageKey) {
      throw new Error("Approve a hero first")
    }
    configureFal()
    await ctx.runMutation(internal.characters.internalBeginGeneration, {
      id: args.characterId,
      userId: user._id,
      stage: "references",
    })
    try {
      const heroUrl = await r2.getUrl(character.primaryImageKey, {
        expiresIn: 60 * 60,
      })
      const generated = await generateBilledImage(ctx, {
        userId: user._id,
        reservationKey: `character-reference:${args.characterId}:full-body:${crypto.randomUUID()}`,
        credits: CHARACTER_IMAGE_CREDITS,
        kind: "character_reference",
        refId: `${args.characterId}:full-body`,
        prompt: fullBodyPrompt(character.sourcePrompt),
        referenceUrls: [heroUrl],
      })
      const fullBodyImageKey = await storeGeneratedImage(
        ctx,
        generated.blob,
        `users/${user._id}/characters/${args.characterId}/references/full-body-${crypto.randomUUID()}.jpg`
      )
      const referenceImageKeys = [fullBodyImageKey]
      await ctx.runMutation(internal.characters.internalCompleteReferences, {
        id: args.characterId,
        userId: user._id,
        referenceImageKeys,
      })
      return { referenceImageKeys }
    } catch (error) {
      await ctx.runMutation(internal.characters.internalFailGeneration, {
        id: args.characterId,
        userId: user._id,
        error: errorMessage(error),
      })
      throw error
    }
  },
})

export const generateCreation = action({
  args: {
    characterId: v.id("characters"),
    prompt: v.string(),
    model: v.union(v.literal("seedream-5"), v.literal("nano-banana")),
    attachmentImageKeys: v.array(v.string()),
    aspectRatio: v.union(
      v.literal("21:9"),
      v.literal("16:9"),
      v.literal("3:2"),
      v.literal("4:3"),
      v.literal("5:4"),
      v.literal("1:1"),
      v.literal("4:5"),
      v.literal("3:4"),
      v.literal("2:3"),
      v.literal("9:16")
    ),
  },
  handler: async (ctx, args): Promise<{ imageKey: string }> => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const prompt = args.prompt.trim()
    if (prompt.length < 3) throw new Error("Describe the picture you want")
    if (prompt.length > 2_000) throw new Error("Picture direction is too long")
    if (args.attachmentImageKeys.length > MAX_PICTURE_ATTACHMENTS) {
      throw new Error(`Use up to ${MAX_PICTURE_ATTACHMENTS} reference images`)
    }
    if (new Set(args.attachmentImageKeys).size !== args.attachmentImageKeys.length) {
      throw new Error("Attached reference images must be unique")
    }
    if (
      args.attachmentImageKeys.some(
        (key) => !isOwnedPictureReferenceKey(user._id, key)
      )
    ) {
      throw new Error("Attached reference image does not belong to this account")
    }
    try {
      const attachmentObjects = await Promise.all(
        args.attachmentImageKeys.map((key) => r2.getMetadata(ctx, key))
      )
      if (
        attachmentObjects.some(
          (object) =>
            !object ||
            object.size === undefined ||
            object.size <= 0 ||
            object.size > MAX_IMAGE_BYTES ||
            !object.contentType ||
            !ALLOWED_IMAGE_TYPES.has(object.contentType.toLowerCase())
        )
      ) {
        throw new Error("Attached references must be JPG, PNG, or WebP under 15 MB")
      }

      const character = await ctx.runQuery(internal.characters.internalGetOwned, {
        id: args.characterId,
        userId: user._id,
      })
      if (
        !character ||
        character.status !== "ready" ||
        !character.primaryImageKey
      ) {
        throw new Error("Character not found")
      }

      configureFal()
      const referenceKeys = [
        character.primaryImageKey,
        ...character.referenceImageKeys,
        ...args.attachmentImageKeys,
      ]
      const referenceUrls = await Promise.all(
        referenceKeys.map((key) => r2.getUrl(key, { expiresIn: 60 * 60 }))
      )
      const generated = await generateBilledImage(ctx, {
        userId: user._id,
        reservationKey: `creation-image:${args.characterId}:${crypto.randomUUID()}`,
        credits: imageCreditsForModel(args.model),
        kind: "creation_image",
        refId: args.characterId,
        referenceUrls,
        model: args.model,
        aspectRatio: args.aspectRatio,
        prompt: `Create a new photorealistic ${args.aspectRatio} social photo of the EXACT SAME PERSON shown in the supplied identity references. Preserve their recognizable facial identity, facial proportions, skin tone, hair, age, build, and distinctive features exactly.

Creative direction: ${prompt}

Any additional supplied images after the identity references are creative references for outfit, styling, props, pose, setting, or composition. Preserve the selected character's identity; do not adopt another person's face or body identity from those creative references.

Make the result feel like a polished, believable Instagram post with natural photographic detail and intentional composition. One person only unless the creative direction explicitly asks otherwise. No text, lettering, watermark, border, duplicate face, distorted anatomy, or identity drift.`,
      })
      const imageKey = await storeGeneratedImage(
        ctx,
        generated.blob,
        `users/${user._id}/characters/${args.characterId}/creations/${crypto.randomUUID()}.jpg`
      )
      await ctx.runMutation(internal.characters.internalAppendCreationImage, {
        id: args.characterId,
        userId: user._id,
        imageKey,
        prompt,
        model: args.model,
        aspectRatio: args.aspectRatio,
      })
      return { imageKey }
    } finally {
      await Promise.allSettled(
        args.attachmentImageKeys.map((key) => r2.deleteObject(ctx, key))
      )
    }
  },
})
