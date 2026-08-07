"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu } from "@base-ui/react/menu"
import {
  IconChevronUp,
  IconCreditCard,
  IconLoader2,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react"
import { signOut, useSession } from "@/lib/auth-client"
import { track } from "@/lib/posthog"
import { cn } from "@/lib/utils"

export function AccountMenu({ placement }: { placement: "sidebar" | "header" }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [signingOut, setSigningOut] = useState(false)
  const user = session?.user

  async function handleSignOut() {
    setSigningOut(true)
    track("auth_signout")
    await signOut()
    router.replace("/login")
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Open account menu"
        className={cn(
          "group relative grid shrink-0 place-items-center rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          placement === "sidebar" ? "size-10" : "size-9"
        )}
      >
        <span className="grid size-full place-items-center overflow-hidden rounded-full border bg-muted text-xs font-semibold">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ? `${user.name}'s profile photo` : "Profile photo"}
              className="size-full object-cover"
            />
          ) : (
            user?.name?.slice(0, 1).toUpperCase() ?? "S"
          )}
        </span>
        {placement === "sidebar" ? (
          <span className="absolute -right-1 -bottom-0.5 grid size-4 place-items-center rounded-full border bg-background text-muted-foreground shadow-sm">
            <IconChevronUp className="size-2.5" stroke={2.2} />
          </span>
        ) : null}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner
          side={placement === "sidebar" ? "right" : "bottom"}
          align="end"
          sideOffset={placement === "sidebar" ? 12 : 8}
          className="z-50 outline-none"
        >
          <Menu.Popup className="w-64 origin-[var(--transform-origin)] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none transition-[transform,opacity] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="min-w-0 px-2.5 py-2">
              <p className="truncate text-sm font-semibold">{user?.name ?? "Sublime user"}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <Menu.Separator className="my-1 h-px bg-border" />

            <Menu.LinkItem
              render={<Link href="/profile" />}
              closeOnClick
              className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none data-highlighted:bg-muted"
            >
              <IconUserCircle className="size-4 text-muted-foreground" stroke={1.8} />
              Profile
            </Menu.LinkItem>

            <Menu.LinkItem
              render={<Link href="/billing" />}
              closeOnClick
              className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none data-highlighted:bg-muted"
            >
              <IconCreditCard className="size-4 text-muted-foreground" stroke={1.8} />
              Billing & credits
            </Menu.LinkItem>

            <Menu.Separator className="my-1 h-px bg-border" />

            <Menu.Item
              render={<button type="button" />}
              nativeButton
              disabled={signingOut}
              onClick={handleSignOut}
              className="flex w-full cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-destructive outline-none data-disabled:opacity-50 data-highlighted:bg-destructive/10"
            >
              {signingOut ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconLogout className="size-4" stroke={1.8} />
              )}
              {signingOut ? "Signing out…" : "Log out"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
