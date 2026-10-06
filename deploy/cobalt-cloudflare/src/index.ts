/// <reference types="@cloudflare/workers-types" />

import { Container, getContainer } from "@cloudflare/containers"
import { handleCobaltRequest } from "./request-handler"

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
  // Keep the two-minute tunnel map alive between resolving and downloading.
  sleepAfter = "3m"
  enableInternet = true
  pingEndpoint = "ping"

  override async onActivityExpired() {
    // The SDK waits for in-flight response streams before expiring activity.
    // Cobalt did not exit on SIGTERM in production. Its only local state is
    // the tunnel map, whose two-minute lifetime has expired by this point.
    console.log("Cobalt idle for three minutes; stopping container")
    await this.destroy()
  }

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
    return handleCobaltRequest(request, env.COBALT_API_KEY, (request) => {
      const cobalt = getContainer(env.COBALT, "sublime-cobalt-singleton")
      return cobalt.fetch(request)
    })
  },
} satisfies ExportedHandler<Env>
