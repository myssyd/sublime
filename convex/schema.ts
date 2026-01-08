import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================================================
// Shared Value Definitions
// ============================================================================

const businessContextValidator = v.object({
  name: v.string(),
  description: v.string(),
  industry: v.optional(v.string()),
  targetAudience: v.optional(v.string()),
  uniqueValue: v.optional(v.string()),
});

const themeValidator = v.object({
  primaryColor: v.string(),
  secondaryColor: v.string(),
  accentColor: v.string(),
  backgroundColor: v.string(),
  textColor: v.string(),
  fontFamily: v.string(),
  borderRadius: v.optional(v.string()),
});

const blockCompositionValidator = v.object({
  root: v.string(),
  blocks: v.any(), // Record<blockId, BlockDefinition>
});

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

  // ============================================================================
  // V2: Websites & Pages (Block-based system)
  // ============================================================================

  // Websites - container for multi-page sites
  websites: defineTable({
    userId: v.id("users"),
    name: v.string(),
    slug: v.optional(v.string()),
    businessContext: businessContextValidator,
    theme: themeValidator,
    // Global navigation
    navigation: v.optional(
      v.object({
        logo: v.optional(v.string()),
        logoText: v.optional(v.string()),
        links: v.array(
          v.object({
            label: v.string(),
            pageId: v.optional(v.id("pages")),
            url: v.optional(v.string()),
            isExternal: v.optional(v.boolean()),
          })
        ),
        ctaButton: v.optional(
          v.object({
            text: v.string(),
            pageId: v.optional(v.id("pages")),
            url: v.optional(v.string()),
          })
        ),
      })
    ),
    // Global footer
    footer: v.optional(
      v.object({
        logo: v.optional(v.string()),
        logoText: v.optional(v.string()),
        description: v.optional(v.string()),
        columns: v.optional(
          v.array(
            v.object({
              title: v.string(),
              links: v.array(
                v.object({
                  label: v.string(),
                  pageId: v.optional(v.id("pages")),
                  url: v.optional(v.string()),
                })
              ),
            })
          )
        ),
        socialLinks: v.optional(
          v.array(
            v.object({
              platform: v.string(),
              url: v.string(),
            })
          )
        ),
        copyright: v.optional(v.string()),
      })
    ),
    status: v.union(v.literal("draft"), v.literal("published")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_slug", ["slug"]),

  // Pages within a website
  pages: defineTable({
    websiteId: v.id("websites"),
    name: v.string(),
    slug: v.string(),
    pageType: v.union(
      v.literal("landing"),
      v.literal("about"),
      v.literal("contact"),
      v.literal("services"),
      v.literal("portfolio"),
      v.literal("blog-list"),
      v.literal("blog-post"),
      v.literal("dashboard"),
      v.literal("custom")
    ),
    // Page-level metadata
    meta: v.optional(
      v.object({
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        ogImage: v.optional(v.string()),
      })
    ),
    // Page-specific theme overrides
    themeOverrides: v.optional(
      v.object({
        backgroundColor: v.optional(v.string()),
        textColor: v.optional(v.string()),
      })
    ),
    isHomePage: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published")),
    generationThreadId: v.optional(v.id("threads")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_website", ["websiteId"])
    .index("by_slug", ["websiteId", "slug"]),

  // V2 Sections with block compositions
  pageSections: defineTable({
    pageId: v.id("pages"),
    name: v.optional(v.string()),
    // Block composition tree
    composition: blockCompositionValidator,
    order: v.number(),
    isVisible: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_page", ["pageId"]),

  // ============================================================================
  // V1: Legacy Landing Pages (deprecated, kept for migration)
  // ============================================================================

  // Landing Pages (DEPRECATED - use websites + pages instead)
  landingPages: defineTable({
    userId: v.id("users"),
    name: v.string(),
    businessContext: businessContextValidator,
    theme: v.object({
      primaryColor: v.string(),
      secondaryColor: v.string(),
      accentColor: v.string(),
      backgroundColor: v.string(),
      textColor: v.string(),
      fontFamily: v.string(),
      borderRadius: v.optional(v.union(v.string(), v.number())),
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

  // Legacy Sections (DEPRECATED - use pageSections instead)
  sections: defineTable({
    landingPageId: v.id("landingPages"),
    type: v.string(), // "hero", "features", "pricing", etc.
    templateId: v.optional(v.string()), // e.g., "hero-centered", "hero-gradient"
    order: v.number(),
    isVisible: v.boolean(),
    content: v.any(), // Flexible JSON based on section type
    styleOverrides: v.optional(
      v.object({
        section: v.optional(v.string()), // Tailwind classes for section container
        elements: v.optional(v.any()), // Record<selector, tailwindClasses>
      })
    ),
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
