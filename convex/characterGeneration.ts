"use node"

import { fal } from "@fal-ai/client"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { r2 } from "./assets"
import { internal } from "./_generated/api"
import { action, internalAction, type ActionCtx } from "./_generated/server"
import {
  CHARACTER_IMAGE_CREDITS,
  imageCreditsForModel,
} from "./billing"
import {
  pictureAspectRatioValidator,
  pictureModelValidator,
  type PictureAspectRatio,
  type PictureModel,
} from "./lib/image"

const SEEDREAM_TEXT_MODEL = "bytedance/seedream/v5/pro/text-to-image"
const SEEDREAM_EDIT_MODEL = "bytedance/seedream/v5/pro/edit"
const NANO_BANANA_TEXT_MODEL = "fal-ai/nano-banana-2"
const NANO_BANANA_EDIT_MODEL = "fal-ai/nano-banana-2/edit"
const MAX_PICTURE_ATTACHMENTS = 4
const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])
const PICTURE_REFERENCE_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/references\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const IMAGE_SIZES: Record<
  PictureAspectRatio,
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

type ImageModelResult = {
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
  model?: PictureModel
  aspectRatio?: PictureAspectRatio
  identityQuality?: boolean
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
          resolution: args.identityQuality ? ("2K" as const) : ("1K" as const),
          ...(args.identityQuality
            ? { thinking_level: "high" as const }
            : {}),
          limit_generations: true,
          enable_web_search: false,
        }
      : {
          prompt: args.prompt,
          ...(hasReferences ? { image_urls: args.referenceUrls } : {}),
          image_size: IMAGE_SIZES[aspectRatio],
          num_images: 1,
          output_format: "jpeg" as const,
        }
  const result = (await fal.subscribe(model, {
    input,
    logs: true,
  })) as ImageModelResult
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
    model?: PictureModel
    aspectRatio?: PictureAspectRatio
    identityQuality?: boolean
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
      ? args.referenceUrls?.length
        ? NANO_BANANA_EDIT_MODEL
        : NANO_BANANA_TEXT_MODEL
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

const CHARACTER_PHOTOREALISM_STANDARD = `NON-NEGOTIABLE PHOTOREALISM STANDARD
The result must be indistinguishable from a real professional photograph of a real adult human captured in a studio. It must not look illustrated, rendered, synthetic, or AI-generated.

Render physically believable human anatomy and facial structure with subtle natural asymmetry. Preserve true skin micro-detail: visible pores, fine facial hair, faint expression lines, realistic under-eye texture, natural lip texture, and gentle tonal variation. Skin must retain texture and translucency rather than looking airbrushed, waxy, plastic, or over-retouched. Eyes must have anatomically correct pupils, catchlights, moisture, eyelids, and gaze. Hair must resolve into natural individual strands with believable density and flyaways. Teeth, ears, neck, shoulders, hands, and clothing must be anatomically and materially convincing whenever visible.

Use coherent real-world optics, perspective, depth of field, exposure, shadows, and color response. Aim for the restrained finish of a high-end full-frame camera photograph with natural dynamic range and neutral color grading—not an HDR composite, beauty-filter selfie, CGI render, game character, fashion illustration, or hyper-sharpened stock image.`

function heroPrompt(args: {
  sourceKind: "prompt" | "image"
  sourcePrompt?: string
  adjustment?: string
}) {
  const source =
    args.sourceKind === "image"
      ? `IDENTITY SOURCE
The supplied photographs are authoritative references for one and the same real person. Reconstruct that person's exact recognizable identity without beautifying them into someone else. Preserve facial geometry, face shape, eye shape and spacing, nose, mouth, jaw, ears, skin tone and undertone, apparent adult age, hairline, hair texture, and all distinctive features. Ignore and remove surrounding text, logos, frames, other people, filters, and background distractions.${args.sourcePrompt ? `
Additional user direction: ${args.sourcePrompt}` : ""}`
      : `CHARACTER SPECIFICATION
Create one coherent, believable adult person matching this description exactly:
${args.sourcePrompt}

Treat every stated physical trait as authoritative. Fill in unstated details conservatively so the person feels genetically and anatomically coherent. Do not substitute a generic influencer face, change the requested ethnicity or apparent age, or erase distinctive traits such as freckles, scars, texture, facial proportions, or body type.`
  const adjustment = args.adjustment?.trim()
    ? `\nREVISION REQUEST\n${args.adjustment.trim()}`
    : ""
  return `${CHARACTER_PHOTOREALISM_STANDARD}

${source}

TASK
Create a canonical identity-anchor portrait for consistent downstream image and video generation. This image is an identity record, so facial clarity and repeatability matter more than dramatic styling.

COMPOSITION AND CAMERA
- Vertical 4:5 head-and-shoulders portrait of exactly one adult person.
- Straight-on or nearly straight-on camera angle at eye level; centered face with both eyes clearly visible and looking toward camera.
- Natural, relaxed expression with closed or gently parted lips.
- Simulate a full-frame camera with an 85mm portrait lens around f/4 for undistorted facial geometry and moderate, believable depth of field.
- Soft large-source studio key light with gentle fill, neutral white balance, realistic shadow falloff, and a simple warm-gray or neutral studio background.
- Keep the entire head, hair, neck, and shoulders inside frame. Make the face large enough to inspect at a glance.

STYLING
Present an unmistakably adult, polished contemporary creator with intentional but believable grooming and simple fashion-forward clothing without visible logos. Styling should support the person's identity rather than overpower it. User direction about body type, clothing, styling, disability, cultural dress, or modesty always overrides defaults.

FINAL REJECTION RULES
Reject any result with a generic beauty-filter face, identity ambiguity, doll-like skin, excessive symmetry, smeared or glassy eyes, malformed ears or teeth, duplicate features, cropped hair or head, dramatic colored lighting, extreme expression, sunglasses, hats, face obstruction, text, lettering, logo, watermark, border, or more than one person.${adjustment}`
}

function fullBodyPrompt(userDirection?: string) {
  const override = userDirection?.trim()
    ? `\nAUTHORITATIVE USER DIRECTION\n${userDirection.trim()}`
    : ""
  return `${CHARACTER_PHOTOREALISM_STANDARD}

IDENTITY LOCK
Generate the EXACT SAME ADULT PERSON shown in the approved hero image. The hero is the sole authoritative identity source. Preserve the same face—not a similar person—including facial geometry, eye shape and spacing, nose, lips, jaw, ears, skin tone and undertone, apparent age, hairline, hairstyle, hair texture, and every distinctive feature. Preserve plausible body continuity with the visible neck and shoulders. Do not beautify, de-age, masculinize, feminize, or otherwise reinterpret the identity.

TASK AND COMPOSITION
- Create one vertical 4:5 full-body studio photograph, head to toe, of exactly one person.
- The full head, hair, both hands, legs, and both feet must be visible and uncropped.
- Natural balanced standing pose with relaxed shoulders, believable weight distribution, and hands clearly separated from the torso.
- Camera at approximately waist height using a normal-to-short-telephoto full-frame lens around 65mm to avoid distorted head, torso, hands, or legs.
- Face remains front-facing or only slightly turned and clearly readable, with the same relaxed expression as the hero.
- Match the hero's neutral studio lighting, white balance, skin response, and background so the two images feel captured in the same real photoshoot.

STYLING
Extend the hero's styling into one coherent, tasteful, fashion-forward full look with physically realistic fabric, seams, folds, and contact shadows. Keep the requested body type; do not force an idealized physique. User direction about body shape, outfit, cultural dress, disability, styling, or modesty always overrides defaults.${override}

FINAL REJECTION RULES
Reject any result with identity drift, a generic or altered face, doll-like skin, a different apparent age, cropped head or feet, hidden hands, fused fingers, extra limbs, broken joints, impossible posture, distorted proportions, floating clothing, text, logo, watermark, props, sunglasses, hat, face obstruction, or more than one person.`
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

export const generateHeroJob = internalAction({
  args: {
    characterId: v.id("characters"),
    userId: v.string(),
    adjustment: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ imageKey: string }> => {
    const character = await ctx.runQuery(internal.characters.internalGetOwned, {
      id: args.characterId,
      userId: args.userId,
    })
    if (
      !character ||
      character.status !== "draft" ||
      !character.sourceKind ||
      character.generationStage !== "hero"
    ) {
      throw new Error("Character draft not found")
    }
    configureFal()
    try {
      const referenceUrls = await Promise.all(
        (character.sourceImageKeys ?? []).map((key) =>
          r2.getUrl(key, { expiresIn: 60 * 60 })
        )
      )
      const generated = await generateBilledImage(ctx, {
        userId: args.userId,
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
        model: "nano-banana",
        identityQuality: true,
      })
      const imageKey = await storeGeneratedImage(
        ctx,
        generated.blob,
        `users/${args.userId}/characters/${args.characterId}/heroes/${crypto.randomUUID()}.jpg`
      )
      await ctx.runMutation(internal.characters.internalCompleteHero, {
        id: args.characterId,
        userId: args.userId,
        imageKey,
      })
      return { imageKey }
    } catch (error) {
      await ctx.runMutation(internal.characters.internalFailGeneration, {
        id: args.characterId,
        userId: args.userId,
        error: errorMessage(error),
      })
      throw error
    }
  },
})

export const generateReferencePackJob = internalAction({
  args: {
    characterId: v.id("characters"),
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<{ referenceImageKeys: string[] }> => {
    const character = await ctx.runQuery(internal.characters.internalGetOwned, {
      id: args.characterId,
      userId: args.userId,
    })
    if (
      !character ||
      character.status !== "draft" ||
      !character.primaryImageKey ||
      character.generationStage !== "references"
    ) {
      throw new Error("Approve a hero first")
    }
    configureFal()
    try {
      const heroUrl = await r2.getUrl(character.primaryImageKey, {
        expiresIn: 60 * 60,
      })
      const generated = await generateBilledImage(ctx, {
        userId: args.userId,
        reservationKey: `character-reference:${args.characterId}:full-body:${crypto.randomUUID()}`,
        credits: CHARACTER_IMAGE_CREDITS,
        kind: "character_reference",
        refId: `${args.characterId}:full-body`,
        prompt: fullBodyPrompt(character.sourcePrompt),
        referenceUrls: [heroUrl],
        model: "nano-banana",
        identityQuality: true,
      })
      const fullBodyImageKey = await storeGeneratedImage(
        ctx,
        generated.blob,
        `users/${args.userId}/characters/${args.characterId}/references/full-body-${crypto.randomUUID()}.jpg`
      )
      const referenceImageKeys = [fullBodyImageKey]
      await ctx.runMutation(internal.characters.internalCompleteReferences, {
        id: args.characterId,
        userId: args.userId,
        referenceImageKeys,
      })
      return { referenceImageKeys }
    } catch (error) {
      await ctx.runMutation(internal.characters.internalFailGeneration, {
        id: args.characterId,
        userId: args.userId,
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
    model: pictureModelValidator,
    attachmentImageKeys: v.array(v.string()),
    aspectRatio: pictureAspectRatioValidator,
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
      try {
        await ctx.runMutation(internal.images.internalCreate, {
          characterId: args.characterId,
          userId: user._id,
          key: imageKey,
          prompt,
          model: args.model,
          aspectRatio: args.aspectRatio,
        })
      } catch (error) {
        await r2.deleteObject(ctx, imageKey)
        throw error
      }
      return { imageKey }
    } finally {
      await Promise.allSettled(
        args.attachmentImageKeys.map((key) => r2.deleteObject(ctx, key))
      )
    }
  },
})
