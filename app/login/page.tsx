"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IconBrandGoogleFilled, IconLoader2, IconMovie } from "@tabler/icons-react"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { signIn, useSession } from "@/lib/auth-client"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending } = useSession()
  const [signingIn, setSigningIn] = useState(false)
  const next = searchParams.get("next") || "/create"

  useEffect(() => {
    if (!isPending && session) router.replace(next)
  }, [isPending, next, router, session])

  async function handleGoogle() {
    setSigningIn(true)
    await signIn.social({ provider: "google", callbackURL: next })
    setSigningIn(false)
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#161811] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-1/3 size-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -right-12 bottom-0 size-80 rounded-full bg-lime-300/15 blur-3xl" />
        <div className="relative flex items-center gap-3 text-lg font-semibold">
          <BrandMark /> Sublime
        </div>
        <div className="relative max-w-xl">
          <div className="mb-7 grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <IconMovie className="size-7 text-primary" />
          </div>
          <h1 className="text-5xl font-semibold leading-[1.06] tracking-[-0.04em]">
            Your character.
            <br />Any performance.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/58">
            Build a consistent AI identity, then clone the movement, energy, and camera language of a reference video.
          </p>
        </div>
        <p className="relative text-sm text-white/35">sublime.kiwi</p>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <BrandMark className="mb-8 lg:hidden" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Welcome to Sublime</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Open your studio</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sign in to manage your characters and video clones.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="mt-8 w-full bg-card"
            onClick={handleGoogle}
            disabled={signingIn || isPending}
          >
            {signingIn ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconBrandGoogleFilled className="size-4" />
            )}
            Continue with Google
          </Button>
          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
            By continuing, you agree to use source footage and character references you have permission to transform.
          </p>
        </div>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center">
          <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
