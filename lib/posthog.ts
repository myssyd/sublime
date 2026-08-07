"use client"

import posthog from "posthog-js"

let initialized = false

export function initPosthog() {
  if (initialized || typeof window === "undefined") return
  if (process.env.NODE_ENV !== "production") return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  const uiHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"

  posthog.init(key, {
    api_host: "/_x7a",
    ui_host: uiHost.replace(".i.posthog.com", ".posthog.com"),
    capture_pageview: "history_change",
    capture_pageleave: true,
    person_profiles: "identified_only",
    capture_exceptions: true,
  })
  initialized = true
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!initialized) return
  posthog.capture(event, props)
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!initialized) return
  posthog.identify(userId, traits)
}

export function resetIdentity() {
  if (!initialized) return
  posthog.reset()
}

export function captureError(
  error: unknown,
  props?: Record<string, unknown>
) {
  if (!initialized) return
  posthog.captureException(error, props)
}
