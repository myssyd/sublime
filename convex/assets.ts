import { R2 } from "@convex-dev/r2"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import { authComponent } from "./auth"

export const r2 = new R2(components.r2)

export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({
  checkUpload: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error("Not authenticated")
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
