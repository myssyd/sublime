"use client"

import { IconBrandGoogle, IconLock } from "@tabler/icons-react"
import { StudioHeader } from "@/components/studio-header"
import { useSession } from "@/lib/auth-client"

export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <div className="min-h-screen">
      <StudioHeader
        title="Profile"
        description="View the identity connected to your Sublime account."
      />

      <div className="mx-auto max-w-3xl px-5 py-7 md:px-8 lg:px-10 lg:py-10">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-5 py-4 sm:px-6">
            <h2 className="font-semibold">Personal details</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              These details come from the Google account you use to sign in.
            </p>
          </div>

          <div className="flex items-center gap-4 border-b p-5 sm:p-6">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border bg-muted text-lg font-semibold">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name ? `${user.name}'s profile photo` : "Profile photo"}
                  className="size-full object-cover"
                />
              ) : (
                user?.name?.slice(0, 1).toUpperCase() ?? "S"
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user?.name ?? "Sublime user"}</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <dl className="divide-y">
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr] sm:items-center sm:px-6">
              <dt className="text-xs font-medium text-muted-foreground">Name</dt>
              <dd className="text-sm">{user?.name ?? "Sublime user"}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr] sm:items-center sm:px-6">
              <dt className="text-xs font-medium text-muted-foreground">Email</dt>
              <dd className="truncate text-sm">{user?.email}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr] sm:items-center sm:px-6">
              <dt className="text-xs font-medium text-muted-foreground">Sign-in method</dt>
              <dd className="flex items-center gap-2 text-sm">
                <IconBrandGoogle className="size-4 text-muted-foreground" stroke={1.8} />
                Google
              </dd>
            </div>
          </dl>

          <div className="flex gap-3 border-t bg-muted/30 px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
            <IconLock className="mt-0.5 size-4 shrink-0" stroke={1.8} />
            Your profile details are managed by Google and cannot be changed in Sublime.
          </div>
        </section>
      </div>
    </div>
  )
}
