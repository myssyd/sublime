import { describe, expect, mock, test } from "bun:test"
import { handleCobaltRequest } from "./request-handler"

const key = "test-only-key"

describe("container wake-up gate", () => {
  test("public probes, unsupported routes and unauthorized requests never forward", async () => {
    const forward = mock(async () => new Response("unexpected"))
    for (const [path, method, authorization, status] of [
      ["/healthz", "GET", "", 204],
      ["/healthz", "HEAD", "", 204],
      ["/", "GET", "", 404],
      ["/favicon.ico", "GET", "", 404],
      ["/ping", "GET", "", 404],
      ["/", "OPTIONS", "", 404],
      ["/", "POST", "", 401],
      ["/", "POST", "Api-Key wrong-key", 401],
      ["/tunnel?id=anything", "GET", "", 401],
      ["/unknown", "POST", `Api-Key ${key}`, 404],
    ] as const) {
      const response = await handleCobaltRequest(new Request(`https://cobalt.test${path}`, {
        method,
        headers: { Authorization: authorization },
      }), key, forward)
      expect(response.status).toBe(status)
    }
    expect(forward).not.toHaveBeenCalled()
  })

  test("authenticated resolve and signed download requests are preserved", async () => {
    for (const [path, method] of [["/", "POST"], ["/tunnel?id=abc&sig=signature", "GET"]]) {
      const request = new Request(`https://cobalt.test${path}`, {
        method,
        headers: { Authorization: `Api-Key ${key}`, Range: "bytes=0-99" },
        ...(method === "POST" ? { body: '{"url":"https://www.instagram.com/reel/example/"}' } : {}),
      })
      const response = new Response("stream", { status: 206 })
      const forward = mock(async (forwarded: Request) => {
        expect(forwarded).toBe(request)
        return response
      })
      expect(await handleCobaltRequest(request, key, forward)).toBe(response)
      expect(forward).toHaveBeenCalledTimes(1)
    }
  })

  test("a missing secret fails closed", async () => {
    const forward = mock(async () => new Response("unexpected"))
    const response = await handleCobaltRequest(new Request("https://cobalt.test/", {
      method: "POST", headers: { Authorization: "Api-Key " },
    }), "", forward)
    expect(response.status).toBe(503)
    expect(forward).not.toHaveBeenCalled()
  })
})
