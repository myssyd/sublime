"use client"

import { AccountMenu } from "@/components/account-menu"
import { BrandMark } from "@/components/brand-mark"
import { CreditBalance } from "@/components/credit-balance"

export function StudioHeader({
  title,
  description,
  action,
  mobileAction,
}: {
  title: string
  description: string
  action?: React.ReactNode
  mobileAction?: React.ReactNode
}) {
  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-6 md:gap-y-0 md:px-8 md:py-5 lg:px-10">
      <BrandMark className="col-start-1 row-start-1 md:hidden" />

      <div className="col-start-2 row-start-1 min-w-0 md:col-span-1 md:col-start-1">
        <h1 className="truncate text-lg font-semibold tracking-tight md:text-[28px]">
          {title}
        </h1>
        <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-muted-foreground md:block">
          {description}
        </p>
      </div>

      <div className="col-start-3 row-start-1 flex shrink-0 items-center gap-3 md:hidden">
        <CreditBalance className="md:hidden" />
        <AccountMenu placement="header" />
      </div>

      {action ? (
        <div
          className={
            mobileAction
              ? "hidden md:col-span-1 md:col-start-2 md:row-start-1 md:block md:justify-self-end"
              : "col-span-3 row-start-2 justify-self-start md:col-span-1 md:col-start-2 md:row-start-1 md:justify-self-end"
          }
        >
          {action}
        </div>
      ) : null}

      {mobileAction ? (
        <div className="fixed right-5 bottom-20 z-30 md:hidden">
          {mobileAction}
        </div>
      ) : null}
    </header>
  )
}
