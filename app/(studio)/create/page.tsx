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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const pictureModels = [
  {
    value: "seedream-5",
    label: "Seedream 5",
    icon: "bytedance",
    description: "Detailed, polished compositions",
  },
  {
    value: "nano-banana",
    label: "Nano Banana",
    icon: "nanobanana",
    description: "Natural, prompt-faithful edits",
  },
] as const

const pictureAspectRatios = [
  { value: "9:16", label: "Reel / Story", description: "Vertical" },
  { value: "4:5", label: "Instagram post", description: "Portrait" },
  { value: "1:1", label: "Feed post", description: "Square" },
] as const

type PictureModel = (typeof pictureModels)[number]["value"]
type PictureAspectRatio = (typeof pictureAspectRatios)[number]["value"]

function PictureModelIcon({
  icon,
  className,
}: {
  icon: (typeof pictureModels)[number]["icon"]
  className?: string
}) {
  if (icon === "nanobanana") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M8.342 13.16H3.455c-.513 0-.772-.639-.408-1.012l1.608-1.653a3.166 3.166 0 0 1 4.565 0l.513.527.044.002c.735-1.93.786-2.809.783-5.007v-.275c-.01-1.782-.02-3.935 1.965-4.22 2.603-.375 4.504 4.219 4.815 8.299a3.166 3.166 0 0 1 3.38.774l1.609 1.653c.365.375.106 1.012-.407 1.012H19.27c.072.264.11.542.11.828v5.664c0 .914-.994 1.292-1.602.576-.229-.27-1.067-1.25-2.155-2.52-2.92 4.183-10.266 6.462-12.34 3.006h-.793a.991.991 0 1 1 0-1.982h.246c.014-1.687 1.23-3.148 2.846-3.783a7.448 7.448 0 0 0 2.76-1.889Zm7.543-2.145c0-.127-.001-.256-.005-.388a15.693 15.693 0 0 0-.632-3.939c-.38-1.282-.887-2.33-1.425-2.992-.545-.671-.906-.715-1.085-.69-.223.032-.292.098-.322.129-.05.052-.135.176-.209.45-.152.567-.15 1.286-.147 2.186v.244c.002 1.134-.009 2.028-.145 2.92a11.292 11.292 0 0 1-.537 2.08h4.507Zm-3.468 3.056c-1.636 3.166-4.981 4.71-8.118 4.87a.562.562 0 0 0 .057 1.124c3.294-.169 6.921-1.749 8.845-5.081l-.784-.913Z" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="m14.944 18.587-1.704-.445V10.01l1.824-.462c1-.254 1.84-.461 1.88-.453.032 0 .056 2.235.056 4.972v4.973l-.176-.008c-.104 0-.952-.207-1.88-.446ZM7 16.542c0-2.736.024-4.98.064-4.98.032-.008.872.2 1.88.454l1.816.461-.016 4.05-.024 4.049-1.632.422c-.896.23-1.736.445-1.856.469L7 21.523v-4.98Zm12.24-4.065c0-9.03.008-9.515.144-9.475.072.024.784.207 1.576.406.792.207 1.576.405 1.744.445l.296.08-.016 8.56-.024 8.568-1.624.414c-.888.23-1.728.437-1.856.47l-.24.055v-9.523ZM1 12.509c0-4.678.024-8.505.064-8.505.032 0 .872.207 1.872.454l1.824.461v7.582c0 4.16-.016 7.574-.032 7.574-.024 0-.872.215-1.88.47L1 21.013v-8.505Z" />
    </svg>
  )
}

function AspectRatioIcon({ ratio }: { ratio: PictureAspectRatio }) {
  const dimensions: Record<PictureAspectRatio, { width: number; height: number }> = {
    "4:5": { width: 11, height: 13 },
    "1:1": { width: 12, height: 12 },
    "9:16": { width: 8, height: 14 },
  }
  const { width, height } = dimensions[ratio]

  return (
    <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
      <span
        className="rounded-[2px] border border-current opacity-70"
        style={{ width, height }}
      />
    </span>
  )
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
  const [pictureModel, setPictureModel] = useState<PictureModel>("seedream-5")
  const [pictureAspectRatio, setPictureAspectRatio] =
    useState<PictureAspectRatio>("9:16")
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
        model: pictureModel,
        aspectRatio: pictureAspectRatio,
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
            <aside className="min-w-0 space-y-3 lg:sticky lg:top-5">
              <section className="px-1">
                <div>
                  <h2 className="text-sm font-semibold">
                    Your characters <span className="ml-1 text-[11px] font-medium text-muted-foreground">{characters.length}</span>
                  </h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Pick who you want to create with.</p>
                </div>

                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 pt-1" role="group" aria-label="Choose a character">
                  {characters.map((character) => {
                    const active = character._id === activeCharacterId
                    return (
                      <button
                        key={character._id}
                        type="button"
                        aria-pressed={active}
                        aria-label={`${active ? "Selected character" : "Select character"}: ${character.name}`}
                        onClick={() => setCharacterId(character._id)}
                        className="group w-12 shrink-0 text-center"
                      >
                        <span
                          className={cn(
                            "relative mx-auto block size-12 rounded-full bg-gradient-to-tr from-muted-foreground/20 via-border to-muted p-[2px] transition-transform group-hover:scale-[1.03]",
                            active && "from-primary via-primary to-lime-300 shadow-[0_0_0_3px_var(--background),0_0_0_5px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                          )}
                        >
                          <span className="block size-full overflow-hidden rounded-full bg-secondary p-0.5">
                            {character.primaryImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={character.primaryImageUrl} alt={character.name} className="size-full rounded-full object-cover" />
                            ) : null}
                          </span>
                          {active ? (
                            <span className="absolute bottom-0 right-0 grid size-4 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground">
                              <IconCheck className="size-2" stroke={3} />
                            </span>
                          ) : null}
                        </span>
                        <span className={cn("mt-1.5 block truncate text-[10px] text-muted-foreground", active && "font-semibold text-foreground")}>
                          {character.name}
                        </span>
                      </button>
                    )
                  })}

                  <Link href="/characters" className="group w-12 shrink-0 text-center" aria-label="Create a new character">
                    <span className="mx-auto grid size-12 place-items-center rounded-full border border-dashed border-muted-foreground/45 bg-muted/35 text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary">
                      <IconPlus className="size-4" stroke={1.8} />
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
                    <h2 className="truncate text-lg font-semibold tracking-tight">{selectedCharacter?.name}</h2>
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
                    <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-5">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Model
                        </span>
                        <Select
                          value={pictureModel}
                          disabled={generatingPicture}
                          onValueChange={(value) => {
                            if (value) setPictureModel(value as PictureModel)
                          }}
                        >
                          <SelectTrigger
                            aria-label={`Image model: ${pictureModels.find((model) => model.value === pictureModel)?.label}`}
                            className="mt-2 h-11 w-full text-xs font-medium"
                          >
                            <SelectValue>
                              {(value: PictureModel) => {
                                const model = pictureModels.find((option) => option.value === value)
                                return model ? (
                                  <>
                                    <PictureModelIcon icon={model.icon} className="size-4 text-muted-foreground" />
                                    <span className="truncate">{model.label}</span>
                                  </>
                                ) : null
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent align="start" alignItemWithTrigger={false} className="w-64">
                            {pictureModels.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                <PictureModelIcon icon={model.icon} className="size-4 text-muted-foreground" />
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium">{model.label}</span>
                                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{model.description}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Aspect ratio
                        </span>
                        <Select
                          value={pictureAspectRatio}
                          disabled={generatingPicture}
                          onValueChange={(value) => {
                            if (value) setPictureAspectRatio(value as PictureAspectRatio)
                          }}
                        >
                          <SelectTrigger
                            aria-label={`Aspect ratio: ${pictureAspectRatios.find((ratio) => ratio.value === pictureAspectRatio)?.label} (${pictureAspectRatio})`}
                            className="mt-2 h-11 w-full text-xs font-medium"
                          >
                            <SelectValue>
                              {(value: PictureAspectRatio) => {
                                const ratio = pictureAspectRatios.find((option) => option.value === value)
                                return ratio ? (
                                  <>
                                    <AspectRatioIcon ratio={ratio.value} />
                                    <span className="truncate">{ratio.value} · {ratio.label}</span>
                                  </>
                                ) : null
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent align="start" alignItemWithTrigger={false} className="w-60">
                            {pictureAspectRatios.map((ratio) => (
                              <SelectItem key={ratio.value} value={ratio.value}>
                                <AspectRatioIcon ratio={ratio.value} />
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium">{ratio.label}</span>
                                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{ratio.description} · {ratio.value}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                      {pictureModels.find((model) => model.value === pictureModel)?.label} · {pictureAspectRatio} · usually takes about a minute
                    </p>
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
                  <h2 className="text-2xl font-semibold tracking-tight">Content</h2>
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
