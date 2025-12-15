"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

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
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={File02Icon} />
            </EmptyMedia>
            <EmptyTitle>No landing pages yet</EmptyTitle>
            <EmptyDescription>
              Create your first landing page with AI assistance
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/new">
              <Button>Create Your First Page</Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page: any) => (
            <Link key={page._id} href={`/editor/${page._id}`}>
              <Card className="cursor-pointer transition-all duration-200 ease-out hover:-translate-y-1 hover:ring-foreground/20 hover:shadow-md active:scale-[0.98] active:shadow-sm">
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
