"use client"

import { useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export function NumberPopIn({
  value,
  className,
}: {
  value: string | number
  className?: string
}) {
  const text = String(value)
  const groupRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.classList.remove("is-animating")
    void group.offsetHeight
    group.classList.add("is-animating")
  }, [text])

  return (
    <span
      ref={groupRef}
      className={cn("t-digit-group is-animating", className)}
      aria-label={text}
    >
      {[...text].map((character, index, characters) => (
        <span
          // Characters intentionally key by position so the group animation
          // restarts as one coherent price when the billing period changes.
          key={index}
          className="t-digit"
          data-stagger={
            index === characters.length - 2
              ? "1"
              : index === characters.length - 1
                ? "2"
                : undefined
          }
          aria-hidden="true"
        >
          {character}
        </span>
      ))}
    </span>
  )
}
