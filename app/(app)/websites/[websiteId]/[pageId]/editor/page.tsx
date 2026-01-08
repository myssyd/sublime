"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import type { BlockComposition, BlockType, Theme } from "@/lib/blocks/types";
import { blockRegistry } from "@/lib/blocks/registry";
import {
  BlockPalette,
  BlockCanvas,
  BlockPropsPanel,
  BlockTreeView,
  LivePreview,
} from "@/components/block-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon,
  ArrowLeft02Icon,
  EyeIcon,
  PencilEdit02Icon,
  LayersIcon,
  Settings02Icon,
  Menu01Icon,
  GridIcon,
  SmartPhone01Icon,
  LaptopIcon,
  TabletConnectedWifiIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

type ViewMode = "edit" | "preview";
type Viewport = "desktop" | "tablet" | "mobile";
type LeftPanelTab = "blocks" | "layers";

// ============================================================================
// Block Editor Page
// ============================================================================

export default function BlockEditorPage({
  params,
}: {
  params: Promise<{ websiteId: string; pageId: string }>;
}) {
  const { websiteId, pageId } = use(params);
  const { data: session } = useSession();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>("blocks");

  // Selection state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Composition state (local for optimistic updates)
  const [localComposition, setLocalComposition] =
    useState<BlockComposition | null>(null);

  // Drag state for DnD between palette and canvas
  const [activeId, setActiveId] = useState<string | null>(null);

  // Queries
  const website = useQuery(
    api.websites.get,
    session ? { id: websiteId as Id<"websites"> } : "skip"
  );
  const page = useQuery(
    api.pages.get,
    session ? { id: pageId as Id<"pages"> } : "skip"
  );
  const sections = useQuery(
    api.pageSections.listByPage,
    session ? { pageId: pageId as Id<"pages"> } : "skip"
  );

  // Mutations
  const updateComposition = useMutation(api.pageSections.updateComposition);
  const createSection = useMutation(api.pageSections.create);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get the first section's composition (for now, single section per page)
  const currentSection = sections?.[0];
  const composition = localComposition || currentSection?.composition;

  // Default theme with proper typing
  const defaultTheme: Theme = {
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    accentColor: "#f59e0b",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    fontFamily: "Inter",
  };

  // Cast website theme to proper Theme type (borderRadius may need validation)
  const theme: Theme = website?.theme
    ? {
        ...website.theme,
        borderRadius: (website.theme.borderRadius as Theme["borderRadius"]) || undefined,
      }
    : defaultTheme;

  // Sync local composition with server
  useEffect(() => {
    if (currentSection?.composition && !localComposition) {
      setLocalComposition(currentSection.composition);
    }
  }, [currentSection?.composition, localComposition]);

  // Handle composition change with debounced save
  const handleCompositionChange = useCallback(
    (newComposition: BlockComposition) => {
      setLocalComposition(newComposition);

      // Debounce save to server
      if (currentSection) {
        const timeoutId = setTimeout(async () => {
          try {
            await updateComposition({
              id: currentSection._id as Id<"pageSections">,
              composition: newComposition,
            });
          } catch (error) {
            console.error("Failed to save composition:", error);
            toast.error("Failed to save changes");
          }
        }, 500);

        return () => clearTimeout(timeoutId);
      }
    },
    [currentSection, updateComposition]
  );

  // Generate unique ID for new blocks
  const generateBlockId = (type: BlockType) => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle DnD
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle dropping a new block from palette
    if (activeData?.type === "palette-block") {
      const blockType = activeData.blockType as BlockType;
      const meta = blockRegistry[blockType];
      const newBlockId = generateBlockId(blockType);

      // Create new block definition (use any for props since they come from registry)
      const newBlock = {
        id: newBlockId,
        type: blockType,
        props: meta?.defaultProps || {},
        children: meta?.canHaveChildren ? [] : undefined,
      } as BlockComposition["blocks"][string];

      // If no composition exists, create one
      if (!composition || !composition.root) {
        // Create initial composition with the dropped block
        let newComposition: BlockComposition;

        if (blockType === "section") {
          newComposition = {
            root: newBlockId,
            blocks: { [newBlockId]: newBlock } as BlockComposition["blocks"],
          };
        } else {
          // Wrap non-section blocks in a section
          const sectionId = generateBlockId("section");
          const sectionBlock = {
            id: sectionId,
            type: "section" as BlockType,
            props: blockRegistry.section.defaultProps,
            children: [newBlockId],
          } as BlockComposition["blocks"][string];

          newComposition = {
            root: sectionId,
            blocks: {
              [sectionId]: sectionBlock,
              [newBlockId]: newBlock,
            } as BlockComposition["blocks"],
          };
        }

        // Create section if doesn't exist
        if (!currentSection) {
          try {
            await createSection({
              pageId: pageId as Id<"pages">,
              name: "Main Section",
              composition: newComposition,
            });
            setLocalComposition(newComposition);
            setSelectedBlockId(newBlockId);
          } catch (error) {
            console.error("Failed to create section:", error);
            toast.error("Failed to create section");
          }
        } else {
          handleCompositionChange(newComposition);
          setSelectedBlockId(newBlockId);
        }
        return;
      }

      // Add to existing composition
      if (overData?.type === "dropzone") {
        const parentId = overData.parentId as string;
        const index = overData.index as number;

        const newComposition = { ...composition };
        newComposition.blocks = { ...newComposition.blocks };
        newComposition.blocks[newBlockId] = newBlock;

        const parentBlock = { ...newComposition.blocks[parentId] };
        const children = [...(parentBlock.children || [])];
        children.splice(index, 0, newBlockId);
        parentBlock.children = children;
        newComposition.blocks[parentId] = parentBlock;

        handleCompositionChange(newComposition);
        setSelectedBlockId(newBlockId);
      } else if (overData?.type === "block" && overData.accepts) {
        const parentId = overData.blockId as string;

        const newComposition = { ...composition };
        newComposition.blocks = { ...newComposition.blocks };
        newComposition.blocks[newBlockId] = newBlock;

        const parentBlock = { ...newComposition.blocks[parentId] };
        parentBlock.children = [...(parentBlock.children || []), newBlockId];
        newComposition.blocks[parentId] = parentBlock;

        handleCompositionChange(newComposition);
        setSelectedBlockId(newBlockId);
      } else if (overData?.type === "canvas-root") {
        // Add to root section
        const rootBlock = composition.blocks[composition.root];
        if (rootBlock && blockRegistry[rootBlock.type as BlockType]?.canHaveChildren) {
          const newComposition = { ...composition };
          newComposition.blocks = { ...newComposition.blocks };
          newComposition.blocks[newBlockId] = newBlock;

          const updatedRoot = { ...rootBlock };
          updatedRoot.children = [...(updatedRoot.children || []), newBlockId];
          newComposition.blocks[composition.root] = updatedRoot;

          handleCompositionChange(newComposition);
          setSelectedBlockId(newBlockId);
        }
      }
    }
  };

  // Render drag overlay
  const renderDragOverlay = () => {
    if (!activeId) return null;

    if (activeId.startsWith("palette-")) {
      const blockType = activeId.replace("palette-", "") as BlockType;
      const meta = blockRegistry[blockType];
      const IconComponent = meta?.icon
        ? HugeIcons[meta.icon as keyof typeof HugeIcons]
        : null;

      return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card shadow-lg">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            {IconComponent && (
              <HugeiconsIcon
                icon={IconComponent}
                className="w-4 h-4 text-primary"
              />
            )}
          </div>
          <div>
            <div className="text-sm font-medium">{meta?.name || blockType}</div>
            <div className="text-xs text-muted-foreground">
              {meta?.description}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Viewport width classes
  const viewportClasses = {
    desktop: "w-full",
    tablet: "max-w-[768px]",
    mobile: "max-w-[375px]",
  };

  // Loading state
  if (website === undefined || page === undefined) {
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

  // Not found state
  if (website === null || page === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-muted-foreground mb-4">
            This page doesn't exist or you don't have access to it.
          </p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <Link
              href={`/websites/${websiteId}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} className="w-4 h-4" />
              <span className="text-sm">{website.name}</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-sm font-medium">{page.name}</h1>
          </div>

          {/* Center: View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as ViewMode)}
            >
              <TabsList className="h-8">
                <TabsTrigger value="edit" className="text-xs px-3 h-7">
                  <HugeiconsIcon icon={PencilEdit02Icon} className="w-3 h-3 mr-1" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs px-3 h-7">
                  <HugeiconsIcon icon={EyeIcon} className="w-3 h-3 mr-1" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Right: Viewport & Actions */}
          <div className="flex items-center gap-2">
            {/* Viewport Selector */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewport === "desktop" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewport("desktop")}
              >
                <HugeiconsIcon icon={LaptopIcon} className="w-4 h-4" />
              </Button>
              <Button
                variant={viewport === "tablet" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewport("tablet")}
              >
                <HugeiconsIcon icon={TabletConnectedWifiIcon} className="w-4 h-4" />
              </Button>
              <Button
                variant={viewport === "mobile" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewport("mobile")}
              >
                <HugeiconsIcon icon={SmartPhone01Icon} className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-4 w-px bg-border" />

            <Button size="sm" className="h-8">
              Publish
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "edit" ? (
            <div className="flex h-full">
              {/* Left Panel: Blocks/Layers */}
              <div className="w-64 border-r flex flex-col bg-background">
                {/* Panel Tabs */}
                <div className="flex items-center border-b p-1">
                  <Button
                    variant={leftPanelTab === "blocks" ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-1 h-8"
                    onClick={() => setLeftPanelTab("blocks")}
                  >
                    <HugeiconsIcon icon={GridIcon} className="w-4 h-4 mr-1" />
                    Blocks
                  </Button>
                  <Button
                    variant={leftPanelTab === "layers" ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-1 h-8"
                    onClick={() => setLeftPanelTab("layers")}
                  >
                    <HugeiconsIcon icon={LayersIcon} className="w-4 h-4 mr-1" />
                    Layers
                  </Button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-hidden">
                  {leftPanelTab === "blocks" ? (
                    <BlockPalette className="h-full" />
                  ) : (
                    composition && (
                      <BlockTreeView
                        composition={composition}
                        selectedBlockId={selectedBlockId}
                        onBlockSelect={setSelectedBlockId}
                        onCompositionChange={handleCompositionChange}
                        className="h-full"
                      />
                    )
                  )}
                </div>
              </div>

              {/* Center: Canvas */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto bg-muted/30 p-4">
                  <div
                    className={cn(
                      "mx-auto transition-all duration-300",
                      viewportClasses[viewport]
                    )}
                  >
                    {composition ? (
                      <BlockCanvas
                        composition={composition}
                        theme={theme}
                        selectedBlockId={selectedBlockId}
                        onBlockSelect={setSelectedBlockId}
                        onCompositionChange={handleCompositionChange}
                        className="min-h-[600px]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[600px] border-2 border-dashed rounded-lg bg-background">
                        <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                          <HugeiconsIcon
                            icon={HugeIcons.Layout03Icon}
                            className="w-8 h-8 text-muted-foreground"
                          />
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          Start building your page
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-[300px] text-center">
                          Drag blocks from the left panel and drop them here to
                          start creating your page layout.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel: Properties */}
              <div className="w-72 border-l bg-background">
                <BlockPropsPanel
                  composition={composition || { root: "", blocks: {} }}
                  selectedBlockId={selectedBlockId}
                  onCompositionChange={handleCompositionChange}
                  onBlockSelect={setSelectedBlockId}
                  className="h-full"
                />
              </div>
            </div>
          ) : (
            // Preview Mode
            <div className="h-full overflow-auto bg-muted/30 p-4">
              <div
                className={cn(
                  "mx-auto transition-all duration-300 bg-white rounded-lg shadow-lg overflow-hidden",
                  viewportClasses[viewport]
                )}
              >
                {composition ? (
                  <LivePreview
                    composition={composition}
                    theme={theme}
                    className="min-h-[600px]"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[600px]">
                    <p className="text-muted-foreground">No content to preview</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <DragOverlay>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  );
}
