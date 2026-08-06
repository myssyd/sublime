"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useAction, useQuery } from "convex/react"
import {
  IconArrowRight,
  IconBrandInstagram,
  IconCheck,
  IconDownload,
  IconFileUpload,
  IconLink,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAssetUpload } from "@/lib/use-asset-upload"
import { cn } from "@/lib/utils"

const MAX_VIDEO_BYTES = 200 * 1024 * 1024
const MIN_VIDEO_SECONDS = 3
const MAX_VIDEO_SECONDS = 10
type ReferenceSource = "upload" | "instagram"
type FetchedReel = {
  key: string
  fileName: string
  sourceUrl: string
  durationSeconds: number
  fileSize: number
  previewUrl: string
  reused: boolean
}

function canonicalInstagramReelUrl(value: string) {
  try {
    const url = new URL(value.trim())
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "")
    const match = url.pathname.match(/^\/reels?\/([a-zA-Z0-9_-]+)\/?$/)
    if (
      url.protocol !== "https:" ||
      !["instagram.com", "m.instagram.com"].includes(hostname) ||
      !match
    ) {
      return null
    }
    return `https://www.instagram.com/reel/${match[1]}/`
  } catch {
    return null
  }
}

function readVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const element = document.createElement("video")
    element.preload = "metadata"
    element.onloadedmetadata = () => {
      const duration = element.duration
      URL.revokeObjectURL(objectUrl)
      if (Number.isFinite(duration)) resolve(duration)
      else reject(new Error("Could not read the video duration"))
    }
    element.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Could not read this video file"))
    }
    element.src = objectUrl
  })
}

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
  const createVideo = useAction(api.videoSubmission.createAndQueue)
  const importInstagramReel = useAction(api.videoImport.importInstagramReel)
  const uploadAsset = useAssetUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [characterId, setCharacterId] = useState<Id<"characters"> | null>(null)
  const [referenceSource, setReferenceSource] = useState<ReferenceSource>("upload")
  const [video, setVideo] = useState<File | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [reelUrl, setReelUrl] = useState("")
  const [fetchedReel, setFetchedReel] = useState<FetchedReel | null>(null)
  const [fetchingReel, setFetchingReel] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [keepAudio, setKeepAudio] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const activeCharacterId = characterId ?? characters?.[0]?._id ?? null

  const selectedCharacter = useMemo(
    () => characters?.find((character) => character._id === activeCharacterId),
    [activeCharacterId, characters]
  )
  const canonicalReelUrl = canonicalInstagramReelUrl(reelUrl)
  const reelUrlValid = canonicalReelUrl !== null
  const hasReference =
    referenceSource === "upload" ? video !== null : reelUrlValid

  async function chooseVideo(file: File | undefined) {
    if (!file) return
    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!extension || !["mp4", "mov"].includes(extension)) {
      toast.error("Choose an MP4 or MOV video")
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("The reference video must be smaller than 200 MB")
      return
    }
    try {
      const duration = await readVideoDuration(file)
      if (duration < MIN_VIDEO_SECONDS || duration > MAX_VIDEO_SECONDS) {
        toast.error("The reference video must be between 3 and 10 seconds")
        return
      }
      setVideo(file)
      setVideoDuration(duration)
    } catch (error) {
      toast.error("Could not use this video", {
        description: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async function handleGenerate() {
    if (!activeCharacterId || !hasReference) return
    setSubmitting(true)
    try {
      const groupId = crypto.randomUUID()
      let sourceVideoKey: string
      let sourceFileName: string
      let sourceUrl: string | undefined
      let reusedSource = false

      if (referenceSource === "upload") {
        if (!video || videoDuration === null) return
        sourceVideoKey = await uploadAsset(video, "video-source", groupId)
        sourceFileName = video.name
      } else {
        const imported =
          fetchedReel?.sourceUrl === canonicalReelUrl
            ? fetchedReel
            : await importInstagramReel({ url: reelUrl })
        sourceVideoKey = imported.key
        sourceFileName = imported.fileName
        sourceUrl = imported.sourceUrl
        reusedSource = imported.reused
      }

      await createVideo({
        characterId: activeCharacterId,
        sourceVideoKey,
        sourceFileName,
        sourceKind: referenceSource,
        sourceUrl,
        prompt,
        keepAudio,
      })
      setVideo(null)
      setVideoDuration(null)
      setReelUrl("")
      setFetchedReel(null)
      setPrompt("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      toast.success("Video clone queued", {
        description: reusedSource
          ? "The existing Reel import was reused. Kling is reconstructing the performance."
          : "Kling is reconstructing the performance with your character.",
      })
    } catch (error) {
      toast.error("Could not start the clone", {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFetchReel() {
    if (!canonicalReelUrl) return
    setFetchingReel(true)
    try {
      const imported = await importInstagramReel({ url: canonicalReelUrl })
      setReelUrl(imported.sourceUrl)
      setFetchedReel(imported)
    } catch (error) {
      setFetchedReel(null)
      toast.error("Could not fetch the Reel", {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setFetchingReel(false)
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
                Add a source video
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,.mp4,.mov"
                className="hidden"
                onChange={(event) => void chooseVideo(event.target.files?.[0])}
              />
              <div
                role="tablist"
                aria-label="Source video type"
                className="mb-4 grid grid-cols-2 rounded-xl bg-muted p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={referenceSource === "upload"}
                  onClick={() => setReferenceSource("upload")}
                  className={cn(
                    "flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors",
                    referenceSource === "upload" &&
                      "bg-card text-foreground shadow-sm"
                  )}
                >
                  <IconFileUpload className="size-4" /> Upload file
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={referenceSource === "instagram"}
                  onClick={() => setReferenceSource("instagram")}
                  className={cn(
                    "flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors",
                    referenceSource === "instagram" &&
                      "bg-card text-foreground shadow-sm"
                  )}
                >
                  <IconBrandInstagram className="size-4" /> Instagram Reel
                </button>
              </div>

              {referenceSource === "upload" ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    void chooseVideo(event.dataTransfer.files?.[0])
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
                      <span className="mt-4 text-sm font-semibold">Video selected</span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {videoDuration?.toFixed(1)} sec · {(video.size / 1024 / 1024).toFixed(1)} MB · click to replace
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="grid size-12 place-items-center rounded-xl border bg-card shadow-sm transition-transform group-hover:-translate-y-0.5">
                        <IconFileUpload className="size-6" stroke={1.7} />
                      </span>
                      <span className="mt-4 text-sm font-semibold">Drop a video here or choose a file</span>
                      <span className="mt-1 text-xs text-muted-foreground">MP4 or MOV · 3–10 sec · up to 200 MB</span>
                    </>
                  )}
                </button>
              ) : (
                <div role="tabpanel" className="rounded-xl border bg-muted/25 px-5 py-7 sm:px-7 sm:py-9">
                  <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 text-white shadow-sm">
                    <IconBrandInstagram className="size-6" />
                  </span>
                  <label htmlFor="reel-url" className="mt-5 block text-sm font-semibold">
                    Paste a public Reel link
                  </label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    We’ll remove tracking parameters, verify 3–10 seconds, and only then save it.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <IconLink className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reel-url"
                        type="url"
                        inputMode="url"
                        value={reelUrl}
                        onChange={(event) => {
                          const nextUrl = event.target.value
                          setReelUrl(nextUrl)
                          if (
                            fetchedReel &&
                            fetchedReel.sourceUrl !== canonicalInstagramReelUrl(nextUrl)
                          ) {
                            setFetchedReel(null)
                          }
                        }}
                        onBlur={() => {
                          if (canonicalReelUrl) setReelUrl(canonicalReelUrl)
                        }}
                        placeholder="https://www.instagram.com/reel/…"
                        aria-invalid={reelUrl.length > 0 && !reelUrlValid}
                        className={cn(
                          "h-11 pl-10",
                          reelUrl.length > 0 && !reelUrlValid && "border-destructive focus:border-destructive focus:ring-destructive/20"
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 shrink-0"
                      disabled={!reelUrlValid || fetchingReel || submitting}
                      onClick={() => void handleFetchReel()}
                    >
                      {fetchingReel ? (
                        <IconLoader2 className="size-4 animate-spin" />
                      ) : fetchedReel?.sourceUrl === canonicalReelUrl ? (
                        <IconCheck className="size-4" />
                      ) : (
                        <IconDownload className="size-4" />
                      )}
                      {fetchingReel
                        ? "Fetching…"
                        : fetchedReel?.sourceUrl === canonicalReelUrl
                          ? "Fetched"
                          : "Fetch video"}
                    </Button>
                  </div>
                  {reelUrl.length > 0 ? (
                    <p className={cn(
                      "mt-2 flex items-center gap-1.5 text-xs",
                      reelUrlValid ? "text-lime-600 dark:text-lime-400" : "text-destructive"
                    )}>
                      {reelUrlValid ? <IconCheck className="size-3.5" /> : null}
                      {reelUrlValid ? "Reel link ready to import" : "Enter a link like instagram.com/reel/…"}
                    </p>
                  ) : null}
                  {fetchedReel?.sourceUrl === canonicalReelUrl ? (
                    <div className="mx-auto mt-5 w-full max-w-sm overflow-hidden rounded-xl border bg-black shadow-sm">
                      <video
                        key={fetchedReel.previewUrl}
                        src={fetchedReel.previewUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="aspect-[9/16] w-full bg-black object-contain"
                      />
                      <div className="flex justify-end border-t border-white/10 bg-card px-3 py-2.5 text-xs text-muted-foreground">
                        <span className="shrink-0">
                          {fetchedReel.durationSeconds.toFixed(1)} sec ·{" "}
                          {(fetchedReel.fileSize / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    </div>
                  ) : null}
                  <p className="mt-5 border-t pt-4 text-[11px] leading-5 text-muted-foreground">
                    Public Reels only. Use content you own or have permission to transform.
                  </p>
                </div>
              )}
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
                disabled={
                  !selectedCharacter ||
                  !hasReference ||
                  submitting ||
                  fetchingReel
                }
              >
                {submitting ? <IconLoader2 className="size-5 animate-spin" /> : <IconPlayerPlayFilled className="size-4" />}
                {submitting
                  ? referenceSource === "instagram"
                    ? "Importing Reel & queuing…"
                    : "Uploading & queuing…"
                  : "Clone this video"}
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
                      {video.sourceDurationSeconds !== undefined ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {video.sourceDurationSeconds.toFixed(1)} sec reference
                        </p>
                      ) : null}
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
