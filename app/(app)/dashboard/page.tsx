"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session } = useSession();
  const pages = useQuery(api.landingPages.list, session ? {} : "skip");
  const canCreate = useQuery(api.usage.canCreatePage, session ? {} : "skip");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Landing Pages</h1>
          <p className="text-muted-foreground">
            Create and manage your AI-generated landing pages
          </p>
        </div>
        {canCreate?.canCreate && (
          <Link href="/new">
            <Button>Create New Page</Button>
          </Link>
        )}
      </div>

      {/* Usage warning */}
      {canCreate && !canCreate.canCreate && (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm">
              You&apos;ve reached your limit of {canCreate.max} pages. Upgrade to
              Pro for unlimited pages.
            </p>
            <Button size="sm">Upgrade to Pro</Button>
          </CardContent>
        </Card>
      )}

      {/* Pages grid */}
      {pages === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-32 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pages.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-6 w-6 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium">No landing pages yet</h3>
            <p className="mb-4 text-muted-foreground">
              Create your first landing page with AI assistance
            </p>
            <Link href="/new">
              <Button>Create Your First Page</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page: any) => (
            <Link key={page._id} href={`/editor/${page._id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="truncate">{page.name}</CardTitle>
                  <CardDescription className="truncate">
                    {page.businessContext.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        page.status === "published"
                          ? "bg-green-500/10 text-green-600"
                          : page.status === "generating"
                            ? "bg-yellow-500/10 text-yellow-600"
                            : "bg-muted"
                      }`}
                    >
                      {page.status}
                    </span>
                    <span>
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
