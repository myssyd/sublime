"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Dialog } from "@base-ui/react/dialog"
import { usePaginatedQuery, useQuery } from "convex/react"
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconLoader2,
  IconMovie,
  IconPhoto,
  IconPlayerPlayFilled,
  IconUsers,
  IconX,
} from "@tabler/icons-react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { StudioHeader } from "@/components/studio-header"
import { StudioEmptyState } from "@/components/studio-empty-state"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type MediaFilter = "all" | "photos" | "videos"
type CharacterFilter = "all" | Id<"characters">

type PhotoItem = {
  kind: "photo"
  _id: Id<"images">
  key: string
  url: string
  prompt: string
  model: "seedream-5" | "nano-banana" | null
  aspectRatio:
    | "21:9"
    | "16:9"
    | "3:2"
    | "4:3"
    | "5:4"
    | "1:1"
    | "4:5"
    | "3:4"
    | "2:3"
    | "9:16"
    | null
  createdAt: number
  characterId: Id<"characters">
  characterName: string
  characterImageUrl: string | null
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function formatDate(timestamp: number) {
  return dateFormatter.format(new Date(timestamp))
}

function modelLabel(model: PhotoItem["model"]) {
  if (model === "seedream-5") return "Seedream 5"
  if (model === "nano-banana") return "Nano Banana"
  return "Generated photo"
}

export default function LibraryPage() {
  const searchParams = useSearchParams()
  const characters = useQuery(api.characters.list)
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all")
  const [selectedCharacterFilter, setSelectedCharacterFilter] =
    useState<CharacterFilter | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null)
  const requestedCharacterId = searchParams.get("character")
  const requestedCharacter = characters?.find(
    (character) => character._id === requestedCharacterId
  )
  const characterFilter: CharacterFilter =
    selectedCharacterFilter ?? requestedCharacter?._id ?? "all"
  const {
    results: videos,
    status: videoStatus,
    loadMore: loadMoreVideos,
  } = usePaginatedQuery(
    api.videos.listPage,
    {
      characterId:
        characterFilter === "all" ? undefined : characterFilter,
    },
    { initialNumItems: 24 }
  )
  const {
    results: imageResults,
    status: imageStatus,
    loadMore: loadMoreImages,
  } = usePaginatedQuery(
    api.images.listPage,
    {
      characterId:
        characterFilter === "all" ? undefined : characterFilter,
    },
    { initialNumItems: 24 }
  )
  const photos = useMemo<PhotoItem[]>(
    () =>
      imageResults.map((image) => ({
        kind: "photo" as const,
        ...image,
      })),
    [imageResults]
  )

  const items = useMemo(() => {
    if (mediaFilter === "photos") return photos
    const videoItems = videos.map((video) => ({
      kind: "video" as const,
      ...video,
    }))
    if (mediaFilter === "videos") return videoItems
    return [...photos, ...videoItems].sort(
      (a, b) => b.createdAt - a.createdAt
    )
  }, [mediaFilter, photos, videos])

  const videosHaveMore =
    videoStatus === "CanLoadMore" || videoStatus === "LoadingMore"
  const imagesHaveMore =
    imageStatus === "CanLoadMore" || imageStatus === "LoadingMore"
  const hasMore =
    mediaFilter === "photos"
      ? imagesHaveMore
      : mediaFilter === "videos"
        ? videosHaveMore
        : imagesHaveMore || videosHaveMore
  const loadingMore =
    (mediaFilter !== "videos" && imageStatus === "LoadingMore") ||
    (mediaFilter !== "photos" && videoStatus === "LoadingMore")
  const initialLoading =
    characters === undefined ||
    videoStatus === "LoadingFirstPage" ||
    imageStatus === "LoadingFirstPage"
  const hasAnyContent =
    (characters ?? []).some(
      (character) =>
        character.imageCount > 0 || character.videoCount > 0
    ) ||
    (characterFilter === "all" && (photos.length > 0 || videos.length > 0))
  const selectedCharacter =
    characterFilter === "all"
      ? null
      : characters?.find((character) => character._id === characterFilter)
  const emptyLabel = selectedCharacter
    ? `${selectedCharacter.name} has no ${mediaFilter === "all" ? "content" : mediaFilter} yet`
    : `No ${mediaFilter === "all" ? "content" : mediaFilter} yet`

  return (
    <div className="min-h-screen">
      <StudioHeader
        title="Library"
        description="Every photo and video created with your characters, ready to revisit or download."
        action={
          <Link
            href="/create"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
            Create new <IconArrowRight className="size-4" />
          </Link>
        }
      />

      <div className="mx-auto max-w-[1500px] px-5 pb-10 md:px-8 lg:px-10">
        {!initialLoading && hasAnyContent ? (
        <section className="border-b py-4 md:py-5">
          <div className="flex items-center gap-2">
            <div
              className="grid min-w-0 flex-1 grid-cols-3 gap-1 rounded-full bg-muted p-1 sm:flex sm:flex-none"
              role="group"
              aria-label="Filter by media type"
            >
              {(
                [
                  ["all", "All", photos.length + videos.length],
                  ["photos", "Photos", photos.length],
                  ["videos", "Videos", videos.length],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mediaFilter === value}
                  onClick={() => setMediaFilter(value)}
                  className={cn(
                    "inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium text-muted-foreground transition-colors sm:gap-2 sm:px-3",
                    mediaFilter === value &&
                      "bg-background text-foreground shadow-sm"
                  )}
                >
                  {label}
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {count}
                    {(value === "photos"
                      ? imagesHaveMore
                      : value === "videos"
                        ? videosHaveMore
                        : imagesHaveMore || videosHaveMore)
                      ? "+"
                      : ""}
                  </span>
                </button>
              ))}
            </div>

            <Select<CharacterFilter>
              value={characterFilter}
              onValueChange={(value) => {
                if (value) setSelectedCharacterFilter(value as CharacterFilter)
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="Filter by character"
                className="w-32 shrink-0 rounded-full text-xs font-medium sm:ml-auto sm:w-44"
              >
                <SelectValue>
                  {(value: CharacterFilter) => {
                    const character =
                      value === "all"
                        ? null
                        : characters?.find((item) => item._id === value)

                    return (
                      <>
                        {character?.primaryImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={character.primaryImageUrl}
                            alt=""
                            className="size-5 rounded-full object-cover"
                          />
                        ) : (
                          <IconUsers className="hidden size-4 text-muted-foreground sm:block" />
                        )}
                        <span className="truncate">
                          {character?.name ?? "All characters"}
                        </span>
                      </>
                    )
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                align="end"
                alignItemWithTrigger={false}
                className="w-56"
              >
                <SelectItem value="all">
                  <IconUsers className="size-4 text-muted-foreground" />
                  <span>All characters</span>
                </SelectItem>
                {characters?.map((character) => (
                  <SelectItem key={character._id} value={character._id}>
                    <span className="size-6 shrink-0 overflow-hidden rounded-full bg-muted">
                      {character.primaryImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={character.primaryImageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="truncate">{character.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>
        ) : null}

        {initialLoading ? (
          <div className="grid min-h-[420px] place-items-center text-muted-foreground">
            <IconLoader2 className="size-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <StudioEmptyState
            icon={mediaFilter === "videos" ? IconMovie : IconPhoto}
            title={emptyLabel}
            description="Create a picture or clone a short performance and it will appear here automatically."
            action={
              <Link href="/create" className={buttonVariants()}>
                Go to Studio <IconArrowRight className="size-4" />
              </Link>
            }
          />
        ) : (
          <>
            <section
              className="grid grid-cols-2 gap-3 py-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              aria-label={`${mediaFilter === "all" ? "All media" : mediaFilter}`}
            >
              {items.map((item) =>
                item.kind === "photo" ? (
                  <article
                    key={`photo-${item._id}`}
                    className="group min-w-0 overflow-hidden rounded-2xl border bg-card"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(item)}
                        className="size-full cursor-zoom-in text-left"
                        aria-label={`Preview ${item.characterName} photo`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={`${item.characterName} generated photo`}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                        />
                      </button>
                      <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                        <IconPhoto className="size-3" /> Photo
                      </span>
                      <a
                        href={item.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Download ${item.characterName} photo`}
                        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/65 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 focus:opacity-100 group-hover:opacity-100"
                      >
                        <IconDownload className="size-4" />
                      </a>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="size-6 shrink-0 overflow-hidden rounded-full bg-muted">
                          {item.characterImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.characterImageUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : null}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">
                            {item.characterName}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {modelLabel(item.model)}
                            {item.aspectRatio ? ` · ${item.aspectRatio}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ) : (
                  <article
                    key={`video-${item._id}`}
                    className="group min-w-0 overflow-hidden rounded-2xl border bg-card"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#171914]">
                      {item.outputVideoUrl ? (
                        <video
                          src={item.outputVideoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          aria-label={`${item.characterName} generated video`}
                          className="size-full object-cover"
                        />
                      ) : item.characterImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.characterImageUrl}
                          alt=""
                          className="size-full object-cover opacity-45"
                        />
                      ) : null}
                      {!item.outputVideoUrl ? (
                        <div className="absolute inset-0 grid place-items-center bg-black/30 text-white">
                          <div className="px-4 text-center">
                            {item.status === "failed" ? (
                              <IconAlertTriangle className="mx-auto size-7 text-red-300" />
                            ) : (
                              <IconLoader2 className="mx-auto size-7 animate-spin" />
                            )}
                            <p className="mt-3 text-xs font-semibold capitalize">
                              {item.status}
                            </p>
                          </div>
                        </div>
                      ) : null}
                      <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-medium capitalize text-white backdrop-blur-sm">
                        {item.status === "completed" ? (
                          <IconCheck className="size-3 text-lime-300" />
                        ) : item.status === "failed" ? (
                          <IconAlertTriangle className="size-3 text-red-300" />
                        ) : (
                          <IconPlayerPlayFilled className="size-3" />
                        )}
                        {item.status}
                      </span>
                      {item.outputVideoUrl ? (
                        <a
                          href={item.outputVideoUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Download ${item.characterName} video`}
                          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/65 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 focus:opacity-100 group-hover:opacity-100"
                        >
                          <IconDownload className="size-4" />
                        </a>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-xs font-semibold">
                        {item.characterName}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {item.videoKind === "lip_sync" ? "Lip Sync" : "Reel Clone"} · {formatDate(item.createdAt)}
                      </p>
                      {item.error ? (
                        <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-destructive">
                          {item.error}
                        </p>
                      ) : null}
                    </div>
                  </article>
                )
              )}
            </section>

            {hasMore ? (
              <div className="flex justify-center pb-8">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (mediaFilter !== "videos" && imagesHaveMore) {
                      loadMoreImages(24)
                    }
                    if (mediaFilter !== "photos" && videosHaveMore) {
                      loadMoreVideos(24)
                    }
                  }}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : null}
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <Dialog.Root
        open={selectedPhoto !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPhoto(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 md:p-8">
            <Dialog.Popup className="relative grid max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-hidden rounded-3xl border bg-background shadow-2xl outline-none md:grid-cols-[minmax(0,1fr)_320px]">
              <Dialog.Close
                aria-label="Close photo preview"
                className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-black/65 text-white backdrop-blur-sm hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white"
              >
                <IconX className="size-4" />
              </Dialog.Close>
              <div className="grid min-h-0 place-items-center bg-black/95">
                {selectedPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPhoto.url}
                    alt={`${selectedPhoto.characterName} generated photo`}
                    className="max-h-[65dvh] w-full object-contain md:max-h-[calc(100dvh-4rem)]"
                  />
                ) : null}
              </div>
              <div className="overflow-y-auto p-5 md:p-6">
                <Dialog.Title className="text-lg font-semibold">
                  {selectedPhoto?.characterName} photo
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                  {selectedPhoto ? formatDate(selectedPhoto.createdAt) : ""}
                </Dialog.Description>
                {selectedPhoto?.prompt ? (
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Creative direction
                    </p>
                    <p className="mt-2 text-sm leading-6">
                      {selectedPhoto.prompt}
                    </p>
                  </div>
                ) : null}
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-muted-foreground">Model</p>
                    <p className="mt-1 font-medium">
                      {modelLabel(selectedPhoto?.model ?? null)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-muted-foreground">Format</p>
                    <p className="mt-1 font-medium">
                      {selectedPhoto?.aspectRatio ?? "Original"}
                    </p>
                  </div>
                </div>
                {selectedPhoto ? (
                  <a
                    href={selectedPhoto.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants(), "mt-6 w-full")}
                  >
                    <IconDownload className="size-4" /> Download photo
                  </a>
                ) : null}
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
