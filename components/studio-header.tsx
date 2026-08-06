"use client"

import { AccountMenu } from "@/components/account-menu"
import { BrandMark } from "@/components/brand-mark"

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
  return (
    <header className="flex items-start justify-between gap-6 px-5 py-5 md:px-8 lg:px-10">
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
        <div className="md:hidden">
          <AccountMenu placement="header" />
        </div>
      </div>
    </header>
  )
}
