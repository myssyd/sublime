"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconAdjustments,
  IconHomeSpark,
  IconLibraryPhoto,
  IconUsers,
} from "@tabler/icons-react"
import { AccountMenu } from "@/components/account-menu"
import { BrandMark } from "@/components/brand-mark"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/create", label: "Create", icon: IconHomeSpark },
  { href: "/characters", label: "Characters", icon: IconUsers },
  { href: "/library", label: "Library", icon: IconLibraryPhoto },
  { href: "/settings", label: "Settings", icon: IconAdjustments },
]

export function StudioSidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[84px] flex-col items-center border-r bg-background/90 py-4 backdrop-blur md:flex">
        <Link href="/create" aria-label="Sublime home">
          <BrandMark />
        </Link>
        <nav className="mt-8 flex w-full flex-1 flex-col items-center gap-1 px-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-medium text-muted-foreground transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-5" stroke={active ? 2.2 : 1.7} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <AccountMenu placement="sidebar" />
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t bg-background/95 px-2 backdrop-blur md:hidden">
        {navItems.map((item) => {
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
