import { timingSafeEqual } from "node:crypto"

export function handleCobaltRequest(
  request: Request,
  apiKey: string,
  forward: (request: Request) => Promise<Response>,
): Response | Promise<Response> {
  const { pathname } = new URL(request.url)

  // This checks the Worker only. Monitoring must not wake the container.
  if (pathname === "/healthz" && ["GET", "HEAD"].includes(request.method)) {
    return new Response(null, { status: 204 })
  }

  const isResolve = pathname === "/" && request.method === "POST"
  const isDownload = pathname === "/tunnel" && request.method === "GET"
  if (!isResolve && !isDownload) {
    return new Response("Not found", { status: 404 })
  }

  if (!apiKey) {
    return new Response("Service unavailable", { status: 503 })
  }
  const expected = Buffer.from(`Api-Key ${apiKey}`)
  const actual = Buffer.from(request.headers.get("Authorization") ?? "")
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Cobalt still validates signed tunnel URLs and applies its own rate limits.
  return forward(request)
}
