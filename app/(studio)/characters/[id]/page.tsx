"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconLoader2,
  IconMovie,
  IconPhoto,
  IconSparkles,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import { CharacterActionsMenu } from "@/components/character-actions-menu"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function videoStatusLabel(status: "queued" | "processing" | "completed" | "failed") {
  if (status === "queued") return "Queued"
  if (status === "processing") return "Generating"
  if (status === "failed") return "Failed"
  return "Video"
}

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const character = useQuery(api.characters.getById, { id })
  const videos = useQuery(api.videos.listForCharacter, { characterId: id })
  const removeCharacter = useMutation(api.characters.remove)

  const identityImages = useMemo(() => {
    if (!character) return []
    return [
      {
        key: character.primaryImageKey,
        url: character.primaryImageUrl,
        label: "Frontal hero",
      },
      ...character.referenceImageKeys.map((key, index) => ({
        key,
        url: character.referenceImageUrls[index] ?? null,
        label:
          character.referenceImageKeys.length === 1
            ? "Full body"
            : index === 0
            ? "Three-quarter"
            : index === 1
              ? "Full body"
              : `Reference ${index + 1}`,
      })),
    ]
  }, [character])

  const recentCreations = useMemo(() => {
    const photos = (character?.creationImages ?? []).map((photo) => ({
      kind: "photo" as const,
      ...photo,
    }))
    const videoItems = (videos ?? []).map((video) => ({
      kind: "video" as const,
      ...video,
    }))
    return [...photos, ...videoItems]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8)
  }, [character, videos])

  if (character === undefined || videos === undefined) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        <IconLoader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (character === null) {
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center">
        <div className="max-w-sm">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <IconPhoto className="size-6" />
          </span>
          <h1 className="mt-4 text-xl font-semibold">Character not found</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This character may have been deleted or belongs to another account.
          </p>
          <Link href="/characters" className={cn(buttonVariants(), "mt-5")}>
            <IconArrowLeft className="size-4" /> Back to characters
          </Link>
        </div>
      </div>
    )
  }

  const photoCount = character.creationImages.length
  const totalCreationCount = photoCount + character.videoCount
  const description =
    character.sourcePrompt ??
    "A reusable identity pack built to keep this character consistent across every creation."

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1500px] px-5 pb-12 pt-5 md:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/characters"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconArrowLeft className="size-4" /> Characters
          </Link>
          <div className="flex items-center gap-2">
            <CharacterActionsMenu
              characterName={character.name}
              onDelete={async () => {
                if (!window.confirm(`Delete ${character.name}? Existing clones will remain in your library.`)) return
                await removeCharacter({ id: character._id })
                toast.success("Character deleted")
                router.replace("/characters")
              }}
            />
            <Link
              href={`/create?character=${character._id}`}
              className={buttonVariants({ size: "sm" })}
            >
              <IconSparkles className="size-4" /> Create with {character.name}
            </Link>
          </div>
        </div>

        <section className="mt-6 grid items-stretch gap-6 lg:grid-cols-[minmax(300px,430px)_minmax(0,1fr)]">
          <div className="relative min-h-[420px] overflow-hidden rounded-3xl border bg-muted shadow-[0_28px_80px_-48px_rgba(0,0,0,0.7)] lg:min-h-[600px]">
            {character.primaryImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={character.primaryImageUrl}
                alt={character.name}
                className="size-full object-cover"
              />
            ) : null}
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
              <IconCheck className="size-3 text-primary" stroke={3} /> Kling ready
            </span>
          </div>

          <div className="flex flex-col rounded-3xl border bg-card p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Character profile
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              {character.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-muted/55 p-4">
                <IconPhoto className="size-4 text-muted-foreground" />
                <p className="mt-3 text-2xl font-semibold tabular-nums">{photoCount}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Created photos</p>
              </div>
              <div className="rounded-2xl bg-muted/55 p-4">
                <IconMovie className="size-4 text-muted-foreground" />
                <p className="mt-3 text-2xl font-semibold tabular-nums">{character.videoCount}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Created videos</p>
              </div>
              <div className="rounded-2xl bg-muted/55 p-4">
                <IconCalendar className="size-4 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">{dateFormatter.format(new Date(character.createdAt))}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">Character created</p>
              </div>
            </div>

            <div className="mt-auto pt-10">
              <p className="text-xs leading-5 text-muted-foreground">
                Built from {character.sourceKind === "image" ? "reference photos" : "a description"} · {identityImages.length} approved identity references
              </p>
              <Link
                href={`/create?character=${character._id}`}
                className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full sm:w-auto")}
              >
                <IconSparkles className="size-4" /> Create something new
                <IconArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Identity system</p>
            <h2 className="mt-1 text-xl font-semibold">Approved reference pack</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These views keep facial features and body proportions consistent during generation.
            </p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {identityImages.map((image) => (
              <figure key={image.key} className="overflow-hidden rounded-2xl border bg-card">
                <div className="aspect-[4/5] bg-muted">
                  {image.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.url} alt={`${character.name} ${image.label.toLowerCase()} reference`} className="size-full object-cover" />
                  ) : null}
                </div>
                <figcaption className="flex items-center gap-2 p-3 text-xs font-medium">
                  <IconCheck className="size-3.5 text-primary" stroke={2.5} /> {image.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Character output</p>
              <h2 className="mt-1 text-xl font-semibold">Recent creations</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {totalCreationCount
                  ? `${totalCreationCount} creation${totalCreationCount === 1 ? "" : "s"} made with ${character.name}.`
                  : `Nothing has been created with ${character.name} yet.`}
              </p>
            </div>
            {totalCreationCount ? (
              <Link href={`/library?character=${character._id}`} className="hidden items-center gap-1.5 text-sm font-medium sm:inline-flex">
                View all <IconArrowRight className="size-4" />
              </Link>
            ) : null}
          </div>

          {recentCreations.length ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {recentCreations.map((item) => (
                <Link
                  href={`/library?character=${character._id}`}
                  key={`${item.kind}-${item.kind === "photo" ? item.key : item._id}`}
                  className="group overflow-hidden rounded-2xl border bg-card outline-none transition-colors hover:border-primary/35 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    {item.kind === "photo" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.prompt || `${character.name} generated photo`} className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none" />
                    ) : item.outputVideoUrl ? (
                      <video src={item.outputVideoUrl} muted playsInline preload="metadata" className="size-full object-cover" />
                    ) : character.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={character.primaryImageUrl} alt="" className="size-full object-cover opacity-60" />
                    ) : null}
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                      {item.kind === "photo" ? <IconPhoto className="size-3" /> : <IconMovie className="size-3" />}
                      {item.kind === "photo" ? "Photo" : videoStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-medium">
                      {item.kind === "photo"
                        ? item.prompt || "Generated photo"
                        : item.prompt || "Video clone"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {dateFormatter.format(new Date(item.createdAt))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid min-h-64 place-items-center rounded-2xl border border-dashed bg-card/55 px-6 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <IconSparkles className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">Create {character.name}&apos;s first scene</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  Generate a picture or clone a short performance with this identity.
                </p>
                <Link href={`/create?character=${character._id}`} className={cn(buttonVariants(), "mt-4")}>
                  Create now <IconArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
