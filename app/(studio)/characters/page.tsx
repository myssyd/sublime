"use client"

import { useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useUploadFile } from "@convex-dev/r2/react"
import {
  IconCheck,
  IconPhotoPlus,
  IconRobot,
  IconSparkles,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import { StudioHeader } from "@/components/studio-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function CharactersPage() {
  const characters = useQuery(api.characters.list)
  const createCharacter = useMutation(api.characters.create)
  const removeCharacter = useMutation(api.characters.remove)
  const uploadFile = useUploadFile(api.assets)
  const primaryInput = useRef<HTMLInputElement>(null)
  const referencesInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [identityPrompt, setIdentityPrompt] = useState("")
  const [primary, setPrimary] = useState<File | null>(null)
  const [references, setReferences] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !identityPrompt.trim() || !primary) return
    setSaving(true)
    try {
      const [primaryImageKey, ...referenceImageKeys] = await Promise.all([
        uploadFile(primary),
        ...references.map((file) => uploadFile(file)),
      ])
      await createCharacter({ name, identityPrompt, primaryImageKey, referenceImageKeys })
      setName("")
      setIdentityPrompt("")
      setPrimary(null)
      setReferences([])
      if (primaryInput.current) primaryInput.current.value = ""
      if (referencesInput.current) referencesInput.current.value = ""
      toast.success("AI character created")
    } catch (error) {
      toast.error("Could not create character", {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <StudioHeader
        eyebrow="Identity system"
        title="Characters"
        description="Create reusable AI identities from a strong frontal portrait and supporting angles. Every character is explicitly marked as synthetic."
      />
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-7 md:px-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:px-10 lg:py-10">
        <section className="h-fit rounded-2xl border bg-card p-5 shadow-[0_16px_50px_-35px_rgba(0,0,0,0.35)] sm:p-6 lg:sticky lg:top-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground"><IconSparkles className="size-5" /></span>
            <div><h2 className="font-semibold">New AI character</h2><p className="text-xs text-muted-foreground">Use consistent, unfiltered references</p></div>
          </div>
          <div className="mt-6 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Character name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Lena" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Identity description</span>
              <Textarea
                value={identityPrompt}
                onChange={(event) => setIdentityPrompt(event.target.value)}
                placeholder="Distinctive facial features, hair, body proportions, age range, signature styling…"
                className="min-h-28"
              />
              <span className="block text-xs leading-5 text-muted-foreground">Describe stable identity traits, not the pose or background.</span>
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-sm font-medium">Frontal portrait</span><span className="text-xs text-muted-foreground">Required</span></div>
              <input ref={primaryInput} type="file" accept="image/*" className="hidden" onChange={(event) => setPrimary(event.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => primaryInput.current?.click()} className="flex w-full items-center gap-3 rounded-xl border border-dashed bg-muted/25 p-3 text-left hover:border-ring">
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-card shadow-sm">
                  {primary ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(primary)} alt="" className="size-full object-cover" />
                  ) : <IconPhotoPlus className="size-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0"><p className="truncate text-sm font-medium">{primary?.name ?? "Choose a clear portrait"}</p><p className="mt-1 text-xs text-muted-foreground">Face forward, neutral expression</p></div>
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-sm font-medium">Supporting references</span><span className="text-xs text-muted-foreground">Up to 7</span></div>
              <input ref={referencesInput} type="file" accept="image/*" multiple className="hidden" onChange={(event) => setReferences(Array.from(event.target.files ?? []).slice(0, 7))} />
              <button type="button" onClick={() => referencesInput.current?.click()} className="flex h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/25 text-sm font-medium hover:border-ring">
                <IconUpload className="size-4" /> {references.length ? `${references.length} reference${references.length === 1 ? "" : "s"} selected` : "Add angles or full-body images"}
              </button>
            </div>
            <Button className="w-full" size="lg" onClick={handleCreate} disabled={!name.trim() || !identityPrompt.trim() || !primary || saving}>
              {saving ? <IconSparkles className="size-4 animate-pulse" /> : <IconRobot className="size-4" />}
              {saving ? "Creating character…" : "Create AI character"}
            </Button>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">Your characters</h2><span className="text-xs text-muted-foreground">{characters?.length ?? 0} total</span></div>
          {characters?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {characters.map((character) => (
                <article key={character._id} className="group overflow-hidden rounded-2xl border bg-card">
                  <div className="relative aspect-[4/5] bg-muted">
                    {character.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={character.primaryImageUrl} alt={character.name} className="size-full object-cover" />
                    ) : null}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                      <IconCheck className="size-3 text-primary" stroke={3} /> AI character
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Delete ${character.name}? Existing clones will remain in your library.`)) return
                        await removeCharacter({ id: character._id })
                        toast.success("Character deleted")
                      }}
                      className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg bg-black/55 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                      aria-label={`Delete ${character.name}`}
                    ><IconTrash className="size-4" /></button>
                  </div>
                  <div className="p-4"><h3 className="font-semibold">{character.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{character.identityPrompt}</p><p className="mt-3 text-[11px] text-muted-foreground">{character.referenceImageKeys.length + 1} identity reference{character.referenceImageKeys.length ? "s" : ""}</p></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed bg-card/60 p-8 text-center"><div><IconRobot className="mx-auto size-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No characters yet</h3><p className="mt-1 text-sm text-muted-foreground">Your first reusable identity will appear here.</p></div></div>
          )}
        </section>
      </div>
    </div>
  )
}
