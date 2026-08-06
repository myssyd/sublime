"use client"

import { useSyncExternalStore } from "react"
import {
  IconDeviceDesktop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { StudioHeader } from "@/components/studio-header"
import { cn } from "@/lib/utils"

const themeOptions = [
  {
    value: "system",
    label: "System",
    description: "Match this device",
    icon: IconDeviceDesktop,
  },
  {
    value: "light",
    label: "Light",
    description: "Always use light mode",
    icon: IconSun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use dark mode",
    icon: IconMoon,
  },
] as const

const subscribeToHydration = () => () => undefined

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  )
  return (
    <div className="min-h-screen">
      <StudioHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage how Sublime looks and behaves on this device."
      />

      <div className="mx-auto max-w-3xl space-y-5 px-5 py-7 md:px-8 lg:px-10 lg:py-10">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-5 py-4 sm:px-6">
            <h2 className="font-semibold">Appearance</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose how Sublime looks on this device.
            </p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const selected = mounted && theme === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "rounded-xl border bg-background p-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring",
                    selected && "border-primary bg-accent/45 ring-1 ring-primary/30"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground",
                      selected && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="size-4.5" stroke={1.8} />
                  </span>
                  <span className="mt-3 block text-sm font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="border-t px-5 py-3 text-xs text-muted-foreground sm:px-6">
            Tip: press <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">D</kbd> anywhere outside a text field to quickly switch light and dark mode.
          </div>
        </section>
      </div>
    </div>
  )
}
