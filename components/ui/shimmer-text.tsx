import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

export function ShimmerText({
  children,
  className,
  duration = "2000ms",
  baseColor = "var(--muted-foreground)",
  highlightColor = "var(--foreground)",
}: {
  children: React.ReactNode
  className?: string
  duration?: string
  baseColor?: string
  highlightColor?: string
}) {
  const text =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined
  const style = {
    "--text-shimmer-duration": duration,
    "--text-shimmer-base": baseColor,
    "--text-shimmer-highlight": highlightColor,
  } as CSSProperties

  if (text !== undefined) {
    return (
      <span
        data-slot="shimmer-text"
        data-text={text}
        className={cn("text-shimmer", className)}
        style={style}
      >
        {children}
      </span>
    )
  }

  return (
    <span
      data-slot="shimmer-text"
      className={cn("text-shimmer text-shimmer-rich", className)}
      style={style}
    >
      <span>{children}</span>
      <span aria-hidden className="text-shimmer-rich-highlight">
        {children}
      </span>
    </span>
  )
}
