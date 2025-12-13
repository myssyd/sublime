import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users (extended by better-auth)
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    // Usage tracking
    usage: v.object({
      pagesCreated: v.number(),
      aiCallsThisMonth: v.number(),
      aiCallsResetAt: v.number(),
      storageUsedBytes: v.number(),
    }),
    plan: v.union(v.literal("free"), v.literal("pro")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Landing Pages
  landingPages: defineTable({
    userId: v.id("users"),
    name: v.string(),
    businessContext: v.object({
      name: v.string(),
      description: v.string(),
      industry: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      uniqueValue: v.optional(v.string()),
    }),
    theme: v.object({
      primaryColor: v.string(),
      secondaryColor: v.string(),
      accentColor: v.string(),
      backgroundColor: v.string(),
      textColor: v.string(),
      fontFamily: v.string(),
    }),
    status: v.union(
      v.literal("generating"),
      v.literal("draft"),
      v.literal("published")
    ),
    generationThreadId: v.optional(v.id("threads")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Smart Sections (AI-determined types)
  sections: defineTable({
    landingPageId: v.id("landingPages"),
    type: v.string(), // "hero", "features", "pricing", etc.
    order: v.number(),
    isVisible: v.boolean(),
    content: v.any(), // Flexible JSON based on section type
    variants: v.optional(v.array(v.any())),
    selectedVariant: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_page", ["landingPageId"]),

  // Visual Comments (for editing)
  comments: defineTable({
    sectionId: v.id("sections"),
    userId: v.id("users"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    content: v.string(),
    attachedMedia: v.optional(v.array(v.id("media"))),
    model: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("processing"),
      v.literal("resolved")
    ),
    aiResponse: v.optional(v.string()),
    previousContent: v.optional(v.any()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_section", ["sectionId"])
    .index("by_status", ["status"]),

  // Media Library
  media: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"),
    url: v.string(),
    filename: v.string(),
    mimeType: v.string(),
    tags: v.array(v.string()),
    extractedColors: v.optional(v.array(v.string())),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Agent Threads (for @convex-dev/agent)
  threads: defineTable({
    userId: v.id("users"),
    landingPageId: v.optional(v.id("landingPages")),
    purpose: v.union(v.literal("generation"), v.literal("editing")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Agent Messages
  messages: defineTable({
    threadId: v.id("threads"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    toolCalls: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_thread", ["threadId"]),
});
