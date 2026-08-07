"use client"

import { AccountMenu } from "@/components/account-menu"
import { BrandMark } from "@/components/brand-mark"
import { CreditBalance } from "@/components/credit-balance"

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
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-6 md:gap-y-0 md:px-8 lg:px-10">
      <BrandMark className="col-start-1 row-start-1 md:hidden" />

      <div className="col-span-3 row-start-2 min-w-0 md:col-span-1 md:col-start-1 md:row-start-1">
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

      <div className="col-start-3 row-start-1 flex shrink-0 items-center gap-3 md:hidden">
        <CreditBalance className="md:hidden" />
        <AccountMenu placement="header" />
      </div>

      {action ? (
        <div className="col-span-3 row-start-3 justify-self-start md:col-span-1 md:col-start-2 md:row-start-1 md:justify-self-end">
          {action}
        </div>
      ) : null}
    </header>
  )
}
