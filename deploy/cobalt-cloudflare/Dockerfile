FROM ghcr.io/imputnet/cobalt:11

COPY --chown=node:node --chmod=755 cloudflare-entrypoint.sh /app/cloudflare-entrypoint.sh

ENTRYPOINT ["/app/cloudflare-entrypoint.sh"]
