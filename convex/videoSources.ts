import { v } from "convex/values"
import { internalMutation, internalQuery } from "./_generated/server"

const IMPORT_LEASE_MS = 5 * 60 * 1000

type ReadyInstagramSource = {
  sourceUrl: string
  videoKey: string
  fileName: string
  durationSeconds: number
  fileSize: number
}

type ClaimInstagramSourceResult =
  | { state: "claimed" }
  | { state: "busy" }
  | { state: "ready"; source: ReadyInstagramSource }

function readySource(
  source: {
    sourceUrl: string
    videoKey: string
    fileName?: string
    durationSeconds?: number
    fileSize?: number
  }
): ReadyInstagramSource | null {
  if (
    source.fileName === undefined ||
    source.durationSeconds === undefined ||
    source.fileSize === undefined
  ) {
    return null
  }
  return {
    sourceUrl: source.sourceUrl,
    videoKey: source.videoKey,
    fileName: source.fileName,
    durationSeconds: source.durationSeconds,
    fileSize: source.fileSize,
  }
}

export const internalClaimInstagramSource = internalMutation({
  args: {
    externalId: v.string(),
    sourceUrl: v.string(),
    videoKey: v.string(),
    claimId: v.string(),
    forceReady: v.boolean(),
  },
  handler: async (ctx, args): Promise<ClaimInstagramSourceResult> => {
    const now = Date.now()
    const existing = await ctx.db
      .query("videoSources")
      .withIndex("by_platform_external_id", (q) =>
        q.eq("platform", "instagram").eq("externalId", args.externalId)
      )
      .unique()

    if (existing?.status === "ready" && !args.forceReady) {
      const source = readySource(existing)
      if (source) return { state: "ready", source }
    }
    if (
      existing?.status === "importing" &&
      existing.claimId !== args.claimId &&
      (existing.claimExpiresAt ?? 0) > now
    ) {
      return { state: "busy" }
    }

    const importing = {
      platform: "instagram" as const,
      externalId: args.externalId,
      sourceUrl: args.sourceUrl,
      videoKey: args.videoKey,
      status: "importing" as const,
      claimId: args.claimId,
      claimExpiresAt: now + IMPORT_LEASE_MS,
      fileName: undefined,
      durationSeconds: undefined,
      fileSize: undefined,
      error: undefined,
      updatedAt: now,
    }
    if (existing) {
      await ctx.db.patch(existing._id, importing)
    } else {
      await ctx.db.insert("videoSources", { ...importing, createdAt: now })
    }
    return { state: "claimed" }
  },
})

export const internalGetReadyInstagramSource = internalQuery({
  args: { externalId: v.string() },
  handler: async (ctx, args): Promise<ReadyInstagramSource | null> => {
    const source = await ctx.db
      .query("videoSources")
      .withIndex("by_platform_external_id", (q) =>
        q.eq("platform", "instagram").eq("externalId", args.externalId)
      )
      .unique()
    return source?.status === "ready" ? readySource(source) : null
  },
})

export const internalCompleteInstagramSource = internalMutation({
  args: {
    externalId: v.string(),
    claimId: v.string(),
    fileName: v.string(),
    durationSeconds: v.number(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db
      .query("videoSources")
      .withIndex("by_platform_external_id", (q) =>
        q.eq("platform", "instagram").eq("externalId", args.externalId)
      )
      .unique()
    if (
      !source ||
      source.status !== "importing" ||
      source.claimId !== args.claimId
    ) {
      throw new Error("Instagram source import claim expired")
    }
    await ctx.db.patch(source._id, {
      status: "ready",
      claimId: undefined,
      claimExpiresAt: undefined,
      fileName: args.fileName,
      durationSeconds: args.durationSeconds,
      fileSize: args.fileSize,
      error: undefined,
      updatedAt: Date.now(),
    })
  },
})

export const internalFailInstagramSource = internalMutation({
  args: {
    externalId: v.string(),
    claimId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db
      .query("videoSources")
      .withIndex("by_platform_external_id", (q) =>
        q.eq("platform", "instagram").eq("externalId", args.externalId)
      )
      .unique()
    if (
      !source ||
      source.status !== "importing" ||
      source.claimId !== args.claimId
    ) {
      return
    }
    await ctx.db.patch(source._id, {
      status: "failed",
      claimId: undefined,
      claimExpiresAt: undefined,
      error: args.error.slice(0, 500),
      updatedAt: Date.now(),
    })
  },
})
