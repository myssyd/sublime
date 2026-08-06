"use client"

import { useQuery } from "convex/react"
import { IconCheck, IconCircleDashed, IconExternalLink } from "@tabler/icons-react"
import { api } from "@/convex/_generated/api"
import { StudioHeader } from "@/components/studio-header"

const providers = [
  { key: "fal" as const, name: "fal.ai", detail: "Kling O3 Pro video cloning" },
  { key: "openRouter" as const, name: "OpenRouter", detail: "Character analysis and prompt direction" },
  { key: "r2" as const, name: "Cloudflare R2", detail: "Private source and output assets" },
  { key: "google" as const, name: "Google OAuth", detail: "Studio sign-in" },
]

export default function SettingsPage() {
  const status = useQuery(api.settings.providerStatus)
  return (
    <div className="min-h-screen">
      <StudioHeader eyebrow="Workspace" title="Settings" description="Sublime uses isolated provider credentials and storage. Secret values stay in Convex and Vercel." />
      <div className="mx-auto max-w-3xl px-5 py-7 md:px-8 lg:px-10 lg:py-10">
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b px-5 py-4"><h2 className="font-semibold">Provider connections</h2><p className="mt-1 text-xs text-muted-foreground">Configuration status only—keys are never shown in the browser.</p></div>
          <div className="divide-y">
            {providers.map((provider) => {
              const configured = status?.[provider.key]
              return (
                <div key={provider.key} className="flex items-center justify-between gap-5 px-5 py-4">
                  <div><p className="text-sm font-medium">{provider.name}</p><p className="mt-1 text-xs text-muted-foreground">{provider.detail}</p></div>
                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${configured ? "bg-lime-100 text-lime-800" : "bg-muted text-muted-foreground"}`}>
                    {configured ? <IconCheck className="size-3.5" stroke={3} /> : <IconCircleDashed className="size-3.5" />}
                    {configured ? "Connected" : "Pending"}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
        <a href="https://sublime.kiwi" className="mt-5 flex items-center justify-between rounded-xl border bg-white px-5 py-4 text-sm font-medium hover:bg-muted/50">Production domain <span className="flex items-center gap-1 text-xs text-muted-foreground">sublime.kiwi <IconExternalLink className="size-3.5" /></span></a>
      </div>
    </div>
  )
}
