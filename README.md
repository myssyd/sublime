# Sublime

Sublime is an AI character studio for building reusable virtual characters and cloning a reference video's performance with those characters.

## Stack

- Next.js 16, React 19, TypeScript
- Convex with Better Auth, R2, and Workpool components
- Kling video-to-video generation through fal.ai
- Tailwind CSS 4 and shadcn-compatible UI primitives
- Bun for all package and script commands

## Local development

```bash
bun install
bun run dev:all
```

The web app always runs at [http://localhost:3004](http://localhost:3004). `dev:all` starts both Next.js and the Convex development process.

Copy `.env.example` to `.env.local` and fill in the three public/app variables. Provider, Google OAuth, Better Auth, and R2 secrets run inside Convex and should be configured with `bunx convex env set` rather than committed locally.

## Useful commands

```bash
bun run typecheck
bun run lint
bun run build
bunx convex deploy
bunx vercel --prod
```

## Product areas

- `/characters` creates reusable AI-character identities from frontal and supporting reference images.
- `/create` combines a character with a reference performance and queues a Kling video-to-video clone.
- `/library` tracks queued, generating, completed, and failed clones.
- `/settings` reports provider and infrastructure readiness.

Generated media is stored in the dedicated `sublime-media` R2 bucket. Convex contains only the product tables `characters`, `videos`, and `usage`, plus tables owned internally by mounted components.
