"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { AppNav } from "@/components/app-nav";

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

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav user={session!.user} usage={usage} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
