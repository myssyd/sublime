"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [userEnsured, setUserEnsured] = useState(false);
  const ensureUser = useMutation(api.users.ensureUser);

  // Ensure user exists in database after login
  useEffect(() => {
    if (session && !userEnsured) {
      ensureUser()
        .then(() => setUserEnsured(true))
        .catch(console.error);
    }
  }, [session, userEnsured, ensureUser]);

  const usage = useQuery(api.usage.getUsage, session && userEnsured ? {} : "skip");

  // Redirect to login if not authenticated
  if (!isPending && !session) {
    router.push("/login");
    return null;
  }

  // Show loading while ensuring user exists
  if (isPending || (session && !userEnsured)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-semibold">
              Sublime
            </Link>
            <nav className="hidden items-center gap-4 sm:flex">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/media"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Media
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Usage indicator */}
            {usage && (
              <div className="hidden text-xs text-muted-foreground sm:block">
                {usage.usage.pagesCreated}/{usage.limits.maxPages === Infinity ? "∞" : usage.limits.maxPages} pages
              </div>
            )}

            {/* New page button */}
            <Link href="/new">
              <Button size="sm">New Page</Button>
            </Link>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {session?.user?.name?.[0]?.toUpperCase() ||
                      session?.user?.email?.[0]?.toUpperCase() ||
                      "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                {usage && (
                  <>
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>AI calls</span>
                        <span>
                          {usage.usage.aiCallsThisMonth}/
                          {usage.limits.aiCallsPerMonth}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(100, (usage.usage.aiCallsThisMonth / usage.limits.aiCallsPerMonth) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
