"use client";

import React, { useCallback, useState } from "react";
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
  useDroppable,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type {
  BlockComposition,
  BlockDefinition,
  BlockType,
  Theme,
} from "@/lib/blocks/types";
import { blockRegistry } from "@/lib/blocks/registry";
import { SingleBlockRenderer } from "@/components/blocks";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

// ============================================================================
// Types
// ============================================================================

interface BlockCanvasProps {
  composition: BlockComposition;
  theme: Theme;
  selectedBlockId: string | null;
  onBlockSelect: (blockId: string | null) => void;
  onCompositionChange: (composition: BlockComposition) => void;
  className?: string;
}

interface EditableBlockProps {
  block: BlockDefinition;
  composition: BlockComposition;
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
  onCompositionChange: (composition: BlockComposition) => void;
  depth?: number;
}

interface DropZoneProps {
  parentId: string;
  index: number;
  isActive: boolean;
}

// ============================================================================
// Drop Zone Component
// ============================================================================

function DropZone({ parentId, index, isActive }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone-${parentId}-${index}`,
    data: {
      type: "dropzone",
      parentId,
      index,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-2 -my-1 transition-all duration-200 rounded-sm",
        isActive && "h-6 my-1",
        isOver && "bg-primary/30",
        !isOver && isActive && "bg-primary/10"
      )}
    />
  );
}

// ============================================================================
// Editable Block Wrapper
// ============================================================================

function EditableBlock({
  block,
  composition,
  theme,
  isSelected,
  onSelect,
  onCompositionChange,
  depth = 0,
}: EditableBlockProps) {
  const meta = blockRegistry[block.type];
  const { setNodeRef, isOver } = useDroppable({
    id: `block-${block.id}`,
    data: {
      type: "block",
      blockId: block.id,
      accepts: meta?.canHaveChildren,
    },
  });

  const hasChildren = block.children && block.children.length > 0;
  const canHaveChildren = meta?.canHaveChildren ?? false;

  // Render children recursively
  const renderChildren = () => {
    if (!block.children || block.children.length === 0) {
      if (canHaveChildren) {
        // Show empty state for container blocks
        return (
          <div className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <DropZone parentId={block.id} index={0} isActive={true} />
            <p className="text-sm text-muted-foreground text-center py-4">
              Drop blocks here
            </p>
          </div>
        );
      }
      return null;
    }

    return (
      <>
        <DropZone parentId={block.id} index={0} isActive={false} />
        {block.children.map((childId, index) => {
          const childBlock = composition.blocks[childId];
          if (!childBlock) return null;

          return (
            <React.Fragment key={childId}>
              <EditableBlock
                block={childBlock}
                composition={composition}
                theme={theme}
                isSelected={false}
                onSelect={() => {}}
                onCompositionChange={onCompositionChange}
                depth={depth + 1}
              />
              <DropZone
                parentId={block.id}
                index={index + 1}
                isActive={false}
              />
            </React.Fragment>
          );
        })}
      </>
    );
  };

  // Get block preview content
  const renderBlockContent = () => {
    const IconComponent = meta?.icon
      ? HugeIcons[meta.icon as keyof typeof HugeIcons]
      : null;

    // For leaf blocks (no children), render a simplified preview
    if (!canHaveChildren) {
      return (
        <div className="flex items-center gap-2 p-3">
          {IconComponent && (
            <HugeiconsIcon
              icon={IconComponent}
              className="w-4 h-4 text-muted-foreground"
            />
          )}
          <span className="text-sm font-medium">{meta?.name || block.type}</span>
          {"text" in block.props && block.props.text ? (
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              - {String(block.props.text).substring(0, 50)}
            </span>
          ) : null}
          {"content" in block.props && block.props.content ? (
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              - {String(block.props.content).substring(0, 50)}
            </span>
          ) : null}
        </div>
      );
    }

    // For container blocks, render children
    return (
      <div className="p-2">
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          {IconComponent && (
            <HugeiconsIcon icon={IconComponent} className="w-3 h-3" />
          )}
          <span className="font-medium uppercase tracking-wider">
            {meta?.name || block.type}
          </span>
        </div>
        {renderChildren()}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "relative rounded-md border transition-all cursor-pointer",
        "hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary",
        !isSelected && "border-border/50",
        isOver && canHaveChildren && "bg-primary/5 border-primary",
        depth > 0 && "ml-4"
      )}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {renderBlockContent()}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded">
          {meta?.name || block.type}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Empty Canvas State
// ============================================================================

function EmptyCanvasState() {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-root",
    data: {
      type: "canvas-root",
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col items-center justify-center h-full min-h-[400px]",
        "border-2 border-dashed rounded-lg transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"
      )}
    >
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <HugeiconsIcon
            icon={HugeIcons.Layout03Icon}
            className="w-8 h-8 text-muted-foreground"
          />
        </div>
        <h3 className="text-lg font-medium mb-2">Start building your page</h3>
        <p className="text-sm text-muted-foreground max-w-[300px]">
          Drag blocks from the palette on the left and drop them here to start
          creating your page layout.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Block Canvas
// ============================================================================

export function BlockCanvas({
  composition,
  theme,
  selectedBlockId,
  onBlockSelect,
  onCompositionChange,
  className,
}: BlockCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Generate unique ID for new blocks
  const generateBlockId = (type: BlockType) => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id;
    setOverId(overId ? String(overId) : null);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle dropping a new block from palette
    if (activeData?.type === "palette-block") {
      const blockType = activeData.blockType as BlockType;
      const meta = blockRegistry[blockType];
      const newBlockId = generateBlockId(blockType);

      // Create new block (use type assertion for props from registry)
      const newBlock = {
        id: newBlockId,
        type: blockType,
        props: meta?.defaultProps || {},
        children: meta?.canHaveChildren ? [] : undefined,
      } as BlockDefinition;

      // Determine where to add the block
      if (overData?.type === "dropzone") {
        // Add to specific position in parent
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

        onCompositionChange(newComposition);
        onBlockSelect(newBlockId);
      } else if (overData?.type === "block" && overData.accepts) {
        // Add as child of container block
        const parentId = overData.blockId as string;

        const newComposition = { ...composition };
        newComposition.blocks = { ...newComposition.blocks };
        newComposition.blocks[newBlockId] = newBlock;

        const parentBlock = { ...newComposition.blocks[parentId] };
        parentBlock.children = [...(parentBlock.children || []), newBlockId];
        newComposition.blocks[parentId] = parentBlock;

        onCompositionChange(newComposition);
        onBlockSelect(newBlockId);
      } else if (overData?.type === "canvas-root") {
        // Create root block if empty
        if (!composition.root || !composition.blocks[composition.root]) {
          // First block becomes root - wrap in section if not already a section
          if (blockType !== "section") {
            const sectionId = generateBlockId("section");
            const sectionBlock = {
              id: sectionId,
              type: "section",
              props: blockRegistry.section.defaultProps,
              children: [newBlockId],
            } as BlockDefinition;

            onCompositionChange({
              root: sectionId,
              blocks: {
                [sectionId]: sectionBlock,
                [newBlockId]: newBlock,
              },
            });
            onBlockSelect(newBlockId);
          } else {
            onCompositionChange({
              root: newBlockId,
              blocks: {
                [newBlockId]: newBlock,
              },
            });
            onBlockSelect(newBlockId);
          }
        }
      }
    }
  };

  // Render drag overlay
  const renderDragOverlay = () => {
    if (!activeId) return null;

    // If dragging from palette
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
              <HugeiconsIcon icon={IconComponent} className="w-4 h-4 text-primary" />
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

  const hasContent =
    composition.root && composition.blocks[composition.root];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "relative bg-muted/30 rounded-lg overflow-auto",
          className
        )}
        onClick={() => onBlockSelect(null)}
      >
        <div className="p-4 min-h-[500px]">
          {hasContent ? (
            <EditableBlock
              block={composition.blocks[composition.root]}
              composition={composition}
              theme={theme}
              isSelected={selectedBlockId === composition.root}
              onSelect={() => onBlockSelect(composition.root)}
              onCompositionChange={onCompositionChange}
            />
          ) : (
            <EmptyCanvasState />
          )}
        </div>
      </div>

      <DragOverlay>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  );
}

// ============================================================================
// Live Preview Component
// ============================================================================

interface LivePreviewProps {
  composition: BlockComposition;
  theme: Theme;
  className?: string;
}

export function LivePreview({ composition, theme, className }: LivePreviewProps) {
  // Import BlockCompositionRenderer
  const { BlockCompositionRenderer } = require("@/components/blocks");

  if (!composition.root || !composition.blocks[composition.root]) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full min-h-[400px] bg-muted/10 rounded-lg",
          className
        )}
      >
        <p className="text-muted-foreground">No content to preview</p>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm overflow-auto", className)}>
      <BlockCompositionRenderer composition={composition} theme={theme} />
    </div>
  );
}
