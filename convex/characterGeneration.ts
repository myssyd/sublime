"use node"

import { fal } from "@fal-ai/client"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { r2 } from "./assets"
import { internal } from "./_generated/api"
import { action, type ActionCtx } from "./_generated/server"

const SEEDREAM_TEXT_MODEL = "bytedance/seedream/v5/pro/text-to-image"
const SEEDREAM_EDIT_MODEL = "bytedance/seedream/v5/pro/edit"
const IMAGE_SIZE = { width: 1280, height: 1600 }

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

async function generateImage(args: {
  prompt: string
  referenceUrls?: string[]
}) {
  const model = args.referenceUrls?.length
    ? SEEDREAM_EDIT_MODEL
    : SEEDREAM_TEXT_MODEL
  const input = args.referenceUrls?.length
    ? {
        prompt: args.prompt,
        image_urls: args.referenceUrls,
        image_size: IMAGE_SIZE,
        num_images: 1,
      }
    : {
        prompt: args.prompt,
        image_size: IMAGE_SIZE,
        num_images: 1,
        output_format: "jpeg" as const,
      }
  const result = (await fal.subscribe(model, {
    input,
    logs: true,
  })) as SeedreamResult
  const outputUrl = result.data?.images?.[0]?.url
  if (!outputUrl) throw new Error("Seedream returned no image")
  const response = await fetch(outputUrl)
  if (!response.ok) {
    throw new Error(`Could not download Seedream output (${response.status})`)
  }
  return {
    blob: await response.blob(),
    model,
    requestId: result.requestId,
  }
}

function heroPrompt(args: {
  sourceKind: "prompt" | "image"
  sourcePrompt?: string
  adjustment?: string
}) {
  const source =
    args.sourceKind === "image"
      ? `Use the supplied photographs as authoritative references for the same person. Preserve their exact recognizable facial identity, facial proportions, skin tone, hair, age, build, and distinctive features. Remove any surrounding text, logos, frames, other people, and distracting background details.${args.sourcePrompt ? ` Additional direction: ${args.sourcePrompt}` : ""}`
      : `Create this person: ${args.sourcePrompt}`
  const adjustment = args.adjustment?.trim()
    ? `\nRequested adjustment: ${args.adjustment.trim()}`
    : ""
  return `${source}

Create a canonical photorealistic identity-anchor portrait for video generation. Head-and-shoulders composition on a 4:5 canvas, face centered and large enough to inspect, eyes looking toward camera, clear front-facing facial geometry, natural relaxed expression, simple neutral studio background, soft even flattering light, and realistic skin texture. Use simple contemporary clothing without logos or text.

One person only. No text, lettering, watermark, border, duplicate face, cropped head, heavy retouching, extreme expression, sunglasses, hat, face obstruction, or dramatic colored lighting.${adjustment}`
}

const THREE_QUARTER_PROMPT = `Generate a new photorealistic identity reference of the EXACT SAME PERSON shown in the approved hero image. Preserve facial identity, facial proportions, eye shape and spacing, nose, mouth, skin tone, hair, age, build, and distinctive features exactly.

Show the person from the waist up in a natural three-quarter view, turned about 35 degrees from camera while keeping the full face clearly readable. Use the same simple clothing, neutral studio background, soft even lighting, and realistic skin texture as the hero. This is a clean supporting identity reference for video generation.

One person only. No text, logos, props, sunglasses, hat, face obstruction, dramatic expression, duplicate body parts, or identity drift.`

const FULL_BODY_PROMPT = `Generate a new photorealistic identity reference of the EXACT SAME PERSON shown in the approved hero image. Preserve facial identity, facial proportions, skin tone, hair, age, body build, height impression, and distinctive features exactly.

Show the person standing naturally from head to feet on a 4:5 canvas, both feet fully visible, relaxed neutral posture, face clearly readable, simple contemporary clothing consistent with the hero, clean neutral studio background, and soft even lighting. This is the canonical full-body identity reference for video generation.

One person only. No text, logos, props, sunglasses, hat, face obstruction, cropped feet, distorted anatomy, extra limbs, dramatic pose, or identity drift.`

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
    const startedAt = Date.now()
    let model =
      character.sourceKind === "image"
        ? SEEDREAM_EDIT_MODEL
        : SEEDREAM_TEXT_MODEL
    try {
      const referenceUrls = await Promise.all(
        (character.sourceImageKeys ?? []).map((key) =>
          r2.getUrl(key, { expiresIn: 60 * 60 })
        )
      )
      const generated = await generateImage({
        prompt: heroPrompt({
          sourceKind: character.sourceKind,
          sourcePrompt: character.sourcePrompt,
          adjustment: args.adjustment,
        }),
        referenceUrls,
      })
      model = generated.model
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
      await ctx.runMutation(internal.characters.internalRecordImageUsage, {
        userId: user._id,
        model,
        status: "completed",
        providerRequestId: generated.requestId,
        elapsedMs: Date.now() - startedAt,
      })
      return { imageKey }
    } catch (error) {
      await ctx.runMutation(internal.characters.internalFailGeneration, {
        id: args.characterId,
        userId: user._id,
        error: errorMessage(error),
      })
      await ctx.runMutation(internal.characters.internalRecordImageUsage, {
        userId: user._id,
        model,
        status: "failed",
        elapsedMs: Date.now() - startedAt,
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
    const startedAt = Date.now()
    try {
      const heroUrl = await r2.getUrl(character.primaryImageKey, {
        expiresIn: 60 * 60,
      })
      const generated = await Promise.all([
        generateImage({ prompt: THREE_QUARTER_PROMPT, referenceUrls: [heroUrl] }),
        generateImage({ prompt: FULL_BODY_PROMPT, referenceUrls: [heroUrl] }),
      ])
      const labels = ["three-quarter", "full-body"]
      const referenceImageKeys = await Promise.all(
        generated.map((image, index) =>
          storeGeneratedImage(
            ctx,
            image.blob,
            `users/${user._id}/characters/${args.characterId}/references/${labels[index]}-${crypto.randomUUID()}.jpg`
          )
        )
      )
      await ctx.runMutation(internal.characters.internalCompleteReferences, {
        id: args.characterId,
        userId: user._id,
        referenceImageKeys,
      })
      await Promise.all(
        generated.map((image) =>
          ctx.runMutation(internal.characters.internalRecordImageUsage, {
            userId: user._id,
            model: image.model,
            status: "completed",
            providerRequestId: image.requestId,
            elapsedMs: Date.now() - startedAt,
          })
        )
      )
      return { referenceImageKeys }
    } catch (error) {
      await ctx.runMutation(internal.characters.internalFailGeneration, {
        id: args.characterId,
        userId: user._id,
        error: errorMessage(error),
      })
      await ctx.runMutation(internal.characters.internalRecordImageUsage, {
        userId: user._id,
        model: SEEDREAM_EDIT_MODEL,
        status: "failed",
        elapsedMs: Date.now() - startedAt,
      })
      throw error
    }
  },
})

export const generateCreation = action({
  args: {
    characterId: v.id("characters"),
    prompt: v.string(),
  },
  handler: async (ctx, args): Promise<{ imageKey: string }> => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const prompt = args.prompt.trim()
    if (prompt.length < 3) throw new Error("Describe the picture you want")
    if (prompt.length > 2_000) throw new Error("Picture direction is too long")

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
    const startedAt = Date.now()
    try {
      const referenceKeys = [
        character.primaryImageKey,
        ...character.referenceImageKeys,
      ]
      const referenceUrls = await Promise.all(
        referenceKeys.map((key) => r2.getUrl(key, { expiresIn: 60 * 60 }))
      )
      const generated = await generateImage({
        referenceUrls,
        prompt: `Create a new photorealistic 4:5 social photo of the EXACT SAME PERSON shown in the supplied identity references. Preserve their recognizable facial identity, facial proportions, skin tone, hair, age, build, and distinctive features exactly.

Creative direction: ${prompt}

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
      })
      await ctx.runMutation(internal.characters.internalRecordImageUsage, {
        userId: user._id,
        model: generated.model,
        status: "completed",
        providerRequestId: generated.requestId,
        elapsedMs: Date.now() - startedAt,
      })
      return { imageKey }
    } catch (error) {
      await ctx.runMutation(internal.characters.internalRecordImageUsage, {
        userId: user._id,
        model: SEEDREAM_EDIT_MODEL,
        status: "failed",
        elapsedMs: Date.now() - startedAt,
      })
      throw error
    }
  },
})
