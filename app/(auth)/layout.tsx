import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { isAuthenticated } from "@/lib/auth-server";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/" className="text-xl font-semibold">
            Sublime
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
