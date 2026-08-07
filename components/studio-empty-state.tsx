import type { ComponentType, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function StudioEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  action: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "grid min-h-[420px] place-items-center py-12 text-center",
        className
      )}
    >
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <div className="mt-5">{action}</div>
      </div>
    </section>
  )
}
