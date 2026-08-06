"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { useUploadFile } from "@convex-dev/r2/react"
import {
  IconArrowRight,
  IconCheck,
  IconFileUpload,
  IconLoader2,
  IconMovie,
  IconPlayerPlayFilled,
  IconSparkles,
  IconUserPlus,
  IconVolume,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { StudioHeader } from "@/components/studio-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const MAX_VIDEO_BYTES = 250 * 1024 * 1024

function timeAgo(value: number) {
  const minutes = Math.max(1, Math.round((Date.now() - value) / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export default function CreatePage() {
  const characters = useQuery(api.characters.list)
  const videos = useQuery(api.videos.list)
  const createVideo = useMutation(api.videos.createAndQueue)
  const uploadFile = useUploadFile(api.assets)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [characterId, setCharacterId] = useState<Id<"characters"> | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [prompt, setPrompt] = useState("")
  const [keepAudio, setKeepAudio] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const activeCharacterId = characterId ?? characters?.[0]?._id ?? null

  const selectedCharacter = useMemo(
    () => characters?.find((character) => character._id === activeCharacterId),
    [activeCharacterId, characters]
  )

  function chooseVideo(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("video/")) {
      toast.error("Choose a video file")
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("The reference video must be smaller than 250 MB")
      return
    }
    setVideo(file)
  }

  async function handleGenerate() {
    if (!activeCharacterId || !video) return
    setSubmitting(true)
    try {
      const sourceVideoKey = await uploadFile(video)
      await createVideo({
        characterId: activeCharacterId,
        sourceVideoKey,
        sourceFileName: video.name,
        prompt,
        keepAudio,
      })
      setVideo(null)
      setPrompt("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      toast.success("Video clone queued", {
        description: "Kling is reconstructing the performance with your character.",
      })
    } catch (error) {
      toast.error("Could not start the clone", {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <StudioHeader
        eyebrow="Kling O3 Pro"
        title="Clone a performance"
        description="Choose a character and a source video. Sublime preserves the motion, scene, camera, and timing while rebuilding the performer."
        action={
          <Link href="/characters" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:flex")}>
            <IconUserPlus className="size-4" /> New character
          </Link>
        }
      />

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-7 md:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-10 lg:py-10">
        <section className="min-w-0">
          <div className="rounded-2xl border bg-card shadow-[0_16px_50px_-35px_rgba(0,0,0,0.35)]">
            <div className="border-b px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="grid size-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
                Choose your AI character
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {characters === undefined ? (
                <div className="flex h-28 items-center justify-center text-muted-foreground">
                  <IconLoader2 className="size-5 animate-spin" />
                </div>
              ) : characters.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/35 px-6 py-10 text-center">
                  <IconSparkles className="mx-auto size-7 text-muted-foreground" />
                  <h2 className="mt-3 font-semibold">Build your first character</h2>
                  <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                    Add a clean frontal portrait and a few identity references before cloning a performance.
                  </p>
                  <Link href="/characters" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
                    Create character <IconArrowRight className="size-4" />
                  </Link>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {characters.map((character) => {
                    const active = character._id === activeCharacterId
                    return (
                      <button
                        key={character._id}
                        type="button"
                        onClick={() => setCharacterId(character._id)}
                        className={cn(
                          "relative w-28 shrink-0 overflow-hidden rounded-xl border bg-muted text-left transition-all",
                          active && "border-primary ring-2 ring-primary/25"
                        )}
                      >
                        <div className="aspect-[3/4] bg-secondary">
                          {character.primaryImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={character.primaryImageUrl} alt="" className="size-full object-cover" />
                          ) : null}
                        </div>
                        <div className="truncate bg-card px-2.5 py-2 text-xs font-medium">{character.name}</div>
                        {active ? (
                          <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                            <IconCheck className="size-3.5" stroke={3} />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="grid size-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span>
                Add a reference video
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(event) => chooseVideo(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  chooseVideo(event.dataTransfer.files?.[0])
                }}
                className={cn(
                  "group flex min-h-52 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/25 px-6 text-center transition-colors hover:border-ring hover:bg-accent/35",
                  video && "border-solid border-ring bg-accent/20"
                )}
              >
                {video ? (
                  <>
                    <span className="grid size-12 place-items-center rounded-xl bg-[#1b1d17] text-primary">
                      <IconMovie className="size-6" />
                    </span>
                    <span className="mt-4 max-w-full truncate text-sm font-semibold">{video.name}</span>
                    <span className="mt-1 text-xs text-muted-foreground">{(video.size / 1024 / 1024).toFixed(1)} MB · click to replace</span>
                  </>
                ) : (
                  <>
                    <span className="grid size-12 place-items-center rounded-xl border bg-card shadow-sm transition-transform group-hover:-translate-y-0.5">
                      <IconFileUpload className="size-6" stroke={1.7} />
                    </span>
                    <span className="mt-4 text-sm font-semibold">Drop a video here or choose a file</span>
                    <span className="mt-1 text-xs text-muted-foreground">MP4, MOV, or WebM · up to 250 MB</span>
                  </>
                )}
              </button>
            </div>

            <div className="border-t px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="grid size-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span>
                Direct the transformation
              </div>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Optional: keep the black dress, make the hair slightly windblown, preserve the warm evening lighting…"
                className="min-h-28"
              />
              <label className="flex cursor-pointer items-center justify-between rounded-xl border bg-muted/25 px-4 py-3">
                <span className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-card shadow-sm"><IconVolume className="size-4" /></span>
                  <span>
                    <span className="block text-sm font-medium">Keep original audio</span>
                    <span className="block text-xs text-muted-foreground">Preserve music, speech, and ambient sound</span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={keepAudio}
                  onChange={(event) => setKeepAudio(event.target.checked)}
                  className="size-4 accent-lime-500"
                />
              </label>
              <Button
                size="lg"
                className="w-full text-[15px]"
                onClick={handleGenerate}
                disabled={!selectedCharacter || !video || submitting}
              >
                {submitting ? <IconLoader2 className="size-5 animate-spin" /> : <IconPlayerPlayFilled className="size-4" />}
                {submitting ? "Uploading & queuing…" : "Clone this video"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">High-quality Kling O3 Pro video-to-video · generation can take several minutes</p>
            </div>
          </div>
        </section>

        <aside className="min-w-0">
          <div className="sticky top-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent generations</h2>
              <Link href="/library" className="text-xs font-medium text-muted-foreground hover:text-foreground">View all</Link>
            </div>
            <div className="space-y-3">
              {videos === undefined ? (
                <div className="grid h-32 place-items-center rounded-xl border bg-card"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>
              ) : videos.length === 0 ? (
                <div className="rounded-xl border bg-card px-6 py-10 text-center">
                  <IconMovie className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">Your cloned videos will appear here</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Set up the first generation to begin.</p>
                </div>
              ) : (
                videos.slice(0, 5).map((video) => (
                  <article key={video._id} className="flex gap-3 rounded-xl border bg-card p-3">
                    <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {video.outputVideoUrl ? (
                        <video src={video.outputVideoUrl} muted playsInline className="size-full object-cover" />
                      ) : video.characterImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={video.characterImageUrl} alt="" className="size-full object-cover opacity-70" />
                      ) : null}
                      {video.status === "processing" || video.status === "queued" ? (
                        <div className="absolute inset-0 grid place-items-center bg-black/25"><IconLoader2 className="size-5 animate-spin text-white" /></div>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{video.characterName}</p>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                          video.status === "completed" && "bg-lime-100 text-lime-800",
                          video.status === "failed" && "bg-red-100 text-red-700",
                          (video.status === "queued" || video.status === "processing") && "bg-amber-100 text-amber-700"
                        )}>{video.status}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{video.sourceFileName}</p>
                      <p className="mt-4 text-[11px] text-muted-foreground">{timeAgo(video.createdAt)}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
