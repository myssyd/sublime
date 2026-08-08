# Sublime

Sublime is an AI character studio for building reusable virtual characters and cloning a reference video's performance with those characters.

## Stack

- Next.js 16, React 19, TypeScript
- Convex with Better Auth, R2, and Workpool components
- Stripe subscriptions, prepaid top-ups, and an auditable Convex credit ledger
- Seedream 5 Pro character generation plus Kling and Seedance video tools through fal.ai
- Tailwind CSS 4 and shadcn-compatible UI primitives
- Bun for all package and script commands

## Local development

```bash
bun install
bun run dev:all
```

The web app always runs at [http://localhost:3004](http://localhost:3004). `dev:all` starts both Next.js and the Convex development process.

Copy `.env.example` to `.env.local` and fill in the three public/app variables. Provider, Google OAuth, Better Auth, and R2 secrets run inside Convex and should be configured with `bunx convex env set` rather than committed locally.

Instagram Reel imports use a self-hosted [Cobalt](https://github.com/imputnet/cobalt) instance. Configure `COBALT_API_URL` in Convex and, if that instance requires API-key authentication, set `COBALT_API_KEY` as well. Sublime only accepts public Reel URLs and copies the resolved video into its dedicated R2 bucket before generation.

Imported Reels are shared source assets keyed by Instagram shortcode under
`sources/instagram/reels/{shortcode}`. User video records reference that global
object, so a public Reel is fetched from Instagram at most once across all
Sublime users. R2 stores only the video bytes; canonical URL, filename,
duration, size, and import coordination live in Convex's `videoSources` table.

The production Cobalt deployment for Sublime lives in `deploy/cobalt-cloudflare` and runs on Cloudflare Containers behind `cobalt.sublime.kiwi`.

## Billing and credits

Sublime has paid plans only. Starter is $19/month for 700 credits, Creator is
$49/month for 2,000 credits, and Pro is $99/month for 4,500 credits. Annual
plans cost ten months and grant twelve months of credits upfront. Existing
subscribers can add 600 non-expiring credits for $15.

Credit rates are centralized in `convex/billing.ts`: Nano Banana photos cost 5,
Seedream photos cost 10, complete three-image character builds cost 30, and
video clones cost 20 credits per rounded-up source second with Kling O3 Pro,
35 with Seedance 2.0 Fast, or 70 with Seedance 2.5. Kling V3 Standard Motion
Control costs 20 credits per rounded-up reference second. Credits
are reserved before a provider call, charged once the provider succeeds, and
released on provider failure. Subscription credits are spent before top-up
credits and unused subscription credits expire at renewal; top-up credits do
not expire while the account remains usable.

Configure every Stripe value shown in `.env.example` in the Convex environment
with `bunx convex env set`. Never add Stripe secrets to `NEXT_PUBLIC_*` values.
Stripe should deliver webhooks to the Convex site URL at `/stripe/webhook`.

## Useful commands

```bash
bun run typecheck
bun run lint
bun run build
bunx convex deploy
bunx vercel --prod
```

## Product areas

- `/characters` guides users from a prompt or source photos through hero approval and a Seedream-generated Kling reference pack.
- `/create` creates pictures, clones uploaded videos or public Instagram Reels, transfers motion with Kling V3 Standard, and lip-syncs characters.
- `/library` tracks queued, generating, completed, and failed clones.
- `/billing` handles paid plans, top-ups, credit balance, and the customer portal.
- `/settings` manages the signed-in account and app appearance.

Generated media is stored in the `sublime` R2 bucket under per-user `characters` and `videos` prefixes. Convex contains the product tables `characters`, `videoSources`, `videos`, and `usage`, plus tables owned internally by mounted components.
