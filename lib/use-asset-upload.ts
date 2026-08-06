"use client"

import { useCallback } from "react"
import { useAction, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export type AssetKind =
  | "character-source"
  | "character-primary"
  | "character-reference"
  | "video-source"

export function useAssetUpload() {
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const syncMetadata = useAction(api.assets.syncMetadata)

  return useCallback(
    async (file: File, kind: AssetKind, groupId: string) => {
      const { url, key } = await generateUploadUrl({ kind, groupId })
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })
      if (!response.ok) {
        throw new Error(`Failed to upload file (${response.status})`)
      }
      await syncMetadata({ key })
      return key
    },
    [generateUploadUrl, syncMetadata]
  )
}
