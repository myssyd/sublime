import { fetchQuery } from "convex/nextjs";
import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";
import { createAuth } from "@/convex/auth";
import { api } from "@/convex/_generated/api";

/**
 * Get auth token for server-side Convex calls
 */
export const getToken = () => {
  return getTokenNextjs(createAuth);
};

/**
 * Check if there's a valid auth session.
 * Returns true if authenticated, false otherwise.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getToken();
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Get the current authenticated user from server components.
 * Returns null if not authenticated or user doesn't exist in our table.
 * Note: For new OAuth users, this may return null even with valid session.
 */
export async function getServerUser() {
  try {
    const token = await getToken();
    if (!token) {
      return null;
    }

    const user = await fetchQuery(api.users.me, {}, { token });
    return user;
  } catch {
    return null;
  }
}
