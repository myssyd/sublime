import { v, type Infer } from "convex/values"

export const pictureModelValidator = v.union(
  v.literal("seedream-5"),
  v.literal("nano-banana")
)

export const pictureAspectRatioValidator = v.union(
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

export const characterImageSourceValidator = v.union(
  v.object({
    kind: v.literal("identity"),
    key: v.string(),
  }),
  v.object({
    kind: v.literal("generated"),
    imageId: v.id("images"),
  })
)

export type PictureModel = Infer<typeof pictureModelValidator>
export type PictureAspectRatio = Infer<typeof pictureAspectRatioValidator>
export type CharacterImageSource = Infer<typeof characterImageSourceValidator>
