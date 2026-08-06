"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { IconLoader2 } from "@tabler/icons-react"
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconLoader2 className="size-4 animate-spin" />
          Opening your studio
        </div>
      </div>
    )
  }

  return children
}
