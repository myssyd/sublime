"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { SectionRenderer } from "@/components/sections";
import { CommentPopover } from "@/components/comment-popover";
import { Theme, SectionType } from "@/lib/sections/definitions";
import { getSectionDisplayName } from "@/lib/sections/metadata";
import {
  Cursor01Icon,
  Move01Icon,
  CommentAdd02Icon,
  Layers01Icon,
  ArrowLeft01Icon,
  ComputerIcon,
  Tablet01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

type ViewportMode = "desktop" | "tablet" | "mobile";

// Helper to get element info for display
function getElementInfo(element: HTMLElement, sectionType: string): string {
  const tagName = element.tagName.toLowerCase();
  const textContent = element.textContent?.trim().slice(0, 30) || "";
  const sectionName = getSectionDisplayName(sectionType as SectionType);

  if (textContent) {
    return `${sectionName} > ${tagName}: "${textContent}${textContent.length >= 30 ? "..." : ""}"`;
  }
  return `${sectionName} > ${tagName}`;
}

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

  // Element-level selection state
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [selectedElementInfo, setSelectedElementInfo] = useState<string>("");
  const [selectedElementSectionId, setSelectedElementSectionId] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | undefined>(undefined);

  // Processing state for AI comment handling
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview state for AI-generated changes
  const [previewContent, setPreviewContent] = useState<{
    sectionId: string;
    oldContent: any;
    newContent: any;
  } | null>(null);
  const [isShowingNewContent, setIsShowingNewContent] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  // AI action for processing comments
  const processComment = useAction(api.agents.actions.processComment);

  // Mutation for updating section content
  const updateSection = useMutation(api.sections.update);

  // Clear selection when tool changes
  useEffect(() => {
    if (selectedTool !== "comment") {
      if (selectedElement) {
        selectedElement.classList.remove("comment-selected-element");
      }
      setSelectedElement(null);
      setSelectedElementInfo("");
      setSelectedElementSectionId(null);
      setIsPopoverOpen(false);
    }
  }, [selectedTool, selectedElement]);

  // Keyboard shortcuts for tool selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "v":
          setSelectedTool("cursor");
          break;
        case "m":
          setSelectedTool("move");
          break;
        case "c":
          setSelectedTool("comment");
          break;
        case "l":
          setSelectedTool(selectedTool === "layers" ? "cursor" : "layers");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTool]);

  const handleElementClick = useCallback(
    (element: HTMLElement, sectionId: string, sectionType: string, event: React.MouseEvent) => {
      // Remove highlight from previous element
      if (selectedElement) {
        selectedElement.classList.remove("comment-selected-element");
      }

      // Add highlight to new element
      element.classList.add("comment-selected-element");

      // Update state
      setSelectedElement(element);
      setSelectedElementInfo(getElementInfo(element, sectionType));
      setSelectedElementSectionId(sectionId);
      setClickPosition({ x: event.clientX, y: event.clientY });
      setIsPopoverOpen(true);
    },
    [selectedElement]
  );

  const handleClosePopover = useCallback(() => {
    if (selectedElement) {
      selectedElement.classList.remove("comment-selected-element");
    }
    setSelectedElement(null);
    setSelectedElementInfo("");
    setSelectedElementSectionId(null);
    setClickPosition(undefined);
    setIsPopoverOpen(false);
  }, [selectedElement]);

  const handleCommentSubmit = async (comment: string, model: string) => {
    if (!selectedElement || !selectedElementSectionId || !sections) return;

    const sectionId = selectedElementSectionId;
    const elementInfo = selectedElementInfo;

    // Find the current section content
    const currentSection = sections.find((s: any) => s._id === sectionId);
    if (!currentSection) return;

    // Start processing - keep popover open, it will morph into loading indicator
    setIsProcessing(true);

    try {
      const result = await processComment({
        sectionId: sectionId as Id<"sections">,
        comment,
        elementInfo,
        model,
      });

      // If AI returned updated content, store for preview
      if (result.updatedContent) {
        setPreviewContent({
          sectionId,
          oldContent: currentSection.content,
          newContent: result.updatedContent,
        });
        setIsShowingNewContent(true); // Show new content by default
      }
    } catch (error) {
      console.error("Failed to process comment:", error);
      // On error, close everything
      handleClosePopover();
    } finally {
      // Stop processing - this will trigger transition to preview mode if previewContent is set
      setIsProcessing(false);
    }
  };

  // Preview handlers
  const handleTogglePreview = useCallback(() => {
    setIsShowingNewContent((prev) => !prev);
  }, []);

  const handleAcceptChanges = useCallback(async () => {
    if (!previewContent) return;

    setIsAccepting(true);
    try {
      // Save the new content to database
      await updateSection({
        id: previewContent.sectionId as Id<"sections">,
        content: previewContent.newContent,
      });
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsAccepting(false);
      // Clear preview and close popover
      setPreviewContent(null);
      handleClosePopover();
    }
  }, [previewContent, updateSection, handleClosePopover]);

  const handleRejectChanges = useCallback(() => {
    // Discard preview and close popover
    setPreviewContent(null);
    handleClosePopover();
  }, [handleClosePopover]);

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
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Page not found</EmptyTitle>
            <EmptyDescription>
              This landing page doesn&apos;t exist or you don&apos;t have access
              to it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
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
              <Empty className="h-96">
                <EmptyHeader>
                  <EmptyTitle>No sections yet</EmptyTitle>
                  <EmptyDescription>
                    This page is still being generated.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div>
                {sections.map((section: any) => {
                  // Use preview content if this section is being previewed
                  const isPreviewingThisSection = previewContent !== null && previewContent.sectionId === section._id;
                  const displayContent = isPreviewingThisSection
                    ? (isShowingNewContent ? previewContent.newContent : previewContent.oldContent)
                    : section.content;

                  return (
                    <SectionRenderer
                      key={section._id}
                      type={section.type}
                      content={displayContent}
                      theme={theme}
                      isCommentMode={selectedTool === "comment"}
                      selectedElement={selectedElement}
                      onElementClick={(element, event) =>
                        handleElementClick(element, section._id, section.type, event)
                      }
                    />
                  );
                })}
              </div>
            )}

            {/* Comment Popover - morphs into loading indicator when processing */}
            <CommentPopover
              isOpen={isPopoverOpen}
              onClose={handleClosePopover}
              onSubmit={handleCommentSubmit}
              targetElement={selectedElement}
              elementInfo={selectedElementInfo}
              clickPosition={clickPosition}
              isProcessing={isProcessing}
              previewMode={previewContent !== null}
              isAccepting={isAccepting}
              isShowingNewContent={isShowingNewContent}
              onTogglePreview={handleTogglePreview}
              onAcceptChanges={handleAcceptChanges}
              onRejectChanges={handleRejectChanges}
            />
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
            <HugeiconsIcon icon={CommentAdd02Icon} className="w-4 h-4" />
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
