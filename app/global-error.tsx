"use client"

import { useEffect } from "react"
import { captureError } from "@/lib/posthog"

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    captureError(error, {
      digest: error.digest,
      scope: "global_error_boundary",
    })
  }, [error])

  return (
    <html lang="en">
      <body>
        <main
          style={{
            display: "grid",
            minHeight: "100vh",
            placeItems: "center",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <div>
            <h1>Something went wrong</h1>
            <p>An unexpected error occurred. The team has been notified.</p>
            <button type="button" onClick={retry}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
