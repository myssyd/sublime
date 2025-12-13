"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

// Placeholder for Sprint 3 & 4 - Visual Editor
export default function EditorPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = use(params);
  const { data: session } = useSession();
  const page = useQuery(
    api.landingPages.get,
    session ? { id: pageId as Id<"landingPages"> } : "skip"
  );
  const sections = useQuery(
    api.sections.listByPage,
    session ? { landingPageId: pageId as Id<"landingPages"> } : "skip"
  );

  if (page === undefined) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (page === null) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Page not found</h2>
          <p className="text-muted-foreground">
            This landing page doesn&apos;t exist or you don&apos;t have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Preview pane */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <div className="mx-auto max-w-4xl rounded-lg bg-background shadow-lg">
          {/* Page header info */}
          <div className="border-b p-4">
            <h1 className="text-xl font-bold">{page.name}</h1>
            <p className="text-sm text-muted-foreground">
              {page.businessContext.description}
            </p>
          </div>

          {/* Sections preview */}
          <div className="min-h-[500px] p-4">
            {sections === undefined ? (
              <div className="animate-pulse space-y-4">
                <div className="h-48 rounded bg-muted" />
                <div className="h-32 rounded bg-muted" />
              </div>
            ) : sections.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No sections yet. This page is still generating.
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section: any) => (
                  <div
                    key={section._id}
                    className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4"
                  >
                    <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                      {section.type}
                    </div>
                    <pre className="text-xs">
                      {JSON.stringify(section.content, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor toolbar placeholder */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 shadow-lg ring-1 ring-border">
          <Button variant="ghost" size="sm" className="rounded-full">
            Cursor
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full">
            Move
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full">
            Comment
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full">
            Layers
          </Button>
        </div>
      </div>

      {/* Chat panel placeholder */}
      <div className="hidden w-80 border-l lg:block">
        <div className="p-4">
          <h2 className="font-medium">Chat</h2>
          <p className="text-sm text-muted-foreground">
            Coming in Sprint 4 - Chat for complex edits
          </p>
        </div>
      </div>
    </div>
  );
}
