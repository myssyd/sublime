import type { NextConfig } from "next";

const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace(
  ".i.posthog.com",
  "-assets.i.posthog.com"
)

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/_x7a/static/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: "/_x7a/:path*",
        destination: `${POSTHOG_HOST}/:path*`,
      },
    ]
  },
};

export default nextConfig;
