import { v } from "convex/values"
import { authComponent } from "./auth"
import { publicAssetUrl, r2 } from "./assets"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server"

const sourceKindValidator = v.union(v.literal("prompt"), v.literal("image"))
const generationStageValidator = v.union(
  v.literal("hero"),
  v.literal("references")
)
const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024
const ALLOWED_SOURCE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])
const UUID_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/sources\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isOwnedCharacterSourceKey(userId: string, key: string) {
  const prefix = `users/${userId}/characters/`
  return key.startsWith(prefix) && UUID_PATH.test(key.slice(prefix.length))
}

function assetUrls(keys: string[]) {
  return keys
    .map(publicAssetUrl)
    .filter((url): url is string => Boolean(url))
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []
    const characters = await ctx.db
      .query("characters")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect()

    return characters.flatMap((character) => {
      if (character.status === "draft" || !character.primaryImageKey) return []
      return [
        {
          ...character,
          primaryImageUrl: publicAssetUrl(character.primaryImageKey),
          referenceImageUrls: assetUrls(character.referenceImageKeys),
        },
      ]
    })
  },
})

export const getDraft = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return null
    const characters = await ctx.db
      .query("characters")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect()
    const draft = characters.find((character) => character.status === "draft")
    if (!draft) return null
    return {
      ...draft,
      sourceImageUrls: assetUrls(draft.sourceImageKeys ?? []),
      heroCandidateUrls: assetUrls(draft.heroCandidateKeys ?? []),
      primaryImageUrl: draft.primaryImageKey
        ? publicAssetUrl(draft.primaryImageKey)
        : null,
      referenceImageUrls: assetUrls(draft.referenceImageKeys),
    }
  },
})

export const createDraft = mutation({
  args: {
    name: v.string(),
    sourceKind: sourceKindValidator,
    sourcePrompt: v.optional(v.string()),
    sourceImageKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const name = args.name.trim()
    const sourcePrompt = args.sourcePrompt?.trim() || undefined
    if (!name) throw new Error("Character name is required")
    if (name.length > 100) throw new Error("Character name is too long")
    if (sourcePrompt && sourcePrompt.length > 2_000) {
      throw new Error("Character description is too long")
    }
    if (args.sourceKind === "prompt" && !sourcePrompt) {
      throw new Error("Describe the character first")
    }
    if (args.sourceKind === "prompt" && args.sourceImageKeys.length > 0) {
      throw new Error("Prompt characters cannot include source image keys")
    }
    if (args.sourceKind === "image" && args.sourceImageKeys.length === 0) {
      throw new Error("Upload at least one reference image")
    }
    if (args.sourceImageKeys.length > 6) {
      throw new Error("Use at most six source images")
    }
    if (new Set(args.sourceImageKeys).size !== args.sourceImageKeys.length) {
      throw new Error("Source images must be unique")
    }
    if (
      args.sourceImageKeys.some(
        (key) => !isOwnedCharacterSourceKey(user._id, key)
      )
    ) {
      throw new Error("Source image does not belong to this account")
    }
    const sourceObjects = await Promise.all(
      args.sourceImageKeys.map((key) => r2.getMetadata(ctx, key))
    )
    if (
      sourceObjects.some(
        (object) =>
          !object ||
          object.size === undefined ||
          object.size <= 0 ||
          object.size > MAX_SOURCE_IMAGE_BYTES ||
          !object.contentType ||
          !ALLOWED_SOURCE_IMAGE_TYPES.has(object.contentType.toLowerCase())
      )
    ) {
      throw new Error("Source images must be JPG, PNG, or WebP under 15 MB")
    }

    const existing = await ctx.db
      .query("characters")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    await Promise.all(
      existing
        .filter((character) => character.status === "draft")
        .map((character) => ctx.db.delete(character._id))
    )

    const now = Date.now()
    return ctx.db.insert("characters", {
      userId: user._id,
      name,
      sourceKind: args.sourceKind,
      sourcePrompt,
      sourceImageKeys: args.sourceImageKeys,
      heroCandidateKeys: [],
      referenceImageKeys: [],
      isAiCharacter: true,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const approveHero = mutation({
  args: { id: v.id("characters"), imageKey: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const character = await ctx.db.get(args.id)
    if (!character || character.userId !== user._id) {
      throw new Error("Character draft not found")
    }
    if (!(character.heroCandidateKeys ?? []).includes(args.imageKey)) {
      throw new Error("Hero candidate not found")
    }
    await ctx.db.patch(args.id, {
      primaryImageKey: args.imageKey,
      referenceImageKeys: [],
      generationError: undefined,
      updatedAt: Date.now(),
    })
  },
})

export const discardDraft = mutation({
  args: { id: v.id("characters") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const character = await ctx.db.get(args.id)
    if (!character || character.userId !== user._id || character.status !== "draft") {
      throw new Error("Character draft not found")
    }
    await ctx.db.delete(args.id)
  },
})

export const remove = mutation({
  args: { id: v.id("characters") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const character = await ctx.db.get(args.id)
    if (!character || character.userId !== user._id) {
      throw new Error("Character not found")
    }
    await ctx.db.delete(args.id)
  },
})

export const internalGetOwned = internalQuery({
  args: { id: v.id("characters"), userId: v.string() },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.id)
    return character?.userId === args.userId ? character : null
  },
})

export const internalBeginGeneration = internalMutation({
  args: {
    id: v.id("characters"),
    userId: v.string(),
    stage: generationStageValidator,
  },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.id)
    if (!character || character.userId !== args.userId || character.status !== "draft") {
      throw new Error("Character draft not found")
    }
    if (character.generationStage) throw new Error("Generation is already running")
    await ctx.db.patch(args.id, {
      generationStage: args.stage,
      generationError: undefined,
      updatedAt: Date.now(),
    })
  },
})

export const internalCompleteHero = internalMutation({
  args: {
    id: v.id("characters"),
    userId: v.string(),
    imageKey: v.string(),
  },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.id)
    if (!character || character.userId !== args.userId) {
      throw new Error("Character draft not found")
    }
    await ctx.db.patch(args.id, {
      heroCandidateKeys: [...(character.heroCandidateKeys ?? []), args.imageKey],
      generationStage: undefined,
      generationError: undefined,
      updatedAt: Date.now(),
    })
  },
})

export const internalCompleteReferences = internalMutation({
  args: {
    id: v.id("characters"),
    userId: v.string(),
    referenceImageKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.id)
    if (!character || character.userId !== args.userId || !character.primaryImageKey) {
      throw new Error("Character draft not found")
    }
    const identityLock = character.sourcePrompt?.trim()
      ? `Character description: ${character.sourcePrompt.trim()}\nThe exact same person shown in the approved reference images. Preserve facial identity, bone structure, skin tone, hair, age, build, and distinctive features in every frame.`
      : "The exact same person shown in the approved reference images. Preserve facial identity, bone structure, skin tone, hair, age, build, and distinctive features in every frame."
    await ctx.db.patch(args.id, {
      identityPrompt: identityLock,
      referenceImageKeys: args.referenceImageKeys,
      status: "ready",
      generationStage: undefined,
      generationError: undefined,
      updatedAt: Date.now(),
    })
  },
})

export const internalFailGeneration = internalMutation({
  args: {
    id: v.id("characters"),
    userId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.id)
    if (!character || character.userId !== args.userId) return
    await ctx.db.patch(args.id, {
      generationStage: undefined,
      generationError: args.error.slice(0, 1000),
      updatedAt: Date.now(),
    })
  },
})

export const internalRecordImageUsage = internalMutation({
  args: {
    userId: v.string(),
    model: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    providerRequestId: v.optional(v.string()),
    elapsedMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("usage", {
      userId: args.userId,
      operation: "character_image",
      provider: "fal",
      model: args.model,
      status: args.status,
      providerRequestId: args.providerRequestId,
      elapsedMs: args.elapsedMs,
      createdAt: Date.now(),
    })
  },
})
