# Sublime

Sublime is an AI character studio for building reusable virtual characters and cloning a reference video's performance with those characters.

## Stack

- Next.js 16, React 19, TypeScript
- Convex with Better Auth, R2, and Workpool components
- Seedream 5 Pro character generation and Kling O3 Pro video cloning through fal.ai
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
- `/create` combines a character with an uploaded video or public Instagram Reel and queues a Kling video-to-video clone.
- `/library` tracks queued, generating, completed, and failed clones.
- `/settings` manages the signed-in account and app appearance.

Generated media is stored in the `sublime` R2 bucket under per-user `characters` and `videos` prefixes. Convex contains the product tables `characters`, `videoSources`, `videos`, and `usage`, plus tables owned internally by mounted components.
