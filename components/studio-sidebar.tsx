"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconAdjustments,
  IconBolt,
  IconHomeSpark,
  IconLibraryPhoto,
  IconShieldLock,
  IconUsers,
} from "@tabler/icons-react"
import { useQuery } from "convex/react"
import { AccountMenu } from "@/components/account-menu"
import { BrandMark } from "@/components/brand-mark"
import { CreditBalance } from "@/components/credit-balance"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/create", label: "Create", icon: IconHomeSpark },
  { href: "/characters", label: "Characters", icon: IconUsers },
  { href: "/library", label: "Library", icon: IconLibraryPhoto },
  { href: "/billing", label: "Credits", icon: IconBolt },
  { href: "/settings", label: "Settings", icon: IconAdjustments },
]

export function StudioSidebar() {
  const pathname = usePathname()
  const isAdmin = useQuery(api.admin.isAdmin)
  const visibleNavItems = isAdmin
    ? [...navItems, { href: "/admin", label: "Admin", icon: IconShieldLock }]
    : navItems

  return (
    <>
      <aside className="fixed inset-y-2 left-2 z-30 hidden w-[72px] flex-col items-center rounded-2xl bg-muted/30 py-3 backdrop-blur md:flex">
        <Link href="/create" aria-label="Sublime home">
          <BrandMark />
        </Link>
        <nav className="mt-8 flex w-full flex-1 flex-col items-center gap-1 px-2">
          {visibleNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex w-full flex-col items-center gap-1 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors",
                  active ? "text-accent-foreground" : "hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-xl transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "group-hover:bg-muted group-hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" stroke={active ? 2.2 : 1.7} />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <CreditBalance className="mb-0.5 max-w-[64px] px-2" />
        <AccountMenu placement="sidebar" />
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 border-t bg-background/95 px-2 backdrop-blur md:hidden"
        style={{
          gridTemplateColumns: `repeat(${visibleNavItems.length}, minmax(0, 1fr))`,
        }}
      >
        {visibleNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-medium",
                active ? "text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" stroke={active ? 2.2 : 1.7} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
