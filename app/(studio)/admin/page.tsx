"use client"

import { useState, type FormEvent } from "react"
import { useMutation, useQuery } from "convex/react"
import {
  IconBolt,
  IconLoader2,
  IconSearch,
  IconShieldLock,
  IconUsers,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { StudioHeader } from "@/components/studio-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/convex/_generated/api"

const DEFAULT_GRANT = "100"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Could not grant credits"
}

export default function AdminPage() {
  const isAdmin = useQuery(api.admin.isAdmin)
  const users = useQuery(api.admin.listUsers, isAdmin ? {} : "skip")
  const grantCredits = useMutation(api.admin.grantCredits)
  const [search, setSearch] = useState("")
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null)

  const normalizedSearch = search.trim().toLowerCase()
  const filteredUsers =
    users?.filter(
      (user) =>
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch)
    ) ?? []

  async function handleGrant(
    event: FormEvent<HTMLFormElement>,
    user: NonNullable<typeof users>[number]
  ) {
    event.preventDefault()
    const credits = Number(amounts[user.id] ?? DEFAULT_GRANT)
    if (!Number.isSafeInteger(credits) || credits <= 0) {
      toast.error("Enter a positive whole number of credits")
      return
    }

    setGrantingUserId(user.id)
    try {
      await grantCredits({
        userId: user.id,
        credits,
        grantId: crypto.randomUUID(),
      })
      toast.success(
        `Granted ${credits.toLocaleString()} credits to ${user.name}`
      )
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setGrantingUserId(null)
    }
  }

  if (isAdmin === undefined) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconLoader2 className="size-4 animate-spin" />
          Checking admin access
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-5">
        <section className="max-w-md rounded-2xl border bg-card p-7 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
            <IconShieldLock className="size-5" />
          </span>
          <h1 className="mt-4 text-xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This page is only available to the account configured as the
            Sublime admin.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <StudioHeader
        eyebrow="Admin"
        title="Users"
        description="Review accounts and add complimentary credits to any user."
      />

      <main className="mx-auto max-w-6xl px-5 pb-12 md:px-8 lg:px-10">
        <section className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="relative block max-w-md">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
              aria-label="Search users"
            />
          </label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground sm:justify-self-end">
            <IconUsers className="size-4" />
            {users === undefined
              ? "Loading users"
              : `${users.length.toLocaleString()} ${users.length === 1 ? "user" : "users"}`}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(7rem,0.6fr)_minmax(8rem,0.6fr)_minmax(15rem,1fr)] gap-4 border-b bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid">
            <span>User</span>
            <span>Plan</span>
            <span>Available</span>
            <span>Grant credits</span>
          </div>

          {users === undefined ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" />
              Loading users
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              {search ? "No users match your search." : "No users yet."}
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((user) => {
                const amount = amounts[user.id] ?? DEFAULT_GRANT
                const isGranting = grantingUserId === user.id
                return (
                  <article
                    key={user.id}
                    className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(7rem,0.6fr)_minmax(8rem,0.6fr)_minmax(15rem,1fr)] md:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border bg-muted text-sm font-semibold">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.image}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          user.name.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {user.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
                        Plan
                      </p>
                      <p className="text-sm capitalize">
                        {user.plan === "none" ? "No plan" : user.plan}
                      </p>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {user.status.replaceAll("_", " ")}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
                        Available
                      </p>
                      <p className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                        <IconBolt
                          className="size-3.5 text-primary"
                          fill="currentColor"
                        />
                        {user.total.toLocaleString()}
                      </p>
                      {user.adminBalance > 0 ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {user.adminBalance.toLocaleString()} complimentary
                        </p>
                      ) : null}
                    </div>

                    <form
                      onSubmit={(event) => handleGrant(event, user)}
                      className="flex items-center gap-2"
                    >
                      <Input
                        type="number"
                        min={1}
                        max={1_000_000}
                        step={1}
                        inputMode="numeric"
                        value={amount}
                        onChange={(event) =>
                          setAmounts((current) => ({
                            ...current,
                            [user.id]: event.target.value,
                          }))
                        }
                        aria-label={`Credits to grant ${user.name}`}
                        className="min-w-0 tabular-nums"
                        disabled={isGranting}
                      />
                      <Button
                        type="submit"
                        className="min-w-24"
                        disabled={grantingUserId !== null}
                      >
                        {isGranting ? (
                          <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                          <IconBolt className="size-4" />
                        )}
                        {isGranting ? "Granting" : "Grant"}
                      </Button>
                    </form>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
