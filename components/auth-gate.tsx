"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ShimmerText } from "@/components/ui/shimmer-text"
import { useSession } from "@/lib/auth-client"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [isPending, pathname, router, session])

  if (isPending || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <ShimmerText className="text-sm font-medium">
          Opening your studio
        </ShimmerText>
      </div>
    )
  }

  return children
}
