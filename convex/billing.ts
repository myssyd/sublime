/**
 * Shared billing catalog and credit rates.
 *
 * Price IDs deliberately stay server-side in Convex environment variables;
 * the browser only sends a typed plan + billing period to the checkout action.
 */

export type PaidPlan = "starter" | "creator" | "pro"
export type PlanId = "none" | PaidPlan
export type BillingPeriod = "monthly" | "yearly"

export type PlanMeta = {
  id: PaidPlan
  displayName: string
  monthlyAllowance: number
  monthlyPriceUsd: number
  annualPriceUsd: number
}

export const PLANS = {
  starter: {
    id: "starter",
    displayName: "Starter",
    monthlyAllowance: 700,
    monthlyPriceUsd: 19,
    annualPriceUsd: 190,
  },
  creator: {
    id: "creator",
    displayName: "Creator",
    monthlyAllowance: 2_000,
    monthlyPriceUsd: 49,
    annualPriceUsd: 490,
  },
  pro: {
    id: "pro",
    displayName: "Pro",
    monthlyAllowance: 4_500,
    monthlyPriceUsd: 99,
    annualPriceUsd: 990,
  },
} satisfies Record<PaidPlan, PlanMeta>

export const PAID_PLAN_IDS = ["starter", "creator", "pro"] as const

export const TOPUP_AMOUNT = 600
export const TOPUP_PRICE_USD = 15
export const ANNUAL_CREDIT_MULTIPLIER = 12

export const CREDIT_RATE_VERSION = 1
export const CHARACTER_IMAGE_CREDITS = 10
export const NANO_BANANA_IMAGE_CREDITS = 5
export const SEEDREAM_IMAGE_CREDITS = 10
export const KLING_VIDEO_CREDITS_PER_SECOND = 20
export const LIP_SYNC_CREDITS_PER_SECOND = 10

export function imageCreditsForModel(model: "seedream-5" | "nano-banana") {
  return model === "nano-banana"
    ? NANO_BANANA_IMAGE_CREDITS
    : SEEDREAM_IMAGE_CREDITS
}

export function videoCreditsForDuration(durationSeconds: number) {
  return Math.ceil(durationSeconds) * KLING_VIDEO_CREDITS_PER_SECOND
}

export function lipSyncCreditsForDuration(durationSeconds: number) {
  return Math.ceil(durationSeconds) * LIP_SYNC_CREDITS_PER_SECOND
}

export function getAnnualCredits(plan: PlanMeta) {
  return plan.monthlyAllowance * ANNUAL_CREDIT_MULTIPLIER
}

export function getAnnualMonthlyPrice(plan: PlanMeta) {
  return Math.round(plan.annualPriceUsd / ANNUAL_CREDIT_MULTIPLIER)
}

export function getAnnualSavingsPercent(plan: PlanMeta) {
  return Math.round(
    (1 - plan.annualPriceUsd / (plan.monthlyPriceUsd * 12)) * 100
  )
}

export function isPaidPlan(value: string): value is PaidPlan {
  return PAID_PLAN_IDS.includes(value as PaidPlan)
}
