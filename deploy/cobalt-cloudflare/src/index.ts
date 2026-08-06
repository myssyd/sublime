/// <reference types="@cloudflare/workers-types" />

import { Container, getContainer } from "@cloudflare/containers"

const DISABLED_SERVICES = [
  "bilibili",
  "bsky",
  "dailymotion",
  "facebook",
  "loom",
  "newgrounds",
  "ok",
  "pinterest",
  "reddit",
  "rutube",
  "snapchat",
  "soundcloud",
  "streamable",
  "tiktok",
  "tumblr",
  "twitch",
  "twitter",
  "vimeo",
  "vk",
  "youtube",
].join(",")

export class CobaltContainer extends Container<Env> {
  defaultPort = 9000
  requiredPorts = [9000]
  sleepAfter = "10m"
  enableInternet = true
  pingEndpoint = "ping"

  constructor(ctx: DurableObjectState<Record<string, never>>, env: Env) {
    super(ctx, env)
    this.envVars = {
      API_URL: env.COBALT_PUBLIC_URL,
      COBALT_API_KEY: env.COBALT_API_KEY,
      CORS_WILDCARD: "0",
      CORS_URL: "https://sublime.kiwi",
      DISABLED_SERVICES,
      DURATION_LIMIT: "10",
      RATELIMIT_WINDOW: "60",
      RATELIMIT_MAX: "60",
      TUNNEL_LIFESPAN: "120",
    }
  }
}

export default {
  fetch(request: Request, env: Env) {
    const cobalt = getContainer(env.COBALT, "sublime-cobalt-singleton")
    return cobalt.fetch(request)
  },
} satisfies ExportedHandler<Env>
