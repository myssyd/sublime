"use client"

import { BrandMark } from "@/components/brand-mark"
import { useSession } from "@/lib/auth-client"

export function StudioHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  const { data: session } = useSession()

  return (
    <header className="flex items-start justify-between gap-6 border-b px-5 py-5 md:px-8 lg:px-10">
      <div className="flex min-w-0 items-start gap-3">
        <BrandMark className="mt-0.5 md:hidden" />
        <div>
          {eyebrow ? (
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {action}
        {session?.user ? (
          <div
            className="hidden size-9 place-items-center overflow-hidden rounded-full border bg-muted text-xs font-semibold sm:grid"
            title={session.user.email}
          >
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="size-full object-cover" />
            ) : (
              session.user.name?.slice(0, 1).toUpperCase() ?? "S"
            )}
          </div>
        ) : null}
      </div>
    </header>
  )
}
