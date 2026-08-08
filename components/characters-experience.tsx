"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconLoader2,
  IconPhotoUp,
  IconPlus,
  IconRefresh,
  IconSparkles,
  IconTextCaption,
  IconUsers,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { StudioHeader } from "@/components/studio-header";
import { StudioEmptyState } from "@/components/studio-empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAssetUpload } from "@/lib/use-asset-upload";
import { track } from "@/lib/posthog";
import { cn } from "@/lib/utils";

type SourceKind = "prompt" | "image";
type WorkingStage = "hero" | "references";
type CompletingCharacter = {
  id: Id<"characters">;
  name: string;
  sourceKind?: SourceKind;
  retry: boolean;
};
type SourceImage = {
  file: File;
  previewUrl: string;
};

const MAX_SOURCE_IMAGES = 6;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type CharactersExperienceProps = {
  standalone?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (characterId: Id<"characters">) => void;
};

export function CharactersExperience({
  standalone = true,
  open: controlledOpen,
  onOpenChange,
  onCreated,
}: CharactersExperienceProps) {
  const characters = useQuery(api.characters.list);
  const draft = useQuery(api.characters.getDraft);
  const createDraft = useMutation(api.characters.createDraft);
  const approveHero = useMutation(api.characters.approveHero);
  const queueHero = useMutation(api.characters.queueHero);
  const queueReferencePack = useMutation(api.characters.queueReferencePack);
  const discardDraft = useMutation(api.characters.discardDraft);
  const uploadAsset = useAssetUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceImagesRef = useRef<SourceImage[]>([]);

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [sourceKind, setSourceKind] = useState<SourceKind | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);
  const [selectedHeroKey, setSelectedHeroKey] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [workingStage, setWorkingStage] = useState<WorkingStage | null>(null);
  const completingCharacterRef = useRef<CompletingCharacter | null>(null);
  const working = workingStage !== null;

  const builderOpen = controlledOpen ?? uncontrolledOpen;

  function setBuilderOpen(open: boolean) {
    setUncontrolledOpen(open);
    onOpenChange?.(open);
  }
  const heroCandidates = useMemo(
    () =>
      (draft?.heroCandidateKeys ?? []).map((key, index) => ({
        key,
        url: draft?.heroCandidateUrls[index] ?? null,
      })),
    [draft],
  );

  const effectiveSelectedHeroKey = (draft?.heroCandidateKeys ?? []).includes(
    selectedHeroKey,
  )
    ? selectedHeroKey
    : (draft?.heroCandidateKeys?.at(-1) ?? "");

  useEffect(
    () => () => {
      sourceImagesRef.current.forEach(({ previewUrl }) =>
        URL.revokeObjectURL(previewUrl),
      );
    },
    [],
  );

  useEffect(() => {
    const completingCharacter = completingCharacterRef.current;
    if (
      !completingCharacter ||
      !characters?.some((character) => character._id === completingCharacter.id)
    ) {
      return;
    }
    track("character_created", {
      source_kind: completingCharacter.sourceKind,
      retry: completingCharacter.retry,
    });
    toast.success(`${completingCharacter.name} is ready`, {
      description: "Seedream created a two-image Kling-ready identity lock.",
    });
    onCreated?.(completingCharacter.id);
    completingCharacterRef.current = null;
  }, [characters, onCreated]);

  function replaceSourceImages(files: File[]) {
    sourceImagesRef.current.forEach(({ previewUrl }) =>
      URL.revokeObjectURL(previewUrl),
    );
    const nextImages = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    sourceImagesRef.current = nextImages;
    setSourceImages(nextImages);
  }

  function clearSourceImages() {
    replaceSourceImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetLocalBuilder() {
    setSourceKind(null);
    setName("");
    setDescription("");
    clearSourceImages();
    setSelectedHeroKey("");
    setAdjustment("");
  }

  function chooseFiles(list: FileList | null) {
    const selected = Array.from(list ?? []).slice(0, MAX_SOURCE_IMAGES);
    if (!selected.length) return;
    const invalid = selected.find(
      (file) =>
        !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES,
    );
    if (invalid) {
      toast.error("Use JPG, PNG, or WebP files smaller than 15 MB");
      return;
    }
    replaceSourceImages(selected);
  }

  async function startBuilder() {
    if (!sourceKind || !name.trim() || working) return;
    if (sourceKind === "prompt" && !description.trim()) return;
    if (sourceKind === "image" && sourceImages.length === 0) return;
    setWorkingStage("hero");
    try {
      const groupId = crypto.randomUUID();
      const sourceImageKeys =
        sourceKind === "image"
          ? await Promise.all(
              sourceImages.map(({ file }) =>
                uploadAsset(file, "character-source", groupId),
              ),
            )
          : [];
      await createDraft({
        name: name.trim(),
        sourceKind,
        sourcePrompt: description.trim() || undefined,
        sourceImageKeys,
      });
      track("generation_requested", {
        kind: "character_hero",
        source_kind: sourceKind,
        source_image_count: sourceImages.length,
        retry: false,
      });
    } catch (error) {
      track("generation_failed", {
        kind: "character_hero",
        retry: false,
      });
      toast.error("Could not generate the hero", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setWorkingStage(null);
    }
  }

  async function retryHero(characterId: Id<"characters">) {
    if (working) return;
    setWorkingStage("hero");
    try {
      track("generation_requested", {
        kind: "character_hero",
        retry: true,
        has_adjustment: Boolean(adjustment.trim()),
      });
      await queueHero({
        id: characterId,
        adjustment: adjustment.trim() || undefined,
      });
      setAdjustment("");
    } catch (error) {
      track("generation_failed", {
        kind: "character_hero",
        retry: true,
      });
      toast.error("Could not generate another hero", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setWorkingStage(null);
    }
  }

  async function approveAndBuildReferences() {
    if (!draft || !effectiveSelectedHeroKey || working) return;
    setWorkingStage("references");
    try {
      await approveHero({ id: draft._id, imageKey: effectiveSelectedHeroKey });
      track("generation_requested", {
        kind: "character_reference_pack",
        retry: false,
      });
      completingCharacterRef.current = {
        id: draft._id,
        name: draft.name,
        sourceKind: draft.sourceKind,
        retry: false,
      };
      setBuilderOpen(false);
      resetLocalBuilder();
    } catch (error) {
      track("generation_failed", {
        kind: "character_reference_pack",
        retry: false,
      });
      toast.error("Could not build the reference pack", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setWorkingStage(null);
    }
  }

  async function retryReferencePack() {
    if (!draft || working) return;
    setWorkingStage("references");
    try {
      track("generation_requested", {
        kind: "character_reference_pack",
        retry: true,
      });
      await queueReferencePack({ id: draft._id });
      completingCharacterRef.current = {
        id: draft._id,
        name: draft.name,
        sourceKind: draft.sourceKind,
        retry: true,
      };
      setBuilderOpen(false);
      resetLocalBuilder();
    } catch (error) {
      track("generation_failed", {
        kind: "character_reference_pack",
        retry: true,
      });
      toast.error("Could not build the reference pack", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setWorkingStage(null);
    }
  }

  async function startOver() {
    if (draft) {
      await discardDraft({ id: draft._id });
    }
    resetLocalBuilder();
    completingCharacterRef.current = null;
    setBuilderOpen(true);
  }

  const heroSelected = Boolean(draft?.primaryImageKey);
  const generatingHero =
    workingStage === "hero" || draft?.generationStage === "hero";
  const buildingReferences =
    workingStage === "references" || draft?.generationStage === "references";
  const referenceGenerationFailed =
    heroSelected && Boolean(draft?.generationError) && !buildingReferences;
  const selectedHero = heroCandidates.find(
    (candidate) => candidate.key === effectiveSelectedHeroKey,
  );
  const showHeaderAction = Boolean(draft) || Boolean(characters?.length);
  const screenKey = draft
    ? heroSelected || buildingReferences
      ? "references"
      : "hero"
    : (sourceKind ?? "source");

  function openBuilder() {
    setBuilderOpen(true);
  }

  return (
    <div className={standalone ? "min-h-screen" : undefined}>
      {standalone ? (
        <StudioHeader
          title="Characters"
          description="Build reusable, Kling-ready identities with Seedream-generated portrait and full-body references."
          action={
            showHeaderAction ? (
              <Button size="sm" onClick={openBuilder}>
                {draft ? (
                  <IconArrowRight className="size-4" />
                ) : (
                  <IconPlus className="size-4" />
                )}
                {draft ? "Continue draft" : "New character"}
              </Button>
            ) : undefined
          }
          mobileAction={
            showHeaderAction ? (
              <Button
                size="icon"
                className="size-12 rounded-full shadow-lg shadow-black/20"
                aria-label={
                  draft ? "Continue character draft" : "New character"
                }
                onClick={openBuilder}
              >
                {draft ? (
                  <IconArrowRight className="size-4" />
                ) : (
                  <IconPlus className="size-4" />
                )}
              </Button>
            ) : undefined
          }
        />
      ) : null}

      <div
        className={
          standalone
            ? "mx-auto max-w-[1440px] px-5 py-7 md:px-8 lg:px-10 lg:py-10"
            : undefined
        }
      >
        <Dialog
          open={builderOpen}
          onOpenChange={(open) => {
            if (!open && draft) toast.message("Your character draft is saved");
            setBuilderOpen(open);
          }}
        >
          <DialogContent className="h-[min(600px,calc(100dvh-2rem))] gap-0 overflow-hidden bg-card p-0 text-card-foreground sm:max-w-5xl">
            <section className="flex h-full min-h-0 flex-col overflow-hidden">
              <div className="shrink-0 border-b bg-card px-5 py-4 pr-12 sm:px-6 sm:pr-14">
                <div>
                  <DialogTitle className="font-semibold">
                    Build a character
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs text-muted-foreground">
                    Seedream 5 Pro creates the identity references used by
                    Kling.
                  </DialogDescription>
                </div>
              </div>

              <div
                key={screenKey}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain duration-200 ease-out animate-in fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none"
              >
                {!draft ? (
                  <div
                    className={cn(
                      "p-5 sm:p-6",
                      !sourceKind && "grid min-h-full place-items-center",
                    )}
                  >
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
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setSourceKind("prompt")}
                            className="group flex min-h-36 flex-col rounded-xl border bg-muted/20 p-4 text-left outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/35 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
                          >
                            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                              <IconTextCaption className="size-5" />
                            </span>
                            <span className="mt-auto flex items-end justify-between gap-4 pt-7">
                              <span>
                                <span className="block text-base font-semibold">
                                  From a description
                                </span>
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
                            className="group flex min-h-36 flex-col rounded-xl border bg-muted/20 p-4 text-left outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/35 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
                          >
                            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                              <IconPhotoUp className="size-5" />
                            </span>
                            <span className="mt-auto flex items-end justify-between gap-4 pt-7">
                              <span>
                                <span className="block text-base font-semibold">
                                  From photos
                                </span>
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
                      <div
                        className={cn(
                          "mx-auto grid gap-6",
                          sourceKind === "prompt"
                            ? "max-w-3xl"
                            : "max-w-5xl lg:grid-cols-[minmax(0,1fr)_320px]",
                        )}
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => setSourceKind(null)}
                            className="mb-5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <IconArrowLeft className="size-3.5" /> Change
                            starting point
                          </button>
                          <h3 className="text-xl font-semibold tracking-tight">
                            {sourceKind === "prompt"
                              ? "Create from a prompt"
                              : "Choose clear references"}
                          </h3>
                          {sourceKind === "image" ? (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              Clear photos give Seedream the strongest identity
                              signal. Add direction if you want a specific body,
                              outfit, or level of modesty.
                            </p>
                          ) : null}

                          {sourceKind === "image" ? (
                            <div className="mt-5">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="hidden"
                                onChange={(event) => {
                                  chooseFiles(event.target.files);
                                  event.currentTarget.value = "";
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  chooseFiles(event.dataTransfer.files);
                                }}
                                className={cn(
                                  "flex min-h-60 w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 text-center transition-colors hover:border-ring hover:bg-accent/25",
                                  sourceImages.length
                                    ? "border-solid border-primary/40 p-3"
                                    : "px-6",
                                )}
                              >
                                {sourceImages.length ? (
                                  <>
                                    <span
                                      className={cn(
                                        "grid w-full gap-2",
                                        sourceImages.length === 1
                                          ? "grid-cols-1"
                                          : "grid-cols-2 sm:grid-cols-3",
                                      )}
                                    >
                                      {sourceImages.map(
                                        ({ previewUrl }, index) => (
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
                                                  : "aspect-square h-auto",
                                              )}
                                            />
                                          </span>
                                        ),
                                      )}
                                    </span>
                                    <span className="mt-3 text-sm font-semibold">
                                      {sourceImages.length} photo
                                      {sourceImages.length === 1
                                        ? ""
                                        : "s"}{" "}
                                      selected
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
                                      JPG, PNG, or WebP · up to six images and
                                      15 MB each
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-5 space-y-4">
                              <label className="block space-y-2">
                                <span className="text-sm font-medium">
                                  Character name
                                </span>
                                <Input
                                  value={name}
                                  onChange={(event) =>
                                    setName(event.target.value)
                                  }
                                  placeholder="Maya"
                                  maxLength={48}
                                />
                              </label>
                              <label className="block space-y-2">
                                <span className="text-sm font-medium">
                                  Prompt
                                </span>
                                <Textarea
                                  value={description}
                                  onChange={(event) =>
                                    setDescription(event.target.value)
                                  }
                                  placeholder="A woman in her late twenties with warm olive skin, shoulder-length dark curls, expressive brown eyes, a soft angular jaw, and an athletic build…"
                                  className="min-h-44 resize-none p-4 text-sm leading-6"
                                  maxLength={800}
                                />
                              </label>
                              <Button
                                size="lg"
                                className="w-full"
                                onClick={() => void startBuilder()}
                                disabled={
                                  working || !name.trim() || !description.trim()
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
                                    <IconBolt
                                      className="size-3.5"
                                      fill="currentColor"
                                      stroke={1.5}
                                    />
                                    10
                                  </span>
                                ) : null}
                              </Button>
                            </div>
                          )}
                        </div>

                        {sourceKind === "image" ? (
                          <aside className="h-fit rounded-2xl border bg-muted/20 p-5">
                            <div className="space-y-4">
                              <label className="block space-y-2">
                                <span className="text-sm font-medium">
                                  Character name
                                </span>
                                <Input
                                  value={name}
                                  onChange={(event) =>
                                    setName(event.target.value)
                                  }
                                  placeholder="Maya"
                                  maxLength={48}
                                />
                              </label>
                              <label className="block space-y-2">
                                <span className="text-sm font-medium">
                                  Direction{" "}
                                  <span className="font-normal text-muted-foreground">
                                    (optional)
                                  </span>
                                </span>
                                <Textarea
                                  value={description}
                                  onChange={(event) =>
                                    setDescription(event.target.value)
                                  }
                                  placeholder="Keep the curls and freckles; use an athletic build and a fitted black evening look…"
                                  className="min-h-28 resize-none"
                                  maxLength={500}
                                />
                              </label>
                              <Button
                                size="lg"
                                className="w-full"
                                onClick={() => void startBuilder()}
                                disabled={
                                  working ||
                                  !name.trim() ||
                                  sourceImages.length === 0
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
                                    <IconBolt
                                      className="size-3.5"
                                      fill="currentColor"
                                      stroke={1.5}
                                    />
                                    10
                                  </span>
                                ) : null}
                              </Button>
                            </div>
                          </aside>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : heroSelected || buildingReferences ? (
                  <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/25 p-4">
                      <div className="relative overflow-hidden rounded-xl bg-muted">
                        {draft.primaryImageUrl || selectedHero?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              draft.primaryImageUrl ??
                              selectedHero?.url ??
                              undefined
                            }
                            alt="Approved hero"
                            className="size-full object-cover"
                          />
                        ) : null}
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                          Frontal hero
                        </span>
                      </div>
                      <div className="relative grid min-h-80 place-items-center overflow-hidden rounded-xl border border-dashed bg-background/60">
                        <div className="text-center text-muted-foreground">
                          {referenceGenerationFailed ? (
                            <IconAlertCircle className="mx-auto size-5 text-destructive" />
                          ) : (
                            <IconLoader2 className="mx-auto size-5 animate-spin" />
                          )}
                          <p className="mt-2 text-xs">
                            {referenceGenerationFailed
                              ? "Full body wasn’t created"
                              : "Generating full body"}
                          </p>
                        </div>
                        <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2 py-1 text-[10px] font-medium backdrop-blur">
                          Full body
                        </span>
                      </div>
                    </div>
                    <aside className="flex flex-col justify-center rounded-2xl border bg-muted/20 p-6">
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-[0.18em]",
                          referenceGenerationFailed
                            ? "text-destructive"
                            : "text-primary",
                        )}
                      >
                        {referenceGenerationFailed
                          ? "Needs attention"
                          : "Final step"}
                      </span>
                      <h3 className="mt-3 text-xl font-semibold">
                        {referenceGenerationFailed
                          ? "The full body needs another try"
                          : "Building the identity pack"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {referenceGenerationFailed
                          ? "Your approved hero is safe. Retry to finish the identity pack without starting over."
                          : "The approved face is locked. Seedream is deriving one polished full-body reference for Kling."}
                      </p>
                      {referenceGenerationFailed ? (
                        <div className="mt-5 space-y-3">
                          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">
                            {draft.generationError}
                          </p>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => void retryReferencePack()}
                            disabled={buildingReferences}
                          >
                            <IconRefresh className="size-4" />
                            Retry full body
                          </Button>
                        </div>
                      ) : null}
                      <div
                        className="mt-6 space-y-3 text-xs text-muted-foreground"
                        aria-live="polite"
                      >
                        <div className="flex items-center gap-2">
                          <IconCheck className="size-4 text-primary" />
                          Hero approved and locked
                        </div>
                        <div className="flex items-center gap-2">
                          {referenceGenerationFailed ? (
                            <IconAlertCircle className="size-4 text-destructive" />
                          ) : (
                            <IconLoader2 className="size-4 animate-spin" />
                          )}
                          {referenceGenerationFailed
                            ? "Full-body generation interrupted"
                            : "Creating the full-body reference"}
                        </div>
                      </div>
                    </aside>
                  </div>
                ) : (
                  <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="flex min-h-80 items-center justify-center overflow-hidden rounded-2xl bg-muted/30">
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
                          <p className="mt-3 text-sm">
                            Seedream is creating the hero…
                          </p>
                          <p className="mt-1 text-xs">
                            Draft saved. You can leave and return anytime.
                          </p>
                        </div>
                      )}
                    </div>
                    <aside className="flex min-h-0 flex-col rounded-2xl border bg-muted/20 p-5">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Identity lock
                      </span>
                      <h3 className="mt-3 text-xl font-semibold">
                        Approve the hero
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        This face becomes the primary reference for every Kling
                        video. Check the eyes, hair, age, and overall likeness
                        carefully.
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
                                candidate.key === effectiveSelectedHeroKey &&
                                  "border-primary ring-2 ring-primary/25",
                              )}
                            >
                              {candidate.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={candidate.url}
                                  alt=""
                                  className="size-full object-cover"
                                />
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
                          onChange={(event) =>
                            setAdjustment(event.target.value)
                          }
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
                          {generatingHero ? (
                            <IconLoader2 className="size-4 animate-spin" />
                          ) : (
                            <IconRefresh className="size-4" />
                          )}
                          {heroCandidates.length
                            ? "Try another"
                            : "Generate hero"}
                          {!generatingHero ? (
                            <span className="ml-1 flex items-center gap-1 text-xs opacity-80">
                              <IconBolt
                                className="size-3.5"
                                fill="currentColor"
                                stroke={1.5}
                              />
                              10
                            </span>
                          ) : null}
                        </Button>
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={() => void approveAndBuildReferences()}
                          disabled={
                            !effectiveSelectedHeroKey ||
                            working ||
                            Boolean(draft.generationStage)
                          }
                        >
                          <IconCheck className="size-4" />
                          Approve & build full body
                          <span className="ml-1 flex items-center gap-1 text-xs opacity-80">
                            <IconBolt
                              className="size-3.5"
                              fill="currentColor"
                              stroke={1.5}
                            />
                            10
                          </span>
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
              </div>
            </section>
          </DialogContent>
        </Dialog>

        {standalone ? (
          <section className="animate-in duration-200 fade-in motion-reduce:animate-none">
            {characters === undefined ? (
              <div
                role="status"
                aria-label="Loading characters"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    aria-hidden="true"
                    className="relative aspect-[4/5] overflow-hidden rounded-2xl border bg-muted animate-pulse motion-reduce:animate-none"
                  >
                    <div className="absolute inset-x-4 bottom-4 h-5 w-24 rounded-md bg-muted-foreground/15" />
                  </div>
                ))}
                <span className="sr-only">Loading characters…</span>
              </div>
            ) : characters.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {characters.map((character) => (
                  <article
                    key={character._id}
                    className="group relative overflow-hidden rounded-2xl border bg-muted transition-colors duration-200 hover:border-primary/35"
                  >
                    <Link
                      href={`/characters/${character._id}`}
                      aria-label={`View ${character.name}`}
                      className="block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                        {character.primaryImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={character.primaryImageUrl}
                            alt={character.name}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.015] motion-reduce:transform-none"
                          />
                        ) : null}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                        <h3 className="absolute inset-x-4 bottom-4 truncate text-base font-semibold text-white drop-shadow-sm">
                          {character.name}
                        </h3>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <StudioEmptyState
                className="-mt-7 lg:-mt-10"
                icon={IconUsers}
                title="Build your first character"
                description="Start with a description or reference photos. Seedream will create and normalize the identity images Kling needs."
                action={
                  <Button
                    onClick={() => {
                      resetLocalBuilder();
                      setBuilderOpen(true);
                    }}
                  >
                    <IconPlus className="size-4" /> New character
                  </Button>
                }
              />
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
