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
  IconPhoto,
  IconPlayerPlayFilled,
  IconPlus,
  IconSparkles,
  IconVolume,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { StudioHeader } from "@/components/studio-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAssetUpload } from "@/lib/use-asset-upload"
import { cn } from "@/lib/utils"

const MAX_VIDEO_BYTES = 200 * 1024 * 1024
const MIN_VIDEO_SECONDS = 3
const MAX_VIDEO_SECONDS = 10

type CreateMode = "picture" | "video"
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

const pictureIdeas = [
  "Golden hour portrait",
  "Editorial street style",
  "Minimal studio campaign",
]

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

export default function CreatePage() {
  const characters = useQuery(api.characters.list)
  const videos = useQuery(api.videos.list)
  const createVideo = useAction(api.videoSubmission.createAndQueue)
  const generatePicture = useAction(api.characterGeneration.generateCreation)
  const importInstagramReel = useAction(api.videoImport.importInstagramReel)
  const uploadAsset = useAssetUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reelImportAttemptRef = useRef(0)
  const importingReelUrlRef = useRef<string | null>(null)
  const [characterId, setCharacterId] = useState<Id<"characters"> | null>(null)
  const [createMode, setCreateMode] = useState<CreateMode>("picture")
  const [picturePrompt, setPicturePrompt] = useState("")
  const [generatingPicture, setGeneratingPicture] = useState(false)
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
    () => videos?.filter((item) => item.characterId === activeCharacterId),
    [activeCharacterId, videos]
  )
  const selectedCharacterPictures = useMemo(() => {
    if (!selectedCharacter) return []
    return [...(selectedCharacter.creationImageUrls ?? [])].reverse()
  }, [selectedCharacter])
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

  async function handleGeneratePicture() {
    if (!activeCharacterId || !picturePrompt.trim()) return
    setGeneratingPicture(true)
    try {
      await generatePicture({
        characterId: activeCharacterId,
        prompt: picturePrompt,
      })
      setPicturePrompt("")
      toast.success("Picture created", {
        description: `It has been added to ${selectedCharacter?.name ?? "your character"}'s studio.`,
      })
    } catch (error) {
      toast.error("Could not create the picture", {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setGeneratingPicture(false)
    }
  }

  async function handleGenerateVideo() {
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
        eyebrow="Your creative space"
        title="Studio"
        description="Choose a character, then create their next picture or video."
      />

      <main className="w-full px-5 pb-10 md:px-8 lg:px-10">
        {characters === undefined ? (
          <div className="grid min-h-96 place-items-center text-muted-foreground">
            <IconLoader2 className="size-5 animate-spin" />
          </div>
        ) : characters.length === 0 ? (
          <section className="mx-auto max-w-2xl rounded-3xl border bg-card px-6 py-16 text-center shadow-[0_20px_60px_-42px_rgba(0,0,0,0.45)]">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
              <IconSparkles className="size-7" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Create your first character</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Every studio starts with a face. Build an AI character, then come back to create their content.
            </p>
            <Link href="/characters" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
              Create a character <IconArrowRight className="size-4" />
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(360px,470px)_minmax(0,1fr)] xl:grid-cols-[480px_minmax(0,1fr)]">
            <aside className="min-w-0 space-y-5 lg:sticky lg:top-5">
              <section className="rounded-2xl border bg-card p-4 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.45)] sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold">Your characters</h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Pick who you want to create with.</p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {characters.length} {characters.length === 1 ? "character" : "characters"}
                  </span>
                </div>

                <div className="mt-4 flex gap-3 overflow-x-auto pb-0.5 pt-1" role="group" aria-label="Choose a character">
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
                            "relative mx-auto block size-14 rounded-full bg-gradient-to-tr from-muted-foreground/20 via-border to-muted p-[2px] transition-transform group-hover:scale-[1.03]",
                            active && "from-primary via-primary to-lime-300 shadow-[0_0_0_4px_var(--card),0_0_0_6px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                          )}
                        >
                          <span className="block size-full overflow-hidden rounded-full bg-secondary p-0.5">
                            {character.primaryImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={character.primaryImageUrl} alt={character.name} className="size-full rounded-full object-cover" />
                            ) : null}
                          </span>
                          {active ? (
                            <span className="absolute bottom-0 right-0 grid size-[18px] place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                              <IconCheck className="size-2.5" stroke={3} />
                            </span>
                          ) : null}
                        </span>
                        <span className={cn("mt-1.5 block truncate text-[10px] text-muted-foreground", active && "font-semibold text-foreground")}>
                          {character.name}
                        </span>
                      </button>
                    )
                  })}

                  <Link href="/characters" className="group w-14 shrink-0 text-center" aria-label="Create a new character">
                    <span className="mx-auto grid size-14 place-items-center rounded-full border border-dashed border-muted-foreground/45 bg-muted/35 text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary">
                      <IconPlus className="size-5" stroke={1.8} />
                    </span>
                    <span className="mt-1.5 block text-[10px] font-medium text-muted-foreground group-hover:text-foreground">New</span>
                  </Link>
                </div>
              </section>

              <section className="overflow-hidden rounded-3xl border bg-card shadow-[0_20px_60px_-44px_rgba(0,0,0,0.45)]">
                <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                  <span className="size-[72px] shrink-0 overflow-hidden rounded-full border bg-secondary p-0.5 shadow-sm">
                    {selectedCharacter?.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedCharacter.primaryImageUrl} alt={selectedCharacter.name} className="size-full rounded-full object-cover" />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg font-semibold tracking-tight">{selectedCharacter?.name}</h2>
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-lime-800 dark:text-lime-300">Selected</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">AI character</p>
                    <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                      {selectedCharacterPictures.length} photos <span className="mx-1.5 text-border">•</span> {selectedCharacterVideos?.length ?? 0} videos
                    </p>
                  </div>
                </div>

                <Tabs
                  value={createMode}
                  onValueChange={(value) => setCreateMode(value as CreateMode)}
                  className="border-t"
                >
                  <div className="px-5 pt-5 sm:px-6">
                    <TabsList aria-label="Creation type">
                      <TabsTrigger value="picture"><IconPhoto className="size-4" /> Picture</TabsTrigger>
                      <TabsTrigger value="video"><IconMovie className="size-4" /> Video</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="picture" className="p-5 pt-4 sm:p-6 sm:pt-4">
                    <div>
                      <h3 className="text-base font-semibold">Create a picture</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Describe the scene. {selectedCharacter?.name}&apos;s identity stays locked.
                      </p>
                    </div>
                    <label htmlFor="picture-direction" className="mt-5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Creative direction
                    </label>
                    <Textarea
                      id="picture-direction"
                      value={picturePrompt}
                      onChange={(event) => setPicturePrompt(event.target.value)}
                      placeholder={`Put ${selectedCharacter?.name ?? "the character"} in a sunlit café, candid expression, warm editorial photography…`}
                      className="mt-2 min-h-32 resize-none"
                    />
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="Picture ideas">
                      {pictureIdeas.map((idea) => (
                        <button
                          key={idea}
                          type="button"
                          onClick={() => setPicturePrompt(idea)}
                          className="rounded-full border bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                        >
                          {idea}
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center gap-3 rounded-2xl bg-muted/45 px-3.5 py-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-lime-800 dark:text-lime-300">
                        <IconSparkles className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-medium">Portrait format · 4:5</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">Optimized for a social feed.</p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="mt-4 w-full text-sm"
                      onClick={handleGeneratePicture}
                      disabled={!selectedCharacter || picturePrompt.trim().length < 3 || generatingPicture}
                    >
                      {generatingPicture ? <IconLoader2 className="size-5 animate-spin" /> : <IconSparkles className="size-4" />}
                      {generatingPicture ? "Creating picture…" : "Create picture"}
                    </Button>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">Seedream · usually takes about a minute</p>
                  </TabsContent>

                  <TabsContent value="video" className="p-5 pt-4 sm:p-6 sm:pt-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,.mp4,.mov"
                      className="hidden"
                      onChange={(event) => void chooseVideo(event.target.files?.[0])}
                    />
                    <div>
                      <h3 className="text-base font-semibold">Create a video</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">Add a short performance for {selectedCharacter?.name} to recreate.</p>
                    </div>

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
                        <div className="mt-3 overflow-hidden rounded-2xl border bg-muted/20">
                          {videoPreviewUrl ? (
                            <video key={videoPreviewUrl} src={videoPreviewUrl} controls playsInline preload="metadata" className="max-h-52 w-full bg-black object-contain" />
                          ) : null}
                          <div className="min-w-0 px-3 py-2.5">
                            <p className="truncate text-xs font-medium">{video.name}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{videoDuration?.toFixed(1)} sec · {(video.size / 1024 / 1024).toFixed(1)} MB</p>
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
                                "h-11 rounded-xl pl-10 pr-10",
                                (reelError || (reelUrl.trim().length > 0 && !reelUrlValid)) && "border-destructive focus:border-destructive focus:ring-destructive/20"
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
                              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><IconLoader2 className="size-3.5 animate-spin" /> Loading video…</p>
                            ) : reelError ? (
                              <p className="text-xs text-destructive">Couldn&apos;t load this Reel. Check that it&apos;s public and 3–10 seconds long.</p>
                            ) : fetchedReel?.sourceUrl === canonicalReelUrl ? (
                              <p className="flex items-center gap-1.5 text-xs font-medium text-lime-700 dark:text-lime-400"><IconCheck className="size-3.5" /> Video ready · {fetchedReel.durationSeconds.toFixed(1)} sec</p>
                            ) : reelUrl.trim().length > 0 && !reelUrlValid ? (
                              <p className="text-xs text-destructive">Paste a link like instagram.com/reel/…</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Loads automatically · public Reels · 3–10 sec</p>
                            )}
                          </div>
                          {fetchedReel?.sourceUrl === canonicalReelUrl ? (
                            <video key={fetchedReel.previewUrl} src={fetchedReel.previewUrl} controls playsInline preload="metadata" className="mt-2 max-h-48 w-full rounded-2xl bg-black object-contain" />
                          ) : null}
                        </>
                      )}
                    </div>

                    <div className="mt-5 border-t pt-5">
                      <label htmlFor="direction" className="text-sm font-semibold">Direction <span className="font-normal text-muted-foreground">· optional</span></label>
                      <Textarea id="direction" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Keep the outfit, change the lighting, add wind…" className="mt-3 min-h-24 resize-none" />
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/45 px-3.5 py-3">
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

                    <Button size="lg" className="mt-4 w-full text-sm" onClick={handleGenerateVideo} disabled={!selectedCharacter || !hasReference || submitting || fetchingReel}>
                      {submitting ? <IconLoader2 className="size-5 animate-spin" /> : <IconPlayerPlayFilled className="size-4" />}
                      {submitting ? (referenceSource === "instagram" ? "Queuing clone…" : "Uploading & queuing…") : "Create video"}
                    </Button>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">Kling O3 Pro · usually takes several minutes</p>
                  </TabsContent>
                </Tabs>
              </section>
            </aside>

            <section className="min-w-0 space-y-6">
              <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{selectedCharacter?.name}&apos;s studio</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">Content</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Everything created with this character, in one place.</p>
                </div>
                <Link href="/library" className={buttonVariants({ variant: "outline", size: "sm" })}>Open full library</Link>
              </div>

              <section className="overflow-hidden rounded-3xl border bg-card shadow-[0_20px_60px_-46px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-lime-800 dark:text-lime-300"><IconPhoto className="size-4" /></span>
                    <div>
                      <h3 className="text-sm font-semibold">Photos</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Portraits and posts made with {selectedCharacter?.name}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{selectedCharacterPictures.length}</span>
                </div>

                {selectedCharacterPictures.length === 0 ? (
                  <div className="grid min-h-64 place-items-center px-6 text-center">
                    <div>
                      <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><IconPhoto className="size-5" /></span>
                      <p className="mt-4 text-sm font-medium">No pictures yet</p>
                      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Use the Picture tab to create the first post.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1 bg-card p-1 sm:grid-cols-3">
                    {selectedCharacterPictures.map((imageUrl, index) => (
                      <article key={imageUrl} className="group relative aspect-square overflow-hidden rounded-sm bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt={`${selectedCharacter?.name ?? "Character"} photo ${index + 1}`} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-3xl border bg-card shadow-[0_20px_60px_-46px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground"><IconMovie className="size-4" /></span>
                    <div>
                      <h3 className="text-sm font-semibold">Videos</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Performances made with {selectedCharacter?.name}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{selectedCharacterVideos?.length ?? 0}</span>
                </div>

                {selectedCharacterVideos === undefined ? (
                  <div className="grid min-h-64 place-items-center text-muted-foreground"><IconLoader2 className="size-5 animate-spin" /></div>
                ) : selectedCharacterVideos.length === 0 ? (
                  <div className="grid min-h-64 place-items-center px-6 text-center">
                    <div>
                      <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><IconMovie className="size-5" /></span>
                      <p className="mt-4 text-sm font-medium">No videos yet</p>
                      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Switch to Video and add a Reel or upload to create the first performance.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1 bg-card p-1 sm:grid-cols-3">
                    {selectedCharacterVideos.map((generatedVideo) => (
                      <article key={generatedVideo._id} className="group min-w-0 overflow-hidden rounded-sm bg-muted">
                        <div className="relative aspect-square bg-muted">
                          {generatedVideo.outputVideoUrl ? (
                            <video src={generatedVideo.outputVideoUrl} controls playsInline preload="metadata" aria-label={`${generatedVideo.characterName} generated video`} className="size-full bg-black object-cover" />
                          ) : generatedVideo.characterImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={generatedVideo.characterImageUrl} alt="" className="size-full object-cover opacity-55" />
                          ) : null}
                          {(generatedVideo.status === "processing" || generatedVideo.status === "queued") ? (
                            <div className="absolute inset-0 grid place-items-center bg-black/25"><IconLoader2 className="size-6 animate-spin text-white" /></div>
                          ) : null}
                          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-medium capitalize text-white backdrop-blur-sm">
                            {generatedVideo.status}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
