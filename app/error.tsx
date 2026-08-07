"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { captureError } from "@/lib/posthog"

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest, scope: "app_error_boundary" })
  }, [error])

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center text-foreground">
      <div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. The team has been notified.
        </p>
        <Button className="mt-5" onClick={retry}>
          Try again
        </Button>
      </div>
    </div>
  )
}
