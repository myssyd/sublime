"use client"

import { Menu } from "@base-ui/react/menu"
import { IconDots, IconTrash } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export function CharacterActionsMenu({
  characterName,
  onDelete,
  className,
}: {
  characterName: string
  onDelete: () => void | Promise<void>
  className?: string
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`More actions for ${characterName}`}
        className={cn(
          "grid size-9 place-items-center rounded-lg border bg-background/90 text-muted-foreground shadow-sm backdrop-blur outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <IconDots className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          side="bottom"
          align="end"
          sideOffset={6}
          className="z-50 outline-none"
        >
          <Menu.Popup className="w-44 origin-[var(--transform-origin)] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none transition-[transform,opacity] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Menu.Item
              render={<button type="button" />}
              nativeButton
              onClick={onDelete}
              className="flex w-full cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-destructive outline-none data-highlighted:bg-destructive/10"
            >
              <IconTrash className="size-4" stroke={1.8} />
              Delete character
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
