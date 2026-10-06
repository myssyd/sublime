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

## Idle cost control

The Worker checks the API key before accessing the container, for both POST `/`
and GET `/tunnel`. Other paths return 404 without starting it. GET or HEAD
`/healthz` returns 204 from the Worker only; use that endpoint for uptime checks.
It does not verify the container or Instagram connectivity.

The container sleeps after three minutes without activity and starts again on
the next authenticated import. The first import after sleeping has startup
latency. Three minutes exceeds the two-minute lifetime of Cobalt's in-memory
download links. Downloads stay on the same named instance. The idle handler
explicitly destroys the running container because Cobalt remained running after
the SDK's default SIGTERM in production. The SDK tracks in-flight response
streams before expiring activity; stored media is in R2, not the container disk.

Deploy the Convex change that sends authorization on downloads before deploying
the Worker gate. Otherwise existing imports will receive 401 on downloads.
After deployment, verify an import from sleep, then verify the instance stops
after three idle minutes. Public probes must not restart it.

### October 6, 2026 investigation

Invoice IN-82259453 charged $7.02 before tax for container usage, plus the $5
Workers plan. It recorded 2,529,199 GiB-seconds of memory, roughly 702.6 hours
at the configured 1 GiB. The live instance was still running with about 157 MiB
of memory use and near-zero CPU. Public root requests appeared in Worker logs.
Logs also confirmed the default idle handler sent SIGTERM at 12:51:14 GMT+8,
but the instance still reported running afterward.

The request gate, three-minute idle timeout, and explicit idle shutdown were
deployed on October 6. Convex production and development were updated first.
Worker version: `43519231-f095-462b-a9f7-366f2b204069`.
The existing container image and basic instance size were retained.

Validation passed: request-gate tests, TypeScript, Next.js production build,
and ESLint on changed TypeScript files. Live probes returned 204 for `/healthz`,
404 for public GET `/`, and 401 for unauthenticated resolves/downloads.
Authenticated probes reached Cobalt and returned its expected validation errors
for an empty resolve body and an invalid tunnel. These probes did not perform
an actual Instagram import.

Lifecycle verification: after the final authenticated request at 12:54:28 GMT+8,
the instance became inactive at 12:57:30. Public health/root/tunnel probes left
it inactive. An authenticated empty-body resolve then woke Cobalt and returned
its normal validation error in 5.9 seconds at 12:58:12. This verifies automatic
idle shutdown, no wake-up from public probes, and authenticated cold startup.

At light usage within the plan allowances, the recurring bill could approach
$5.70 including the current 14% tax, versus $13.70 on this invoice. This is an
estimate, not a cap. Keep the basic instance size until peak memory during real
imports is measured; idle memory is not a safe sizing benchmark. Other metered
services on this invoice were $0, and imported Reels are already reused from R2.
