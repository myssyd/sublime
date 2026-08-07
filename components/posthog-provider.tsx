"use client"

import { useEffect, useRef } from "react"
import { useSession } from "@/lib/auth-client"
import { identify, initPosthog, resetIdentity } from "@/lib/posthog"

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession()
  const identifiedUserId = useRef<string | null>(null)
  const userId = data?.user.id
  const userEmail = data?.user.email
  const userName = data?.user.name

  useEffect(() => {
    initPosthog()
  }, [])

  useEffect(() => {
    if (isPending) return

    if (userId) {
      identify(userId, {
        email: userEmail,
        name: userName,
      })
      identifiedUserId.current = userId
    } else if (identifiedUserId.current) {
      resetIdentity()
      identifiedUserId.current = null
    }
  }, [isPending, userEmail, userId, userName])

  return <>{children}</>
}
