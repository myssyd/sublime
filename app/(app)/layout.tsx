import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { isAuthenticated, getServerUser } from "@/lib/auth-server";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Server-side auth validation (defense-in-depth, proxy.ts handles most cases)
  const hasAuth = await isAuthenticated();

  if (!hasAuth) {
    redirect("/login");
  }

  // Get user data for AppNav (may be null for new OAuth users)
  const user = await getServerUser();

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav
        user={
          user
            ? { name: user.name, email: user.email, image: user.image }
            : { name: null, email: null, image: null }
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
