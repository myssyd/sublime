"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { IconBolt } from "@tabler/icons-react"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

export function CreditBalance({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const balance = useQuery(api.credits.getMyBalance)
  const total = balance?.total ?? 0
  const loading = balance === undefined
  const low = !loading && total < 100

  return (
    <Link
      href="/billing"
      aria-label={loading ? "Loading credit balance" : `${total} credits`}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        low
          ? "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-400/15 dark:text-amber-200"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
        compact && "size-9 px-0",
        className
      )}
    >
      <IconBolt className="size-3.5" fill="currentColor" stroke={2} />
      {!compact ? (
        <span className="tabular-nums">
          {loading ? "—" : total.toLocaleString()}
        </span>
      ) : null}
    </Link>
  )
}
