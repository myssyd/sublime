import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  characters: defineTable({
    userId: v.string(),
    name: v.string(),
    identityPrompt: v.string(),
    primaryImageKey: v.string(),
    referenceImageKeys: v.array(v.string()),
    isAiCharacter: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  videoClones: defineTable({
    userId: v.string(),
    characterId: v.id("characters"),
    sourceVideoKey: v.string(),
    sourceFileName: v.string(),
    prompt: v.string(),
    keepAudio: v.boolean(),
    provider: v.literal("fal-kling-o3-pro"),
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    providerRequestId: v.optional(v.string()),
    outputVideoKey: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_character", ["characterId"]),

  usage: defineTable({
    userId: v.string(),
    operation: v.literal("video_clone"),
    provider: v.literal("fal"),
    model: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    providerRequestId: v.optional(v.string()),
    elapsedMs: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
})
