# Sublime Cobalt on Cloudflare Containers

This deployment runs the official Cobalt 11 image behind one stable, named
Cloudflare Container. The singleton routing is intentional: Cobalt keeps its
short-lived tunnel map in memory, so the resolving request and subsequent
download must reach the same instance.

## Prerequisites

- Cloudflare Workers Paid plan with Containers enabled
- `sublime.kiwi` active in the same Cloudflare account
- Docker running locally for the image build

## Configure the API key

To rotate the key after the Worker exists, generate a UUIDv4 and save the exact
same value in Cloudflare and both Convex deployments:

```bash
COBALT_KEY="$(uuidgen | tr '[:upper:]' '[:lower:]')"
printf '%s' "$COBALT_KEY" | bunx node@22 node_modules/wrangler/bin/wrangler.js secret put COBALT_API_KEY --config deploy/cobalt-cloudflare/wrangler.jsonc
bunx convex env set COBALT_API_KEY "$COBALT_KEY"
bunx convex env set --prod COBALT_API_KEY "$COBALT_KEY"
```

Do not put the key in `.env.local` or any `NEXT_PUBLIC_*` variable.
For a brand-new Worker, pass a permission-restricted env or JSON file containing
`COBALT_API_KEY` to the first deploy with Wrangler's `--secrets-file` option;
the required-secret check intentionally prevents an unprotected first publish.

## Deploy

```bash
bun run cobalt:deploy
bun run cobalt:status
bunx convex env set COBALT_API_URL https://cobalt.sublime.kiwi/
bunx convex env set --prod COBALT_API_URL https://cobalt.sublime.kiwi/
```

The container only enables Instagram, requires its UUID API key, accepts at
most 60 resolve requests per minute for that key, and rejects media longer
than the 10-second Kling O3 Pro input limit.
