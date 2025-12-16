import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { passkey } from "better-auth/plugins/passkey";
import { components } from "./_generated/api";
import { QueryCtx, MutationCtx } from "./_generated/server";

export const authComponent = createClient(components.betterAuth);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createAuth = (ctx: any) => {
  return betterAuth({
    baseURL: process.env.SITE_URL,
    database: authComponent.adapter(ctx),
    trustedOrigins: ["http://localhost:3000", "https://sublime.kiwi"],
    emailAndPassword: { enabled: true },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [
      convex(),
      passkey({
        rpName: "Sublime",
      }),
    ],
  });
};

// Helper for protected queries/mutations
export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx as any);
  const session = await auth.api.getSession({ headers });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Find user in our users table
  const existingUser = await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_email", (q: any) => q.eq("email", session.user.email))
    .first();

  if (existingUser) {
    return existingUser;
  }

  // User not found - throw for queries, queries cannot create users
  throw new Error("User not found in database");
}

// Check if user is authenticated (doesn't throw)
export async function getOptionalAuthUser(ctx: QueryCtx | MutationCtx) {
  try {
    return await getAuthUser(ctx);
  } catch {
    return null;
  }
}
