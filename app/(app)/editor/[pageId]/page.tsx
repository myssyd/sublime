"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/auth-client";
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  BottomToolbar,
  ViewportMode,
  ToolType,
} from "@/components/editor/bottom-toolbar";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { ChatSidebar } from "@/components/editor/chat-sidebar";
import { DraggableSection } from "@/components/editor/draggable-section";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon,
  Cursor01Icon,
  CommentAdd02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

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

  // Viewport and tool state
  const [viewportMode, setViewportMode] = useState<ViewportMode>("desktop");
  const [selectedTool, setSelectedTool] = useState<ToolType>("cursor");

  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);

  // Element-level selection state
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  );
  const [selectedElementInfo, setSelectedElementInfo] = useState<string>("");
  const [selectedElementSectionId, setSelectedElementSectionId] = useState<
    string | null
  >(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<
    { x: number; y: number } | undefined
  >(undefined);

  // Processing state for AI comment handling
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatProcessing, setIsChatProcessing] = useState(false);

  // Preview state for AI-generated changes
  const [previewContent, setPreviewContent] = useState<{
    sectionId: string;
    oldContent: unknown;
    newContent: unknown;
  } | null>(null);
  const [isShowingNewContent, setIsShowingNewContent] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  // Local theme state for optimistic updates
  const [localTheme, setLocalTheme] = useState<Theme | null>(null);
  const themeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // AI action for processing comments
  const processComment = useAction(api.agents.actions.processComment);

  // Queries
  const page = useQuery(
    api.landingPages.get,
    session ? { id: pageId as Id<"landingPages"> } : "skip"
  );
  const sections = useQuery(
    api.sections.listByPage,
    session ? { landingPageId: pageId as Id<"landingPages"> } : "skip"
  );

  // Mutations
  const updateSection = useMutation(api.sections.update);
  const updatePage = useMutation(api.landingPages.update);
  const reorderSections = useMutation(api.sections.reorder);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Tool change handler with toast notification
  const handleToolChange = useCallback(
    (tool: ToolType) => {
      if (tool === selectedTool) return;

      setSelectedTool(tool);

      const toolConfig = {
        cursor: { name: "Select", icon: Cursor01Icon, shortcut: "V" },
        comment: { name: "Comment", icon: CommentAdd02Icon, shortcut: "C" },
      };

      const config = toolConfig[tool];
      toast(
        <div className="flex items-center gap-2">
          <span>{config.name}</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded border border-border">
            {config.shortcut}
          </kbd>
        </div>,
        {
          id: "tool-switch",
          icon: <HugeiconsIcon icon={config.icon} className="w-3.5 h-3.5" />,
          position: "bottom-center",
          duration: 800,
          style: {
            marginBottom: "56px",
            padding: "8px 12px",
            fontSize: "13px",
            minHeight: "unset",
            width: "auto",
            maxWidth: "fit-content",
            left: "50%",
            transform: "translateX(-50%)",
          },
        }
      );
    },
    [selectedTool]
  );

  // Keyboard shortcuts
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
          handleToolChange("cursor");
          break;
        case "c":
          handleToolChange("comment");
          break;
        case "s":
          setIsSidebarOpen((prev) => !prev);
          break;
        case "/":
          event.preventDefault();
          setIsChatOpen(true);
          break;
        case "escape":
          setIsChatOpen(false);
          setIsPopoverOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToolChange]);

  const handleElementClick = useCallback(
    (
      element: HTMLElement,
      sectionId: string,
      sectionType: string,
      event: React.MouseEvent
    ) => {
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

  // Helper function to recursively replace text in an object
  const replaceTextInContent = useCallback(
    (content: unknown, oldText: string, newText: string): unknown => {
      if (typeof content === "string") {
        // Direct string replacement
        if (content === oldText) {
          return newText;
        }
        return content;
      }

      if (Array.isArray(content)) {
        return content.map((item) =>
          replaceTextInContent(item, oldText, newText)
        );
      }

      if (typeof content === "object" && content !== null) {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(content)) {
          result[key] = replaceTextInContent(value, oldText, newText);
        }
        return result;
      }

      return content;
    },
    []
  );

  const handleTextEdit = useCallback(
    async (sectionId: string, oldText: string, newText: string) => {
      if (!sections) return;

      const section = sections.find(
        (s: { _id: string }) => s._id === sectionId
      );
      if (!section) return;

      // Replace the old text with new text in the section content
      const updatedContent = replaceTextInContent(
        section.content,
        oldText,
        newText
      );

      // Update the section
      await updateSection({
        id: sectionId as Id<"sections">,
        content: updatedContent,
      });
    },
    [sections, replaceTextInContent, updateSection]
  );

  const handleCommentSubmit = async (comment: string, model: string) => {
    if (!selectedElement || !selectedElementSectionId || !sections) return;

    const sectionId = selectedElementSectionId;
    const elementInfo = selectedElementInfo;

    // Find the current section content
    const currentSection = sections.find(
      (s: { _id: string }) => s._id === sectionId
    );
    if (!currentSection) return;

    // Start processing
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
        setIsShowingNewContent(true);
      }
    } catch (error) {
      console.error("Failed to process comment:", error);
      // Don't close popover - treat error as rejection and let user try again
    } finally {
      setIsProcessing(false);
    }
  };

  // Page chat action
  const processPageChat = useAction(api.agents.actions.processPageChat);

  // Chat submit handler
  const handleChatSubmit = async (message: string, model: string) => {
    if (!page || !sections) return;

    setIsChatProcessing(true);

    try {
      const result = await processPageChat({
        landingPageId: pageId as Id<"landingPages">,
        message,
        model,
      });

      // Apply updated sections if any
      if (result.updatedSections) {
        for (const update of result.updatedSections) {
          await updateSection({
            id: update.sectionId as Id<"sections">,
            content: update.updatedContent,
          });
        }
      }

      // Apply updated theme if any
      if (result.updatedTheme) {
        await updatePage({
          id: pageId as Id<"landingPages">,
          theme: result.updatedTheme,
        });
      }

      return result;
    } catch (error) {
      console.error("Failed to process chat:", error);
      throw error;
    } finally {
      setIsChatProcessing(false);
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
      await updateSection({
        id: previewContent.sectionId as Id<"sections">,
        content: previewContent.newContent,
      });
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsAccepting(false);
      setPreviewContent(null);
      handleClosePopover();
    }
  }, [previewContent, updateSection, handleClosePopover]);

  const handleRejectChanges = useCallback(() => {
    setPreviewContent(null);
  }, []);

  // Sync local theme from server when page loads or server theme changes
  useEffect(() => {
    if (page?.theme && !localTheme) {
      setLocalTheme(page.theme);
    }
  }, [page?.theme, localTheme]);

  // Theme change handler with optimistic updates
  const handleThemeChange = useCallback(
    (updates: Partial<Theme>) => {
      const currentTheme = localTheme || page?.theme;
      if (!currentTheme) return;

      // Update local state immediately (optimistic)
      const newTheme = { ...currentTheme, ...updates };
      setLocalTheme(newTheme);

      // Debounce the server update
      if (themeDebounceRef.current) {
        clearTimeout(themeDebounceRef.current);
      }

      themeDebounceRef.current = setTimeout(() => {
        updatePage({
          id: pageId as Id<"landingPages">,
          theme: newTheme,
        });
      }, 300); // 300ms debounce
    },
    [localTheme, page?.theme, pageId, updatePage]
  );

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id || !sections) return;

    const oldIndex = sections.findIndex(
      (s: { _id: string }) => s._id === active.id
    );
    const newIndex = sections.findIndex(
      (s: { _id: string }) => s._id === over.id
    );

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(
        sections.map((s: { _id: string }) => s._id),
        oldIndex,
        newIndex
      );

      await reorderSections({
        landingPageId: pageId as Id<"landingPages">,
        sectionIds: newOrder as Id<"sections">[],
      });
    }
  };

  if (page === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <HugeiconsIcon
          icon={Loading03Icon}
          className="w-8 h-8 text-muted-foreground animate-spin"
          style={{ animationDuration: "0.5s" }}
        />
      </div>
    );
  }

  if (page === null) {
    return (
      <div className="flex h-screen items-center justify-center">
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

  // Use local theme for instant updates, fall back to server theme
  const theme: Theme = localTheme || page.theme;

  const viewportClasses = {
    desktop: "w-full max-w-full mx-auto",
    tablet: "w-full max-w-[768px] mx-auto",
    mobile: "w-full max-w-[375px] mx-auto",
  };

  const sectionIds = sections?.map((s: { _id: string }) => s._id) || [];
  const activeDragSection = activeId
    ? sections?.find((s: { _id: string }) => s._id === activeId)
    : null;

  return (
    <div className="flex h-screen flex-col">
      {/* Preview pane */}
      <div className="flex-1 overflow-auto bg-muted/30 py-4 px-2">
        <div className="flex gap-0 h-full">
          {/* Page preview */}
          <div
            className={`${viewportClasses[viewportMode]} transition-all duration-300 rounded-lg overflow-y-auto shadow-xl`}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sectionIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div>
                    {sections.map(
                      (section: {
                        _id: string;
                        type: string;
                        content: unknown;
                      }) => {
                        // Use preview content if this section is being previewed
                        const isPreviewingThisSection =
                          previewContent !== null &&
                          previewContent.sectionId === section._id;
                        const displayContent = isPreviewingThisSection
                          ? isShowingNewContent
                            ? previewContent.newContent
                            : previewContent.oldContent
                          : section.content;

                        return (
                          <DraggableSection
                            key={section._id}
                            id={section._id}
                            isSelected={selectedSectionId === section._id}
                          >
                            <SectionRenderer
                              type={section.type}
                              content={displayContent}
                              theme={theme}
                              isCommentMode={selectedTool === "comment"}
                              isSelectMode={selectedTool === "cursor"}
                              onElementClick={(element, event) =>
                                handleElementClick(
                                  element,
                                  section._id,
                                  section.type,
                                  event
                                )
                              }
                              onTextEdit={(oldText, newText) =>
                                handleTextEdit(section._id, oldText, newText)
                              }
                            />
                          </DraggableSection>
                        );
                      }
                    )}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeDragSection ? (
                    <div className="opacity-80 shadow-2xl rounded-lg overflow-hidden">
                      <SectionRenderer
                        type={activeDragSection.type}
                        content={activeDragSection.content}
                        theme={theme}
                        isCommentMode={false}
                        isSelectMode={false}
                        onElementClick={() => {}}
                        onTextEdit={() => {}}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {/* Comment Popover */}
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

          {/* Right Sidebar */}
          <RightSidebar
            isOpen={isSidebarOpen}
            sections={sections || []}
            selectedSectionId={selectedSectionId}
            onSectionSelect={setSelectedSectionId}
            theme={theme}
            onThemeChange={handleThemeChange}
          />
        </div>
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSubmit={handleChatSubmit}
        isProcessing={isChatProcessing}
      />

      {/* Bottom Toolbar */}
      <BottomToolbar
        pageName={page.name}
        viewportMode={viewportMode}
        onViewportChange={setViewportMode}
        selectedTool={selectedTool}
        onToolChange={handleToolChange}
        isChatOpen={isChatOpen}
        onChatToggle={() => setIsChatOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
    </div>
  );
}
