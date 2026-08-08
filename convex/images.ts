import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { publicAssetUrl } from "./assets"
import {
  pictureAspectRatioValidator,
  pictureModelValidator,
} from "./lib/image"
import { pictureIntentValidator } from "./lib/pictureIntent"
import {
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server"

function withUrl<T extends { key: string }>(image: T) {
  const url = publicAssetUrl(image.key)
  return url ? { ...image, url } : null
}

export const listRecentForCharacter = query({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []
    const character = await ctx.db.get(args.characterId)
    if (!character || character.userId !== user._id) return []
    const images = await ctx.db
      .query("images")
      .withIndex("by_user_character_created_at", (q) =>
        q.eq("userId", user._id).eq("characterId", args.characterId)
      )
      .order("desc")
      .take(8)
    return images.flatMap((image) => {
      const result = withUrl(image)
      return result ? [result] : []
    })
  },
})

export const listPage = query({
  args: {
    characterId: v.optional(v.id("characters")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) {
      return { page: [], isDone: true, continueCursor: "" }
    }
    const query = args.characterId
      ? ctx.db
          .query("images")
          .withIndex("by_user_character_created_at", (q) =>
            q.eq("userId", user._id).eq("characterId", args.characterId!)
          )
          .order("desc")
      : ctx.db
          .query("images")
          .withIndex("by_user_created_at", (q) => q.eq("userId", user._id))
          .order("desc")
    const result = await query.paginate(args.paginationOpts)
    return {
      ...result,
      page: (
        await Promise.all(
          result.page.map(async (image) => {
            const character = await ctx.db.get(image.characterId)
            const enriched = withUrl({
              ...image,
              characterName: character?.name ?? "Deleted character",
              characterImageUrl: character?.primaryImageKey
                ? publicAssetUrl(character.primaryImageKey)
                : null,
            })
            return enriched
          })
        )
      ).filter((image) => image !== null),
    }
  },
})

export const internalCreate = internalMutation({
  args: {
    userId: v.string(),
    characterId: v.id("characters"),
    key: v.string(),
    prompt: v.string(),
    pictureIntent: pictureIntentValidator,
    directorModel: v.string(),
    directorVersion: v.number(),
    providerPrompt: v.string(),
    model: pictureModelValidator,
    aspectRatio: pictureAspectRatioValidator,
  },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.characterId)
    if (
      !character ||
      character.userId !== args.userId ||
      character.status !== "ready"
    ) {
      throw new Error("Character not found")
    }
    const imageId = await ctx.db.insert("images", {
      ...args,
      createdAt: Date.now(),
    })
    await ctx.db.patch(args.characterId, {
      imageCount: character.imageCount + 1,
      updatedAt: Date.now(),
    })
    return imageId
  },
})

export const internalGetOwned = internalQuery({
  args: {
    id: v.id("images"),
    userId: v.string(),
    characterId: v.id("characters"),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.id)
    return image?.userId === args.userId &&
      image.characterId === args.characterId
      ? image
      : null
  },
})
