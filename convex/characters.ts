import { v } from "convex/values"
import { authComponent } from "./auth"
import { publicAssetUrl } from "./assets"
import { mutation, query } from "./_generated/server"

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
    return characters.map((character) => ({
      ...character,
      primaryImageUrl: publicAssetUrl(character.primaryImageKey),
      referenceImageUrls: character.referenceImageKeys
        .map(publicAssetUrl)
        .filter((url): url is string => Boolean(url)),
    }))
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    identityPrompt: v.string(),
    primaryImageKey: v.string(),
    referenceImageKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    const name = args.name.trim()
    const identityPrompt = args.identityPrompt.trim()
    if (!name) throw new Error("Character name is required")
    if (!identityPrompt) throw new Error("Identity description is required")
    if (args.referenceImageKeys.length > 7) {
      throw new Error("Use at most seven supporting references")
    }
    const now = Date.now()
    return ctx.db.insert("characters", {
      userId: user._id,
      name,
      identityPrompt,
      primaryImageKey: args.primaryImageKey,
      referenceImageKeys: args.referenceImageKeys,
      isAiCharacter: true,
      createdAt: now,
      updatedAt: now,
    })
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
