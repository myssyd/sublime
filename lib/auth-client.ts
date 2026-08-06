import { createAuthClient } from "better-auth/react"
import { convexClient } from "@convex-dev/better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [convexClient()],
  sessionOptions: { refetchOnWindowFocus: false },
})

export const { signIn, signOut, useSession } = authClient
