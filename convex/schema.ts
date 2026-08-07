import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const pictureModel = v.union(
  v.literal("seedream-5"),
  v.literal("nano-banana")
)

const pictureAspectRatio = v.union(
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
)

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
    creationImages: v.optional(
      v.array(
        v.object({
          key: v.string(),
          prompt: v.string(),
          model: pictureModel,
          aspectRatio: pictureAspectRatio,
          createdAt: v.number(),
        })
      )
    ),
    // Kept temporarily so any pre-metadata creations remain readable.
    creationImageKeys: v.optional(v.array(v.string())),
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
    characterImageKey: v.optional(v.string()),
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
      v.literal("character_image")
    ),
    provider: v.literal("fal"),
    model: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    providerRequestId: v.optional(v.string()),
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
