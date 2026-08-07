"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAction, useMutation, useQuery } from "convex/react"
import {
  IconArrowLeft,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconLoader2,
  IconPhotoUp,
  IconPhoto,
  IconPlus,
  IconRefresh,
  IconSparkles,
  IconTextCaption,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { StudioHeader } from "@/components/studio-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAssetUpload } from "@/lib/use-asset-upload"
import { track } from "@/lib/posthog"
import { cn } from "@/lib/utils"

type SourceKind = "prompt" | "image"
type SourceImage = {
  file: File
  previewUrl: string
}

const MAX_SOURCE_IMAGES = 6
const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

function stepClass(active: boolean, complete: boolean) {
  return cn(
    "grid size-7 place-items-center rounded-full border text-xs font-semibold transition-colors",
    complete && "border-primary bg-primary text-primary-foreground",
    active && !complete && "border-primary text-primary",
    !active && !complete && "text-muted-foreground"
  )
}

export default function CharactersPage() {
  const characters = useQuery(api.characters.list)
  const draft = useQuery(api.characters.getDraft)
  const createDraft = useMutation(api.characters.createDraft)
  const approveHero = useMutation(api.characters.approveHero)
  const discardDraft = useMutation(api.characters.discardDraft)
  const removeCharacter = useMutation(api.characters.remove)
  const generateHero = useAction(api.characterGeneration.generateHero)
  const generateReferencePack = useAction(
    api.characterGeneration.generateReferencePack
  )
  const uploadAsset = useAssetUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sourceImagesRef = useRef<SourceImage[]>([])

  const [builderOpen, setBuilderOpen] = useState(false)
  const [dismissedDraftId, setDismissedDraftId] = useState<
    Id<"characters"> | null
  >(null)
  const [sourceKind, setSourceKind] = useState<SourceKind | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([])
  const [selectedHeroKey, setSelectedHeroKey] = useState("")
  const [adjustment, setAdjustment] = useState("")
  const [working, setWorking] = useState(false)

  const showBuilder =
    builderOpen || Boolean(draft && draft._id !== dismissedDraftId)
  const heroCandidates = useMemo(
    () =>
      (draft?.heroCandidateKeys ?? []).map((key, index) => ({
        key,
        url: draft?.heroCandidateUrls[index] ?? null,
      })),
    [draft]
  )

  const effectiveSelectedHeroKey = (draft?.heroCandidateKeys ?? []).includes(
    selectedHeroKey
  )
    ? selectedHeroKey
    : (draft?.heroCandidateKeys?.at(-1) ?? "")

  useEffect(
    () => () => {
      sourceImagesRef.current.forEach(({ previewUrl }) =>
        URL.revokeObjectURL(previewUrl)
      )
    },
    []
  )

  function replaceSourceImages(files: File[]) {
    sourceImagesRef.current.forEach(({ previewUrl }) =>
      URL.revokeObjectURL(previewUrl)
    )
    const nextImages = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    sourceImagesRef.current = nextImages
    setSourceImages(nextImages)
  }

  function clearSourceImages() {
    replaceSourceImages([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function resetLocalBuilder() {
    setSourceKind(null)
    setName("")
    setDescription("")
    clearSourceImages()
    setSelectedHeroKey("")
    setAdjustment("")
  }

  function chooseFiles(list: FileList | null) {
    const selected = Array.from(list ?? []).slice(0, MAX_SOURCE_IMAGES)
    if (!selected.length) return
    const invalid = selected.find(
      (file) =>
        !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES
    )
    if (invalid) {
      toast.error("Use JPG, PNG, or WebP files smaller than 15 MB")
      return
    }
    replaceSourceImages(selected)
  }

  async function startBuilder() {
    if (!sourceKind || !name.trim() || working) return
    if (sourceKind === "prompt" && !description.trim()) return
    if (sourceKind === "image" && sourceImages.length === 0) return
    setWorking(true)
    try {
      const groupId = crypto.randomUUID()
      const sourceImageKeys =
        sourceKind === "image"
          ? await Promise.all(
              sourceImages.map(({ file }) =>
                uploadAsset(file, "character-source", groupId)
              )
            )
          : []
      const characterId = await createDraft({
        name: name.trim(),
        sourceKind,
        sourcePrompt: description.trim() || undefined,
        sourceImageKeys,
      })
      track("generation_requested", {
        kind: "character_hero",
        source_kind: sourceKind,
        source_image_count: sourceImages.length,
        retry: false,
      })
      const result = await generateHero({ characterId })
      setSelectedHeroKey(result.imageKey)
    } catch (error) {
      track("generation_failed", {
        kind: "character_hero",
        retry: false,
      })
      toast.error("Could not generate the hero", {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setWorking(false)
    }
  }

  async function retryHero(characterId: Id<"characters">) {
    if (working) return
    setWorking(true)
    try {
      track("generation_requested", {
        kind: "character_hero",
        retry: true,
        has_adjustment: Boolean(adjustment.trim()),
      })
      const result = await generateHero({
        characterId,
        adjustment: adjustment.trim() || undefined,
      })
      setSelectedHeroKey(result.imageKey)
      setAdjustment("")
    } catch (error) {
      track("generation_failed", {
        kind: "character_hero",
        retry: true,
      })
      toast.error("Could not generate another hero", {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setWorking(false)
    }
  }

  async function approveAndBuildReferences() {
    if (!draft || !effectiveSelectedHeroKey || working) return
    setWorking(true)
    try {
      await approveHero({ id: draft._id, imageKey: effectiveSelectedHeroKey })
      track("generation_requested", {
        kind: "character_reference_pack",
        retry: false,
      })
      await generateReferencePack({ characterId: draft._id })
      track("character_created", { source_kind: draft.sourceKind })
      setBuilderOpen(false)
      setDismissedDraftId(null)
      resetLocalBuilder()
      toast.success(`${draft.name} is ready`, {
        description: "Seedream created a Kling-ready identity pack.",
      })
    } catch (error) {
      track("generation_failed", {
        kind: "character_reference_pack",
        retry: false,
      })
      toast.error("Could not build the reference pack", {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setWorking(false)
    }
  }

  async function retryReferencePack() {
    if (!draft || working) return
    setWorking(true)
    try {
      track("generation_requested", {
        kind: "character_reference_pack",
        retry: true,
      })
      await generateReferencePack({ characterId: draft._id })
      track("character_created", {
        source_kind: draft.sourceKind,
        retry: true,
      })
      setBuilderOpen(false)
      setDismissedDraftId(null)
      resetLocalBuilder()
      toast.success(`${draft.name} is ready`, {
        description: "Seedream created a Kling-ready identity pack.",
      })
    } catch (error) {
      track("generation_failed", {
        kind: "character_reference_pack",
        retry: true,
      })
      toast.error("Could not build the reference pack", {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setWorking(false)
    }
  }

  async function startOver() {
    if (draft) {
      await discardDraft({ id: draft._id })
    }
    resetLocalBuilder()
    setDismissedDraftId(null)
    setBuilderOpen(true)
  }

  const heroSelected = Boolean(draft?.primaryImageKey)
  const activeStep =
    heroSelected || draft?.generationStage === "references"
      ? 3
      : heroCandidates.length || draft?.generationStage === "hero"
        ? 2
        : 1
  const selectedHero = heroCandidates.find(
    (candidate) => candidate.key === effectiveSelectedHeroKey
  )

  return (
    <div className="min-h-screen">
      <StudioHeader
        eyebrow="Identity system"
        title="Characters"
        description="Build reusable, Kling-ready identities with Seedream-generated portrait and full-body references."
        action={
          !showBuilder ? (
            <Button
              size="sm"
              onClick={() => {
                if (!draft) resetLocalBuilder()
                setDismissedDraftId(null)
                setBuilderOpen(true)
              }}
            >
              {draft ? <IconArrowRight className="size-4" /> : <IconPlus className="size-4" />}
              {draft ? "Continue draft" : "New character"}
            </Button>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 lg:px-10 lg:py-10">
        {showBuilder ? (
          <section className="animate-in overflow-hidden rounded-2xl border bg-card shadow-[0_20px_70px_-45px_rgba(0,0,0,0.45)] duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
            <div className="flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close character builder"
                  onClick={() => {
                    if (draft) {
                      toast.message("Your character draft is saved")
                      setDismissedDraftId(draft._id)
                    }
                    setBuilderOpen(false)
                  }}
                >
                  <IconArrowLeft className="size-4" />
                </Button>
                <div>
                  <h2 className="font-semibold">Build a character</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Seedream 5 Pro creates the identity references used by Kling.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {["Source", "Hero", "References"].map((label, index) => {
                  const step = index + 1
                  return (
                    <div key={label} className="flex items-center gap-2">
                      {index > 0 ? <span className="h-px w-5 bg-border" /> : null}
                      <span className={stepClass(activeStep === step, activeStep > step)}>
                        {activeStep > step ? <IconCheck className="size-3.5" /> : step}
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {!draft ? (
              <div className="p-5 sm:p-6 lg:p-8">
                {!sourceKind ? (
                  <div className="mx-auto max-w-3xl">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold tracking-tight">
                        Choose a starting point
                      </h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Create someone new or build from existing photos.
                      </p>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setSourceKind("prompt")}
                        className="group flex min-h-44 flex-col rounded-xl border bg-muted/20 p-5 text-left outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/35 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
                      >
                        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                          <IconTextCaption className="size-5" />
                        </span>
                        <span className="mt-auto flex items-end justify-between gap-4 pt-7">
                          <span>
                            <span className="block text-base font-semibold">From a description</span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                              Generate a new person from text.
                            </span>
                          </span>
                          <IconArrowRight className="mb-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSourceKind("image")}
                        className="group flex min-h-44 flex-col rounded-xl border bg-muted/20 p-5 text-left outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/35 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
                      >
                        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                          <IconPhotoUp className="size-5" />
                        </span>
                        <span className="mt-auto flex items-end justify-between gap-4 pt-7">
                          <span>
                            <span className="block text-base font-semibold">From photos</span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                              Use 1–6 photos of an existing person.
                            </span>
                          </span>
                          <IconArrowRight className="mb-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div>
                      <button
                        type="button"
                        onClick={() => setSourceKind(null)}
                        className="mb-5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <IconArrowLeft className="size-3.5" /> Change starting point
                      </button>
                      <h3 className="text-2xl font-semibold tracking-tight">
                        {sourceKind === "prompt"
                          ? "Describe the person"
                          : "Choose clear references"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {sourceKind === "prompt"
                          ? "Focus on stable physical traits. Pose, scene, and camera direction belong in the video step."
                          : "A front-facing portrait plus another angle or full-body photo gives Seedream the strongest identity signal."}
                      </p>

                      {sourceKind === "image" ? (
                        <div className="mt-6">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={(event) => {
                              chooseFiles(event.target.files)
                              event.currentTarget.value = ""
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault()
                              chooseFiles(event.dataTransfer.files)
                            }}
                            className={cn(
                              "flex min-h-72 w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 text-center transition-colors hover:border-ring hover:bg-accent/25",
                              sourceImages.length
                                ? "border-solid border-primary/40 p-3"
                                : "px-6"
                            )}
                          >
                            {sourceImages.length ? (
                              <>
                                <span
                                  className={cn(
                                    "grid w-full gap-2",
                                    sourceImages.length === 1
                                      ? "grid-cols-1"
                                      : "grid-cols-2 sm:grid-cols-3"
                                  )}
                                >
                                  {sourceImages.map(({ previewUrl }, index) => (
                                    <span
                                      key={previewUrl}
                                      className="relative overflow-hidden rounded-xl border bg-muted/50"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={previewUrl}
                                        alt={`Selected reference ${index + 1}`}
                                        className={cn(
                                          "w-full object-contain",
                                          sourceImages.length === 1
                                            ? "h-56"
                                            : "aspect-square h-auto"
                                        )}
                                      />
                                    </span>
                                  ))}
                                </span>
                                <span className="mt-3 text-sm font-semibold">
                                  {sourceImages.length} photo
                                  {sourceImages.length === 1 ? "" : "s"} selected
                                </span>
                                <span className="mt-1 text-xs text-muted-foreground">
                                  Click or drop to replace
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="grid size-12 place-items-center rounded-xl border bg-background shadow-sm">
                                  <IconPhotoUp className="size-5" />
                                </span>
                                <span className="mt-4 text-sm font-semibold">
                                  Drop photos here or choose files
                                </span>
                                <span className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                                  JPG, PNG, or WebP · up to six images and 15 MB each
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <Textarea
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          placeholder="A woman in her late twenties with warm olive skin, shoulder-length dark curls, expressive brown eyes, a soft angular jaw, and an athletic build…"
                          className="mt-6 min-h-72 resize-none p-5 text-base leading-7"
                          maxLength={800}
                        />
                      )}
                    </div>

                    <aside className="h-fit rounded-2xl border bg-muted/20 p-5">
                      <div className="space-y-5">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium">Character name</span>
                          <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Maya"
                            maxLength={48}
                          />
                        </label>
                        {sourceKind === "image" ? (
                          <label className="block space-y-2">
                            <span className="text-sm font-medium">
                              Direction <span className="font-normal text-muted-foreground">(optional)</span>
                            </span>
                            <Textarea
                              value={description}
                              onChange={(event) => setDescription(event.target.value)}
                              placeholder="Keep the curls and freckles; use a simple black T-shirt…"
                              className="min-h-28 resize-none"
                              maxLength={500}
                            />
                          </label>
                        ) : null}
                        <div className="rounded-xl border bg-background p-4 text-xs leading-5 text-muted-foreground">
                          Seedream first creates one clean, front-facing hero. Nothing is saved as a finished character until you approve it.
                        </div>
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={() => void startBuilder()}
                          disabled={
                            working ||
                            !name.trim() ||
                            (sourceKind === "prompt"
                              ? !description.trim()
                              : sourceImages.length === 0)
                          }
                        >
                          {working ? (
                            <IconLoader2 className="size-4 animate-spin" />
                          ) : (
                            <IconSparkles className="size-4" />
                          )}
                          {working ? "Generating hero…" : "Generate hero"}
                          {!working ? (
                            <span className="ml-1 flex items-center gap-1 text-xs opacity-80">
                              <IconBolt className="size-3.5" fill="currentColor" stroke={1.5} />
                              10
                            </span>
                          ) : null}
                        </Button>
                      </div>
                    </aside>
                  </div>
                )}
              </div>
            ) : heroSelected ? (
              <div className="grid min-h-[560px] gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
                <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/25 p-4">
                  <div className="relative overflow-hidden rounded-xl bg-muted">
                    {draft.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={draft.primaryImageUrl} alt="Approved hero" className="size-full object-cover" />
                    ) : null}
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                      Frontal hero
                    </span>
                  </div>
                  {["Three-quarter", "Full body"].map((label) => (
                    <div key={label} className="relative grid min-h-96 place-items-center overflow-hidden rounded-xl border border-dashed bg-background/60">
                      <div className="text-center text-muted-foreground">
                        <IconLoader2 className="mx-auto size-5 animate-spin" />
                        <p className="mt-2 text-xs">Generating {label.toLowerCase()}</p>
                      </div>
                      <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2 py-1 text-[10px] font-medium backdrop-blur">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <aside className="flex flex-col justify-center rounded-2xl border bg-muted/20 p-6">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Final step
                  </span>
                  <h3 className="mt-3 text-2xl font-semibold">Building the identity pack</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The approved face is locked. Seedream is deriving a three-quarter and full-body reference for Kling.
                  </p>
                  {draft.generationError ? (
                    <div className="mt-5 space-y-3">
                      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">
                        {draft.generationError}
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => void retryReferencePack()}
                        disabled={working || Boolean(draft.generationStage)}
                      >
                        {working ? <IconLoader2 className="size-4 animate-spin" /> : <IconRefresh className="size-4" />}
                        Retry reference pack
                      </Button>
                    </div>
                  ) : null}
                  <div className="mt-6 space-y-3 text-xs text-muted-foreground">
                    {["Facial geometry locked", "Lighting normalized", "Body proportions established"].map((item, index) => (
                      <div key={item} className="flex items-center gap-2">
                        {index === 0 ? <IconCheck className="size-4 text-primary" /> : <IconLoader2 className="size-4 animate-spin" />}
                        {item}
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            ) : (
              <div className="grid min-h-[560px] gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-8">
                <div className="flex min-h-96 items-center justify-center overflow-hidden rounded-2xl bg-muted/30">
                  {selectedHero?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedHero.url}
                      alt="Generated hero candidate"
                      className="h-full max-h-[660px] w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <IconLoader2 className="mx-auto size-6 animate-spin" />
                      <p className="mt-3 text-sm">Seedream is creating the hero…</p>
                    </div>
                  )}
                </div>
                <aside className="flex min-h-0 flex-col rounded-2xl border bg-muted/20 p-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Identity lock
                  </span>
                  <h3 className="mt-3 text-2xl font-semibold">Approve the hero</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This face becomes the primary reference for every Kling video. Check the eyes, hair, age, and overall likeness carefully.
                  </p>

                  {heroCandidates.length > 1 ? (
                    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                      {heroCandidates.map((candidate) => (
                        <button
                          key={candidate.key}
                          type="button"
                          onClick={() => setSelectedHeroKey(candidate.key)}
                          className={cn(
                            "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg border bg-muted",
                            candidate.key === effectiveSelectedHeroKey && "border-primary ring-2 ring-primary/25"
                          )}
                        >
                          {candidate.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={candidate.url} alt="" className="size-full object-cover" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {draft.generationError ? (
                    <p className="mt-5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {draft.generationError}
                    </p>
                  ) : null}

                  <div className="mt-auto space-y-3 pt-6">
                    <Input
                      value={adjustment}
                      onChange={(event) => setAdjustment(event.target.value)}
                      placeholder="Optional: what should change?"
                      maxLength={240}
                      disabled={working || Boolean(draft.generationStage)}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => void retryHero(draft._id)}
                      disabled={working || Boolean(draft.generationStage)}
                    >
                      {working || draft.generationStage === "hero" ? (
                        <IconLoader2 className="size-4 animate-spin" />
                      ) : (
                        <IconRefresh className="size-4" />
                      )}
                      {heroCandidates.length ? "Try another" : "Generate hero"}
                      {!(working || draft.generationStage === "hero") ? (
                        <span className="ml-1 flex items-center gap-1 text-xs opacity-80">
                          <IconBolt className="size-3.5" fill="currentColor" stroke={1.5} />
                          10
                        </span>
                      ) : null}
                    </Button>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => void approveAndBuildReferences()}
                      disabled={!effectiveSelectedHeroKey || working || Boolean(draft.generationStage)}
                    >
                      {working ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                      {working ? "Building references…" : "Approve & build references"}
                      {!working ? (
                        <span className="ml-1 flex items-center gap-1 text-xs opacity-80">
                          <IconBolt className="size-3.5" fill="currentColor" stroke={1.5} />
                          20
                        </span>
                      ) : null}
                    </Button>
                    <button
                      type="button"
                      onClick={() => void startOver()}
                      disabled={working || Boolean(draft.generationStage)}
                      className="w-full py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      Discard draft and start over
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </section>
        ) : null}

        {!showBuilder ? (
          <section className="animate-in duration-200 fade-in motion-reduce:animate-none">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Your characters</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Approved identity packs ready for video cloning.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {characters?.length ?? 0} total
              </span>
            </div>
            {characters === undefined ? (
              <div className="grid min-h-72 place-items-center rounded-2xl border bg-card">
                <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : characters.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {characters.map((character) => (
                  <article key={character._id} className="group overflow-hidden rounded-2xl border bg-card">
                    <div className="relative aspect-[4/5] bg-muted">
                      {character.primaryImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={character.primaryImageUrl} alt={character.name} className="size-full object-cover" />
                      ) : null}
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                        <IconCheck className="size-3 text-primary" stroke={3} /> Kling ready
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`Delete ${character.name}? Existing clones will remain in your library.`)) return
                          await removeCharacter({ id: character._id })
                          toast.success("Character deleted")
                        }}
                        className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg bg-black/55 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus:opacity-100"
                        aria-label={`Delete ${character.name}`}
                      >
                        <IconTrash className="size-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{character.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {character.sourcePrompt ?? character.identityPrompt ?? "Approved reusable identity"}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <IconPhoto className="size-3.5" />
                        {character.referenceImageKeys.length + 1} approved references
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid min-h-96 place-items-center rounded-2xl border border-dashed bg-card/60 p-8 text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <IconPlus className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">Build your first character</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Start with a description or reference photos. Seedream will create and normalize the identity images Kling needs.
                  </p>
                  <Button
                    className="mt-5"
                    onClick={() => {
                      resetLocalBuilder()
                      setBuilderOpen(true)
                    }}
                  >
                    <IconPlus className="size-4" /> New character
                  </Button>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  )
}
