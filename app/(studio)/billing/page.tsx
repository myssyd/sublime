"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAction, useQuery } from "convex/react"
import {
  IconBolt,
  IconCheck,
  IconExternalLink,
  IconLoader2,
  IconPlus,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { StudioHeader } from "@/components/studio-header"
import { NumberPopIn } from "@/components/number-pop-in"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import {
  PAID_PLAN_IDS,
  PLANS,
  TOPUP_AMOUNT,
  TOPUP_PRICE_USD,
  getAnnualCredits,
  getAnnualMonthlyPrice,
  getAnnualSavingsPercent,
  type BillingPeriod,
  type PaidPlan,
} from "@/convex/billing"
import { track } from "@/lib/posthog"
import { cn } from "@/lib/utils"

function BillingContent() {
  const searchParams = useSearchParams()
  const balance = useQuery(api.credits.getMyBalance)
  const subscription = useQuery(api.credits.getMySubscription)
  const createSubscriptionCheckout = useAction(
    api.stripe.createSubscriptionCheckout
  )
  const createTopupCheckout = useAction(api.stripe.createTopupCheckout)
  const createCustomerPortal = useAction(api.stripe.createCustomerPortal)
  const [period, setPeriod] = useState<BillingPeriod>("yearly")
  const [busy, setBusy] = useState<string | null>(null)

  const hasSubscription =
    subscription?.status === "active" || subscription?.status === "past_due"
  const currentPlan = subscription?.plan ?? "none"
  const status = searchParams.get("status")

  async function subscribe(plan: PaidPlan) {
    setBusy(plan)
    try {
      const result = await createSubscriptionCheckout({ plan, period })
      if (result.url) {
        track("checkout_started", {
          checkout_type: "subscription",
          source: "billing_page",
          plan,
          billing_period: period,
        })
        window.location.assign(result.url)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start checkout"
      )
      setBusy(null)
    }
  }

  async function openPortal() {
    setBusy("portal")
    try {
      const result = await createCustomerPortal({})
      track("billing_portal_opened", { source: "billing_page" })
      window.location.assign(result.url)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not open billing"
      )
      setBusy(null)
    }
  }

  async function buyTopup() {
    setBusy("topup")
    try {
      const result = await createTopupCheckout({})
      if (result.url) {
        track("checkout_started", {
          checkout_type: "topup",
          source: "billing_page",
        })
        window.location.assign(result.url)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start checkout"
      )
      setBusy(null)
    }
  }

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null

  return (
    <div className="min-h-screen">
      <StudioHeader
        eyebrow="Plans & credits"
        title="Billing"
        description="Choose a plan, see exactly what each generation costs, and keep your studio moving."
      />

      <main className="mx-auto max-w-6xl space-y-6 px-5 pb-12 md:px-8 lg:px-10">
        {status === "success" || status === "topup_success" ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
            {status === "topup_success"
              ? "Top-up complete. Your new credits will appear shortly."
              : "Subscription complete. Your credits will appear shortly."}
          </div>
        ) : status === "canceled" ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            Checkout canceled. Nothing was charged.
          </div>
        ) : null}

        <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Current plan
            </p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xl font-semibold">
                {currentPlan === "none"
                  ? "No plan"
                  : PLANS[currentPlan as PaidPlan]?.displayName ?? currentPlan}
              </p>
              {subscription?.status === "past_due" ? (
                <span className="rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-semibold uppercase text-destructive">
                  Past due
                </span>
              ) : null}
            </div>
            {periodEnd && hasSubscription ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {subscription?.cancelAtPeriodEnd ? "Ends" : "Renews"} {periodEnd}
              </p>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Available credits
            </p>
            <div className="mt-2 flex items-center gap-2">
              <IconBolt className="size-5 text-primary" fill="currentColor" />
              <span className="text-2xl font-semibold tabular-nums">
                {balance === undefined
                  ? "—"
                  : (balance?.total ?? 0).toLocaleString()}
              </span>
            </div>
            {balance?.reservedCredits ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {balance.reservedCredits.toLocaleString()} reserved for jobs in progress
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {hasSubscription ? (
              <>
                <Button
                  variant="outline"
                  onClick={openPortal}
                  disabled={busy !== null}
                >
                  Manage <IconExternalLink className="size-4" />
                </Button>
                <Button onClick={buyTopup} disabled={busy !== null}>
                  {busy === "topup" ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconPlus className="size-4" />
                  )}
                  {TOPUP_AMOUNT} credits · ${TOPUP_PRICE_USD}
                </Button>
              </>
            ) : null}
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Simple, usage-backed pricing
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Pick your creative pace
              </h2>
            </div>
            <div
              role="group"
              aria-label="Billing period"
              className="inline-flex w-fit rounded-full border bg-muted/60 p-1 text-xs"
            >
              {(["monthly", "yearly"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={period === value}
                  onClick={() => {
                    if (period !== value) {
                      track("pricing_billing_period_changed", {
                        billing_period: value,
                      })
                    }
                    setPeriod(value)
                  }}
                  className={cn(
                    "rounded-full px-3 py-2 font-medium capitalize text-muted-foreground transition-colors",
                    period === value &&
                      "bg-background text-foreground shadow-sm"
                  )}
                >
                  {value === "yearly"
                    ? `Yearly · save ${getAnnualSavingsPercent(PLANS.starter)}%`
                    : "Monthly"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {PAID_PLAN_IDS.map((planId) => {
              const plan = PLANS[planId]
              const featured = planId === "creator"
              const isCurrent = currentPlan === planId && hasSubscription
              const displayedPrice =
                period === "yearly"
                  ? getAnnualMonthlyPrice(plan)
                  : plan.monthlyPriceUsd
              const displayedCredits =
                period === "yearly"
                  ? getAnnualCredits(plan)
                  : plan.monthlyAllowance
              const monthlyCredits = plan.monthlyAllowance
              const creditBasis = displayedCredits

              return (
                <article
                  key={planId}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-card p-6",
                    featured &&
                      "border-primary shadow-[0_24px_60px_-40px_color-mix(in_oklch,var(--primary)_75%,transparent)]"
                  )}
                >
                  {featured ? (
                    <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
                      Most popular
                    </span>
                  ) : null}
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {plan.displayName}
                    </p>
                    {isCurrent ? (
                      <span className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Current
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex min-h-12 items-baseline">
                    {period === "yearly" ? (
                      <span className="mr-2 text-lg text-muted-foreground line-through">
                        ${plan.monthlyPriceUsd}
                      </span>
                    ) : null}
                    <NumberPopIn
                      value={`$${displayedPrice}`}
                      className="text-4xl font-semibold tracking-tight tabular-nums"
                    />
                    <NumberPopIn
                      value="/mo"
                      className="ml-1 text-sm text-muted-foreground"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {period === "yearly"
                      ? `$${plan.annualPriceUsd} billed yearly · ${displayedCredits.toLocaleString()} credits upfront`
                      : `${monthlyCredits.toLocaleString()} credits each month`}
                  </p>

                  <ul className="mt-6 space-y-3 text-sm">
                    {[
                      period === "yearly"
                        ? `${displayedCredits.toLocaleString()} credits upfront`
                        : `${monthlyCredits.toLocaleString()} credits per month`,
                      `Up to ${(creditBasis / 5).toLocaleString()} Nano Banana photos`,
                      `Up to ${Math.floor(creditBasis / 100).toLocaleString()} five-second Kling Pro videos`,
                      "Credits work across photos, video, and characters",
                      "Commercial use",
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                          <IconCheck className="size-3" stroke={2.5} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-7">
                    <Button
                      variant={featured ? "default" : "outline"}
                      className="w-full"
                      disabled={busy !== null}
                      onClick={isCurrent || hasSubscription ? openPortal : () => subscribe(planId)}
                    >
                      {busy === planId || (busy === "portal" && (isCurrent || hasSubscription)) ? (
                        <IconLoader2 className="size-4 animate-spin" />
                      ) : null}
                      {isCurrent
                        ? "Manage plan"
                        : hasSubscription
                          ? `Switch to ${plan.displayName}`
                          : `Choose ${plan.displayName}`}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border bg-muted/35 p-5 sm:p-6">
          <h2 className="font-semibold">How credits work</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <p><strong className="text-foreground">5 credits</strong><br />Nano Banana photo</p>
            <p><strong className="text-foreground">10 credits</strong><br />Seedream 5 Pro photo</p>
            <p><strong className="text-foreground">30 credits</strong><br />Complete character build</p>
            <p><strong className="text-foreground">20 credits/sec</strong><br />Kling O3 Pro video clone</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  )
}
