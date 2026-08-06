"use client"

import { useQuery } from "convex/react"
import { IconAlertTriangle, IconLoader2, IconMovie } from "@tabler/icons-react"
import { api } from "@/convex/_generated/api"
import { StudioHeader } from "@/components/studio-header"

export default function LibraryPage() {
  const clones = useQuery(api.videoClones.list)

  return (
    <div className="min-h-screen">
      <StudioHeader eyebrow="Output" title="Video library" description="Every performance cloned with your Sublime characters, including work still processing." />
      <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 lg:px-10 lg:py-10">
        {clones === undefined ? (
          <div className="grid min-h-80 place-items-center"><IconLoader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : clones.length === 0 ? (
          <div className="grid min-h-96 place-items-center rounded-2xl border border-dashed bg-card/60 p-8 text-center"><div><IconMovie className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-3 font-semibold">No videos yet</h2><p className="mt-1 text-sm text-muted-foreground">Your first clone will appear here as soon as you queue it.</p></div></div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {clones.map((clone) => (
              <article key={clone._id} className="overflow-hidden rounded-2xl border bg-card">
                <div className="relative aspect-[9/16] bg-[#171914]">
                  {clone.outputVideoUrl ? (
                    <video src={clone.outputVideoUrl} controls playsInline preload="metadata" className="size-full object-cover" />
                  ) : clone.characterImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={clone.characterImageUrl} alt="" className="size-full object-cover opacity-50" />
                  ) : null}
                  {!clone.outputVideoUrl ? (
                    <div className="absolute inset-0 grid place-items-center bg-black/25 text-white"><div className="text-center">{clone.status === "failed" ? <IconAlertTriangle className="mx-auto size-7 text-red-300" /> : <IconLoader2 className="mx-auto size-7 animate-spin" />}<p className="mt-3 text-xs font-semibold uppercase tracking-wider">{clone.status}</p></div></div>
                  ) : null}
                </div>
                <div className="p-4"><div className="flex items-center justify-between gap-3"><h2 className="truncate text-sm font-semibold">{clone.characterName}</h2><span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Kling O3</span></div><p className="mt-1 truncate text-xs text-muted-foreground">{clone.sourceFileName}</p>{clone.error ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-red-600">{clone.error}</p> : null}</div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
