import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import {
  pictureAspectRatioValidator,
  pictureModelValidator,
} from "./lib/image"
import { characterIntentValidator } from "./lib/characterIntent"
import { pictureIntentValidator } from "./lib/pictureIntent"
import { videoModelValidator } from "./lib/videoModel"

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
    characterIntent: v.optional(characterIntentValidator),
    intentModel: v.optional(v.string()),
    intentVersion: v.optional(v.number()),
    sourceImageKeys: v.optional(v.array(v.string())),
    heroCandidateKeys: v.optional(v.array(v.string())),
    imageCount: v.number(),
    videoCount: v.number(),
    generationStage: v.optional(
      v.union(v.literal("hero"), v.literal("references"))
    ),
    generationError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  images: defineTable({
    userId: v.string(),
    characterId: v.id("characters"),
    key: v.string(),
    prompt: v.string(),
    pictureIntent: v.optional(pictureIntentValidator),
    directorModel: v.optional(v.string()),
    directorVersion: v.optional(v.number()),
    providerPrompt: v.optional(v.string()),
    model: pictureModelValidator,
    aspectRatio: pictureAspectRatioValidator,
    createdAt: v.number(),
  })
    .index("by_user_created_at", ["userId", "createdAt"])
    .index("by_user_character_created_at", [
      "userId",
      "characterId",
      "createdAt",
    ]),

  videos: defineTable({
    userId: v.string(),
    characterId: v.id("characters"),
    videoKind: v.optional(
      v.union(
        v.literal("reel_clone"),
        v.literal("motion_control"),
        v.literal("lip_sync")
      )
    ),
    characterImageKey: v.optional(v.string()),
    characterImageId: v.optional(v.id("images")),
    sourceVideoKey: v.optional(v.string()),
    sourceAudioKey: v.optional(v.string()),
    sourceAudioContentType: v.optional(v.string()),
    sourceFileName: v.string(),
    sourceKind: v.optional(
      v.union(v.literal("upload"), v.literal("instagram"))
    ),
    sourceUrl: v.optional(v.string()),
    sourceDurationSeconds: v.optional(v.number()),
    sourceFileSize: v.optional(v.number()),
    prompt: v.string(),
    keepAudio: v.boolean(),
    characterOrientation: v.optional(
      v.union(v.literal("video"), v.literal("image"))
    ),
    model: v.optional(videoModelValidator),
    provider: v.union(
      v.literal("fal-kling-o3-pro"),
      v.literal("fal-seedance-2.0-fast"),
      v.literal("fal-seedance-2.5"),
      v.literal("fal-kling-v3-standard-motion-control"),
      v.literal("fal-sync-lipsync-v3")
    ),
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    providerRequestId: v.optional(v.string()),
    providerOutputUrl: v.optional(v.string()),
    creditReservationKey: v.optional(v.string()),
    creditsCharged: v.optional(v.number()),
    outputVideoKey: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_character", ["characterId"])
    .index("by_user_character", ["userId", "characterId"]),

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
      v.literal("motion_control"),
      v.literal("lip_sync"),
      v.literal("character_image"),
      v.literal("character_intent"),
      v.literal("picture_intent")
    ),
    provider: v.union(v.literal("fal"), v.literal("openrouter")),
    model: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    providerRequestId: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    creditsCharged: v.optional(v.number()),
    creditRateVersion: v.optional(v.number()),
    billingStatus: v.optional(
      v.union(v.literal("charged"), v.literal("released"))
    ),
    reservationKey: v.optional(v.string()),
    elapsedMs: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_reservation", ["reservationKey"]),

  subscriptions: defineTable({
    userId: v.string(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    plan: v.string(),
    status: v.string(),
    monthlyAllowance: v.number(),
    billingPeriod: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    subscriptionBalance: v.number(),
    topupBalance: v.number(),
    adminBalance: v.optional(v.number()),
    reservedSubscriptionCredits: v.optional(v.number()),
    reservedTopupCredits: v.optional(v.number()),
    reservedAdminCredits: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  creditLedger: defineTable({
    userId: v.string(),
    delta: v.number(),
    reason: v.string(),
    source: v.string(),
    idempotencyKey: v.string(),
    usageId: v.optional(v.id("usage")),
    stripeEventId: v.optional(v.string()),
    stripeInvoiceId: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_idempotency_key", ["idempotencyKey"]),

  creditReservations: defineTable({
    userId: v.string(),
    reservationKey: v.string(),
    credits: v.number(),
    subscriptionCredits: v.number(),
    topupCredits: v.number(),
    adminCredits: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("settled"),
      v.literal("released")
    ),
    kind: v.string(),
    refId: v.optional(v.string()),
    subscriptionPeriodEnd: v.optional(v.number()),
    usageId: v.optional(v.id("usage")),
    settledAt: v.optional(v.number()),
    releasedAt: v.optional(v.number()),
    releaseReason: v.optional(v.string()),
    attemptCount: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_key", ["reservationKey"])
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status"]),
})
