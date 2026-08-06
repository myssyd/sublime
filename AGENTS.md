# Sublime

- Use `bun` and `bunx` for all package, script, and one-off commands.
- The Next.js app always runs on port **3004**.
- Theme state uses `next-themes`; pressing unmodified `d` outside editable controls toggles light/dark mode globally.
- Run `bun run typecheck` and `bun run build` after non-trivial changes.
- Keep provider secrets in Convex environment variables. Never expose them through `NEXT_PUBLIC_*` variables.
- Authentication in Convex functions comes from `authComponent.getAuthUser(ctx)`; do not accept a frontend-supplied user ID.
- Workpool actions run without a browser session and must call internal Convex functions.
- Store uploaded and generated media in the dedicated Sublime R2 bucket.
- The intentional app tables are `characters`, `videoClones`, and `usage`. Remove obsolete tables when replacing a feature instead of leaving stale schemas or data behind.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
