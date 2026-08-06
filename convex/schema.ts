import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  characters: defineTable({
    userId: v.string(),
    name: v.string(),
    identityPrompt: v.optional(v.string()),
    primaryImageKey: v.optional(v.string()),
    referenceImageKeys: v.array(v.string()),
    isAiCharacter: v.boolean(),
    status: v.optional(v.union(v.literal("draft"), v.literal("ready"))),
    sourceKind: v.optional(v.union(v.literal("prompt"), v.literal("image"))),
    sourcePrompt: v.optional(v.string()),
    sourceImageKeys: v.optional(v.array(v.string())),
    heroCandidateKeys: v.optional(v.array(v.string())),
    generationStage: v.optional(
      v.union(v.literal("hero"), v.literal("references"))
    ),
    generationError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  videos: defineTable({
    userId: v.string(),
    characterId: v.id("characters"),
    sourceVideoKey: v.string(),
    sourceFileName: v.string(),
    sourceKind: v.optional(
      v.union(v.literal("upload"), v.literal("instagram"))
    ),
    sourceUrl: v.optional(v.string()),
    sourceDurationSeconds: v.optional(v.number()),
    sourceFileSize: v.optional(v.number()),
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

  videoSources: defineTable({
    platform: v.literal("instagram"),
    externalId: v.string(),
    sourceUrl: v.string(),
    videoKey: v.string(),
    status: v.union(
      v.literal("importing"),
      v.literal("ready"),
      v.literal("failed")
    ),
    claimId: v.optional(v.string()),
    claimExpiresAt: v.optional(v.number()),
    fileName: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_platform_external_id", ["platform", "externalId"]),

  usage: defineTable({
    userId: v.string(),
    operation: v.union(
      v.literal("video_clone"),
      v.literal("character_image")
    ),
    provider: v.literal("fal"),
    model: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    providerRequestId: v.optional(v.string()),
    elapsedMs: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
})
