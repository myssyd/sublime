import { Workpool } from "@convex-dev/workpool"
import { components } from "./_generated/api"

export const videoPool = new Workpool(components.videoPool, {
  maxParallelism: 2,
  retryActionsByDefault: false,
})
