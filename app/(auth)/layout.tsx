import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
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
