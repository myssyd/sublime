"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useAction, useQuery } from "convex/react"
import {
  IconArrowRight,
  IconCheck,
  IconFileUpload,
  IconLink,
  IconLoader2,
  IconMovie,
  IconPlayerPlayFilled,
  IconSparkles,
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
  const reelImportAttemptRef = useRef(0)
  const importingReelUrlRef = useRef<string | null>(null)
  const [characterId, setCharacterId] = useState<Id<"characters"> | null>(null)
  const [referenceSource, setReferenceSource] = useState<ReferenceSource>("instagram")
  const [video, setVideo] = useState<File | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [reelUrl, setReelUrl] = useState("")
  const [fetchedReel, setFetchedReel] = useState<FetchedReel | null>(null)
  const [fetchingReel, setFetchingReel] = useState(false)
  const [reelError, setReelError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [keepAudio, setKeepAudio] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const activeCharacterId = characterId ?? characters?.[0]?._id ?? null

  const selectedCharacter = useMemo(
    () => characters?.find((character) => character._id === activeCharacterId),
    [activeCharacterId, characters]
  )
  const selectedCharacterVideos = useMemo(
    () => videos?.filter((video) => video.characterId === activeCharacterId),
    [activeCharacterId, videos]
  )
  const canonicalReelUrl = canonicalInstagramReelUrl(reelUrl)
  const reelUrlValid = canonicalReelUrl !== null
  const hasReference =
    referenceSource === "upload"
      ? video !== null && videoDuration !== null
      : fetchedReel?.sourceUrl === canonicalReelUrl

  async function importReel(sourceUrl: string) {
    if (
      importingReelUrlRef.current === sourceUrl ||
      fetchedReel?.sourceUrl === sourceUrl
    ) {
      return
    }
    const attempt = ++reelImportAttemptRef.current
    importingReelUrlRef.current = sourceUrl
    setFetchingReel(true)
    setReelError(null)
    try {
      const imported = await importInstagramReel({ url: sourceUrl })
      if (reelImportAttemptRef.current !== attempt) return
      setReelUrl(imported.sourceUrl)
      setFetchedReel(imported)
    } catch (error) {
      if (reelImportAttemptRef.current !== attempt) return
      setFetchedReel(null)
      setReelError(error instanceof Error ? error.message : String(error))
    } finally {
      if (reelImportAttemptRef.current === attempt) {
        importingReelUrlRef.current = null
        setFetchingReel(false)
      }
    }
  }

  function invalidateReelImport() {
    reelImportAttemptRef.current += 1
    importingReelUrlRef.current = null
    setFetchingReel(false)
  }

  function updateReelUrl(nextUrl: string) {
    const nextCanonicalUrl = canonicalInstagramReelUrl(nextUrl)
    setReferenceSource("instagram")
    setReelUrl(nextUrl)
    setReelError(null)
    if (fetchedReel && fetchedReel.sourceUrl !== nextCanonicalUrl) {
      setFetchedReel(null)
    }
    if (!nextCanonicalUrl) {
      invalidateReelImport()
      return
    }
    void importReel(nextCanonicalUrl)
  }

  useEffect(
    () => () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    },
    [videoPreviewUrl]
  )

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
      setVideoPreviewUrl(URL.createObjectURL(file))
      invalidateReelImport()
      setReferenceSource("upload")
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
      setVideoPreviewUrl(null)
      setReelUrl("")
      setFetchedReel(null)
      setReelError(null)
      invalidateReelImport()
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

  return (
    <div className="min-h-screen">
      <StudioHeader
        title="Create"
        description="Clone a performance with one of your AI characters."
      />

      <main className="mx-auto max-w-[1480px] px-5 py-6 md:px-8 lg:px-10 lg:py-8">
        {characters === undefined ? (
          <div className="grid min-h-80 place-items-center text-muted-foreground">
            <IconLoader2 className="size-5 animate-spin" />
          </div>
        ) : characters.length === 0 ? (
          <section className="mx-auto max-w-2xl rounded-2xl border bg-card px-6 py-16 text-center shadow-[0_16px_50px_-35px_rgba(0,0,0,0.35)]">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary">
              <IconSparkles className="size-7" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Create a character to get started</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Your character is the person who will perform the motion from your source video.
            </p>
            <Link href="/characters" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
              Create your first character <IconArrowRight className="size-4" />
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
            <aside className="min-w-0 lg:sticky lg:top-6">
              <div className="rounded-2xl border bg-card p-5 shadow-[0_16px_50px_-35px_rgba(0,0,0,0.35)] sm:p-6">
                <div>
                  <h2 className="text-base font-semibold">Create a video</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Choose who performs, then add the reference motion.
                  </p>
                </div>

                <div className="mt-5 border-t pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Character</p>
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-1 pt-1" role="group" aria-label="Choose a character">
                    {characters.map((character) => {
                      const active = character._id === activeCharacterId
                      return (
                        <button
                          key={character._id}
                          type="button"
                          aria-pressed={active}
                          aria-label={`${active ? "Selected character" : "Select character"}: ${character.name}`}
                          onClick={() => setCharacterId(character._id)}
                          className="group w-14 shrink-0 text-center"
                        >
                          <span
                            className={cn(
                              "relative mx-auto block size-12 rounded-full border-2 border-transparent bg-secondary p-0.5 transition-all group-hover:border-foreground/20",
                              active && "border-primary ring-4 ring-primary/15 group-hover:border-primary"
                            )}
                          >
                            {character.primaryImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={character.primaryImageUrl} alt={character.name} className="size-full rounded-full object-cover" />
                            ) : null}
                            {active ? (
                              <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                                <IconCheck className="size-2.5" stroke={3} />
                              </span>
                            ) : null}
                          </span>
                          <span className={cn("mt-1.5 block truncate text-[11px] text-muted-foreground", active && "font-semibold text-foreground")}>
                            {character.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov"
                  className="hidden"
                  onChange={(event) => void chooseVideo(event.target.files?.[0])}
                />

                <div className="mt-5 border-t pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="reel-url" className="flex items-center gap-2 text-sm font-semibold">
                      <IconMovie className="size-4 text-muted-foreground" /> Source video
                    </label>
                    {referenceSource === "upload" && video ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReferenceSource("instagram")
                          setVideo(null)
                          setVideoDuration(null)
                          setVideoPreviewUrl(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                          if (canonicalReelUrl) void importReel(canonicalReelUrl)
                        }}
                      >
                        <IconLink className="size-4" /> Use link
                      </Button>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <IconFileUpload className="size-4" /> Upload
                      </Button>
                    )}
                  </div>

                  {referenceSource === "upload" && video ? (
                    <div className="mt-3 overflow-hidden rounded-xl border bg-muted/20">
                      {videoPreviewUrl ? (
                        <video
                          key={videoPreviewUrl}
                          src={videoPreviewUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="max-h-52 w-full bg-black object-contain"
                        />
                      ) : null}
                      <div className="min-w-0 px-3 py-2.5">
                        <p className="truncate text-xs font-medium">{video.name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {videoDuration?.toFixed(1)} sec · {(video.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative mt-3">
                        <IconLink className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="reel-url"
                          type="url"
                          inputMode="url"
                          autoComplete="off"
                          value={reelUrl}
                          onChange={(event) => updateReelUrl(event.target.value)}
                          onBlur={() => {
                            if (canonicalReelUrl) setReelUrl(canonicalReelUrl)
                          }}
                          placeholder="Paste an Instagram Reel link"
                          aria-invalid={Boolean(reelError) || (reelUrl.trim().length > 0 && !reelUrlValid)}
                          aria-describedby="reel-status"
                          className={cn(
                            "h-11 pl-10 pr-10",
                            (reelError || (reelUrl.trim().length > 0 && !reelUrlValid)) &&
                              "border-destructive focus:border-destructive focus:ring-destructive/20"
                          )}
                        />
                        {fetchingReel ? (
                          <IconLoader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        ) : fetchedReel?.sourceUrl === canonicalReelUrl ? (
                          <span className="pointer-events-none absolute right-3 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground">
                            <IconCheck className="size-3" stroke={3} />
                          </span>
                        ) : null}
                      </div>
                      <div id="reel-status" aria-live="polite" className="mt-2 min-h-5">
                        {fetchingReel ? (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <IconLoader2 className="size-3.5 animate-spin" /> Loading video…
                          </p>
                        ) : reelError ? (
                          <p className="text-xs text-destructive">Couldn’t load this Reel. Check that it’s public and 3–10 seconds long.</p>
                        ) : fetchedReel?.sourceUrl === canonicalReelUrl ? (
                          <p className="flex items-center gap-1.5 text-xs font-medium text-lime-700 dark:text-lime-400">
                            <IconCheck className="size-3.5" /> Video ready · {fetchedReel.durationSeconds.toFixed(1)} sec
                          </p>
                        ) : reelUrl.trim().length > 0 && !reelUrlValid ? (
                          <p className="text-xs text-destructive">Paste a link like instagram.com/reel/…</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Loads automatically · public Reels · 3–10 sec</p>
                        )}
                      </div>
                      {fetchedReel?.sourceUrl === canonicalReelUrl ? (
                        <video
                          key={fetchedReel.previewUrl}
                          src={fetchedReel.previewUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="mt-2 max-h-48 w-full rounded-xl bg-black object-contain"
                        />
                      ) : null}
                    </>
                  )}
                </div>

                <div className="mt-5 border-t pt-5">
                  <label htmlFor="direction" className="text-sm font-semibold">Direction <span className="font-normal text-muted-foreground">· optional</span></label>
                  <Textarea
                    id="direction"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Keep the outfit, change the lighting, add wind…"
                    className="mt-3 min-h-24"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/35 px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <IconVolume className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">Keep original audio</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Music, speech, and ambience</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={keepAudio}
                    aria-label="Keep original audio"
                    onClick={() => setKeepAudio((value) => !value)}
                    className={cn("relative h-5 w-9 rounded-full bg-muted-foreground/30 transition-colors", keepAudio && "bg-primary")}
                  >
                    <span className={cn("absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform", keepAudio && "translate-x-4")} />
                  </button>
                </div>

                <Button
                  size="lg"
                  className="mt-4 w-full text-sm"
                  onClick={handleGenerate}
                  disabled={!selectedCharacter || !hasReference || submitting || fetchingReel}
                >
                  {submitting ? <IconLoader2 className="size-5 animate-spin" /> : <IconPlayerPlayFilled className="size-4" />}
                  {submitting
                    ? referenceSource === "instagram"
                      ? "Queuing clone…"
                      : "Uploading & queuing…"
                    : "Clone performance"}
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">Kling O3 Pro · usually takes several minutes</p>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="flex flex-col gap-5 rounded-2xl border bg-card px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="size-16 shrink-0 overflow-hidden rounded-full border-2 border-primary bg-secondary p-0.5 ring-4 ring-primary/10">
                    {selectedCharacter?.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedCharacter.primaryImageUrl} alt={selectedCharacter.name} className="size-full rounded-full object-cover" />
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-semibold tracking-tight">{selectedCharacter?.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">AI character · {selectedCharacterVideos?.length ?? 0} videos</p>
                  </div>
                </div>
                <Link href="/library" className={buttonVariants({ variant: "outline", size: "sm" })}>View library</Link>
              </div>

              <div className="mt-6 flex items-end justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-semibold">Creations</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Videos made with {selectedCharacter?.name}</p>
                </div>
                {selectedCharacterVideos && selectedCharacterVideos.length > 0 ? (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {selectedCharacterVideos.length} {selectedCharacterVideos.length === 1 ? "video" : "videos"}
                  </span>
                ) : null}
              </div>

              {selectedCharacterVideos === undefined ? (
                <div className="grid min-h-80 place-items-center text-muted-foreground">
                  <IconLoader2 className="size-5 animate-spin" />
                </div>
              ) : selectedCharacterVideos.length === 0 ? (
                <div className="mt-5 grid min-h-80 place-items-center rounded-2xl border border-dashed bg-card/60 px-6 text-center">
                  <div>
                    <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                      <IconMovie className="size-5" />
                    </span>
                    <p className="mt-4 text-sm font-medium">No creations yet</p>
                    <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                      Add a source video on the left to create {selectedCharacter?.name}&apos;s first performance.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3 xl:gap-4">
                  {selectedCharacterVideos.map((generatedVideo) => (
                    <article key={generatedVideo._id} className="overflow-hidden rounded-xl border bg-card">
                      <div className="relative aspect-[4/5] bg-muted">
                        {generatedVideo.outputVideoUrl ? (
                          <video
                            src={generatedVideo.outputVideoUrl}
                            controls
                            playsInline
                            preload="metadata"
                            aria-label={`${generatedVideo.characterName} generated video`}
                            className="size-full bg-black object-contain"
                          />
                        ) : generatedVideo.characterImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={generatedVideo.characterImageUrl} alt="" className="size-full object-cover opacity-55" />
                        ) : null}
                        {(generatedVideo.status === "processing" || generatedVideo.status === "queued") ? (
                          <div className="absolute inset-0 grid place-items-center bg-black/25">
                            <IconLoader2 className="size-6 animate-spin text-white" />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                        <div>
                          <p className="text-[11px] font-medium capitalize">{generatedVideo.status}</p>
                          {generatedVideo.sourceDurationSeconds !== undefined ? (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">{generatedVideo.sourceDurationSeconds.toFixed(1)} sec reference</p>
                          ) : null}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(generatedVideo.createdAt)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      </div>
  )
}
