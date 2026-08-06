import { authComponent } from "./auth"
import { query } from "./_generated/server"

export const providerStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return null
    return {
      fal: Boolean(process.env.FAL_KEY),
      openRouter: Boolean(process.env.OPENROUTER_API_KEY),
      r2: Boolean(
        process.env.R2_BUCKET &&
          process.env.R2_ENDPOINT &&
          process.env.R2_ACCESS_KEY_ID &&
          process.env.R2_SECRET_ACCESS_KEY &&
          process.env.R2_PUBLIC_DOMAIN
      ),
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    }
  },
})
