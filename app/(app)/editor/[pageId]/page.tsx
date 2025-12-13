"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { SectionRenderer } from "@/components/sections";
import { Theme } from "@/lib/sections/definitions";
import { getSectionDisplayName } from "@/lib/sections/metadata";
import {
  Cursor01Icon,
  Move01Icon,
  Comment01Icon,
  Layers01Icon,
  ArrowLeft01Icon,
  ComputerIcon,
  Tablet01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

type ViewportMode = "desktop" | "tablet" | "mobile";

export default function EditorPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = use(params);
  const { data: session } = useSession();
  const [viewportMode, setViewportMode] = useState<ViewportMode>("desktop");
  const [selectedTool, setSelectedTool] = useState<
    "cursor" | "move" | "comment" | "layers"
  >("cursor");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );

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
            This landing page doesn&apos;t exist or you don&apos;t have access
            to it.
          </p>
        </div>
      </div>
    );
  }

  const theme: Theme = page.theme;

  const viewportClasses = {
    desktop: "w-full",
    tablet: "w-[768px] mx-auto",
    mobile: "w-[375px] mx-auto",
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="font-medium">{page.name}</h1>
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={viewportMode === "desktop" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewportMode("desktop")}
          >
            <HugeiconsIcon icon={ComputerIcon} className="w-4 h-4" />
          </Button>
          <Button
            variant={viewportMode === "tablet" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewportMode("tablet")}
          >
            <HugeiconsIcon icon={Tablet01Icon} className="w-4 h-4" />
          </Button>
          <Button
            variant={viewportMode === "mobile" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewportMode("mobile")}
          >
            <HugeiconsIcon icon={SmartPhone01Icon} className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
            {page.status}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Preview pane */}
        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          <div
            className={`${viewportClasses[viewportMode]} transition-all duration-300 rounded-lg overflow-hidden shadow-xl`}
            style={{
              backgroundColor: theme.backgroundColor,
              color: theme.textColor,
            }}
          >
            {sections === undefined ? (
              <div className="animate-pulse space-y-4 p-8">
                <div className="h-48 rounded bg-muted" />
                <div className="h-32 rounded bg-muted" />
                <div className="h-32 rounded bg-muted" />
              </div>
            ) : sections.length === 0 ? (
              <div className="flex h-96 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="mb-2">No sections yet.</p>
                  <p className="text-sm">
                    This page is still being generated.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {sections.map((section: any) => (
                  <SectionRenderer
                    key={section._id}
                    type={section.type}
                    content={section.content}
                    theme={theme}
                    isSelected={selectedSectionId === section._id}
                    onClick={
                      selectedTool === "comment"
                        ? () => setSelectedSectionId(section._id)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Layers panel (right sidebar) */}
        {selectedTool === "layers" && sections && sections.length > 0 && (
          <div className="w-64 border-l bg-background overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="font-medium">Layers</h2>
            </div>
            <div className="p-2">
              {sections.map((section: any, index: number) => (
                <button
                  key={section._id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedSectionId === section._id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedSectionId(section._id)}
                >
                  <span className="text-xs text-muted-foreground mr-2">
                    {index + 1}
                  </span>
                  {getSectionDisplayName(section.type)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor toolbar (bottom) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 rounded-full bg-background px-2 py-1.5 shadow-lg ring-1 ring-border">
          <Button
            variant={selectedTool === "cursor" ? "secondary" : "ghost"}
            size="icon-sm"
            className="rounded-full"
            onClick={() => setSelectedTool("cursor")}
            title="Select (V)"
          >
            <HugeiconsIcon icon={Cursor01Icon} className="w-4 h-4" />
          </Button>
          <Button
            variant={selectedTool === "move" ? "secondary" : "ghost"}
            size="icon-sm"
            className="rounded-full"
            onClick={() => setSelectedTool("move")}
            title="Move (M)"
          >
            <HugeiconsIcon icon={Move01Icon} className="w-4 h-4" />
          </Button>
          <Button
            variant={selectedTool === "comment" ? "secondary" : "ghost"}
            size="icon-sm"
            className="rounded-full"
            onClick={() => setSelectedTool("comment")}
            title="Comment (C)"
          >
            <HugeiconsIcon icon={Comment01Icon} className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant={selectedTool === "layers" ? "secondary" : "ghost"}
            size="icon-sm"
            className="rounded-full"
            onClick={() =>
              setSelectedTool(selectedTool === "layers" ? "cursor" : "layers")
            }
            title="Layers (L)"
          >
            <HugeiconsIcon icon={Layers01Icon} className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
