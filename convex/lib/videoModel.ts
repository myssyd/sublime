import { v, type Infer } from "convex/values"

export const videoModelValidator = v.union(
  v.literal("kling-o3-pro"),
  v.literal("seedance-2.0-fast"),
  v.literal("seedance-2.5")
)

export type VideoModel = Infer<typeof videoModelValidator>

export const DEFAULT_VIDEO_MODEL: VideoModel = "kling-o3-pro"

export const VIDEO_MODEL_MIN_SOURCE_SECONDS: Record<VideoModel, number> = {
  "kling-o3-pro": 3,
  "seedance-2.0-fast": 4,
  "seedance-2.5": 4,
}

export function isSeedanceVideoModel(
  model: VideoModel
): model is "seedance-2.0-fast" | "seedance-2.5" {
  return model !== "kling-o3-pro"
}
