import { R2 } from "@convex-dev/r2"
import { v } from "convex/values"
import { components } from "./_generated/api"
import { authComponent } from "./auth"
import { action, mutation } from "./_generated/server"

export const r2 = new R2(components.r2)

// Keep this explicit instead of using r2.clientApi().syncMetadata. The helper's
// mutation only schedules metadata synchronization, so awaiting it does not mean
// that a following mutation can read the uploaded object's metadata yet.
export const syncMetadata = action({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    if (!args.key.startsWith(`users/${user._id}/`)) {
      throw new Error("Asset does not belong to this account")
    }
    await r2.syncMetadata(ctx, args.key)
  },
})

const assetKind = v.union(
  v.literal("character-source"),
  v.literal("character-primary"),
  v.literal("character-reference"),
  v.literal("picture-reference"),
  v.literal("video-source")
)
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const generateUploadUrl = mutation({
  args: {
    kind: assetKind,
    groupId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
    if (!UUID.test(args.groupId)) {
      throw new Error("Invalid asset group")
    }

    const base = `users/${user._id}`
    const directory =
      args.kind === "character-source"
        ? `${base}/characters/${args.groupId}/sources`
        : args.kind === "character-primary"
        ? `${base}/characters/${args.groupId}/primary`
        : args.kind === "character-reference"
          ? `${base}/characters/${args.groupId}/references`
          : args.kind === "picture-reference"
            ? `${base}/pictures/${args.groupId}/references`
          : `${base}/videos/${args.groupId}/source`

    return r2.generateUploadUrl(`${directory}/${crypto.randomUUID()}`)
  },
})

export function publicAssetUrl(key: string) {
  const domain = process.env.R2_PUBLIC_DOMAIN
  if (!domain) return null
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
  return `https://${domain}/${encodedKey}`
}
