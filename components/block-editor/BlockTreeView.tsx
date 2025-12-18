"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { BlockComposition, BlockDefinition } from "@/lib/blocks/types";
import { blockRegistry } from "@/lib/blocks/registry";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  MoreHorizontalIcon,
  Delete02Icon,
  Copy01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

interface BlockTreeViewProps {
  composition: BlockComposition;
  selectedBlockId: string | null;
  onBlockSelect: (blockId: string | null) => void;
  onCompositionChange: (composition: BlockComposition) => void;
  className?: string;
}

interface TreeNodeProps {
  blockId: string;
  block: BlockDefinition;
  composition: BlockComposition;
  selectedBlockId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (blockId: string) => void;
  onBlockSelect: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: "up" | "down") => void;
  onDuplicateBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  depth?: number;
  isRoot?: boolean;
}

// ============================================================================
// Tree Node Component
// ============================================================================

function TreeNode({
  blockId,
  block,
  composition,
  selectedBlockId,
  expandedIds,
  onToggleExpand,
  onBlockSelect,
  onMoveBlock,
  onDuplicateBlock,
  onDeleteBlock,
  depth = 0,
  isRoot = false,
}: TreeNodeProps) {
  const meta = blockRegistry[block.type];
  const hasChildren = block.children && block.children.length > 0;
  const isExpanded = expandedIds.has(blockId);
  const isSelected = selectedBlockId === blockId;

  const IconComponent = meta?.icon
    ? HugeIcons[meta.icon as keyof typeof HugeIcons]
    : null;

  // Find parent to check if we can move
  const findParent = (): { parentId: string; index: number } | null => {
    for (const [id, b] of Object.entries(composition.blocks)) {
      if (b.children?.includes(blockId)) {
        return { parentId: id, index: b.children.indexOf(blockId) };
      }
    }
    return null;
  };

  const parent = findParent();
  const parentBlock = parent ? composition.blocks[parent.parentId] : null;
  const canMoveUp = parent && parent.index > 0;
  const canMoveDown =
    parent && parentBlock?.children && parent.index < parentBlock.children.length - 1;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onBlockSelect(blockId)}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(blockId);
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            <HugeiconsIcon
              icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
              className="w-3 h-3 text-muted-foreground"
            />
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Block Icon */}
        {IconComponent && (
          <HugeiconsIcon
            icon={IconComponent}
            className={cn(
              "w-4 h-4",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}

        {/* Block Name */}
        <span
          className={cn(
            "flex-1 text-sm truncate",
            isSelected && "font-medium"
          )}
        >
          {meta?.name || block.type}
        </span>

        {/* Child Count */}
        {hasChildren && (
          <span className="text-xs text-muted-foreground">
            {block.children?.length}
          </span>
        )}

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                className="w-4 h-4 text-muted-foreground"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {canMoveUp && (
              <DropdownMenuItem onClick={() => onMoveBlock(blockId, "up")}>
                <HugeiconsIcon icon={ArrowUp01Icon} className="w-4 h-4 mr-2" />
                Move Up
              </DropdownMenuItem>
            )}
            {canMoveDown && (
              <DropdownMenuItem onClick={() => onMoveBlock(blockId, "down")}>
                <HugeiconsIcon icon={ArrowDown01Icon} className="w-4 h-4 mr-2" />
                Move Down
              </DropdownMenuItem>
            )}
            {(canMoveUp || canMoveDown) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => onDuplicateBlock(blockId)}>
              <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            {!isRoot && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeleteBlock(blockId)}
                  className="text-destructive focus:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {block.children?.map((childId) => {
            const childBlock = composition.blocks[childId];
            if (!childBlock) return null;

            return (
              <TreeNode
                key={childId}
                blockId={childId}
                block={childBlock}
                composition={composition}
                selectedBlockId={selectedBlockId}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onBlockSelect={onBlockSelect}
                onMoveBlock={onMoveBlock}
                onDuplicateBlock={onDuplicateBlock}
                onDeleteBlock={onDeleteBlock}
                depth={depth + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Block Tree View
// ============================================================================

export function BlockTreeView({
  composition,
  selectedBlockId,
  onBlockSelect,
  onCompositionChange,
  className,
}: BlockTreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Expand all by default
    const ids = new Set<string>();
    const expandAll = (blockId: string) => {
      ids.add(blockId);
      const block = composition.blocks[blockId];
      block?.children?.forEach(expandAll);
    };
    if (composition.root) {
      expandAll(composition.root);
    }
    return ids;
  });

  const handleToggleExpand = (blockId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  const handleMoveBlock = (blockId: string, direction: "up" | "down") => {
    const newComposition = { ...composition };
    newComposition.blocks = { ...newComposition.blocks };

    // Find parent
    for (const [parentId, block] of Object.entries(newComposition.blocks)) {
      if (block.children?.includes(blockId)) {
        const children = [...block.children];
        const currentIndex = children.indexOf(blockId);
        const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (newIndex >= 0 && newIndex < children.length) {
          // Swap
          [children[currentIndex], children[newIndex]] = [
            children[newIndex],
            children[currentIndex],
          ];

          newComposition.blocks[parentId] = {
            ...block,
            children,
          };

          onCompositionChange(newComposition);
        }
        break;
      }
    }
  };

  const handleDuplicateBlock = (blockId: string) => {
    const block = composition.blocks[blockId];
    if (!block) return;

    const generateId = (type: string) =>
      `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create mapping for new IDs
    const idMap: Record<string, string> = {};
    const collectIds = (id: string) => {
      const b = composition.blocks[id];
      idMap[id] = generateId(b.type);
      b.children?.forEach(collectIds);
    };
    collectIds(blockId);

    // Clone blocks with new IDs
    const newComposition = { ...composition };
    newComposition.blocks = { ...newComposition.blocks };

    const cloneBlock = (id: string): BlockDefinition => {
      const b = composition.blocks[id];
      return {
        ...b,
        id: idMap[id],
        children: b.children?.map((childId) => idMap[childId]),
      };
    };

    // Add cloned blocks
    Object.keys(idMap).forEach((oldId) => {
      newComposition.blocks[idMap[oldId]] = cloneBlock(oldId);
    });

    // Add to parent's children
    for (const [id, b] of Object.entries(newComposition.blocks)) {
      if (b.children?.includes(blockId)) {
        const index = b.children.indexOf(blockId);
        newComposition.blocks[id] = {
          ...b,
          children: [
            ...b.children.slice(0, index + 1),
            idMap[blockId],
            ...b.children.slice(index + 1),
          ],
        };
        break;
      }
    }

    onCompositionChange(newComposition);
    onBlockSelect(idMap[blockId]);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (blockId === composition.root) return;

    const newComposition = { ...composition };
    newComposition.blocks = { ...newComposition.blocks };

    // Remove from parent's children
    for (const [id, block] of Object.entries(newComposition.blocks)) {
      if (block.children?.includes(blockId)) {
        newComposition.blocks[id] = {
          ...block,
          children: block.children.filter((c) => c !== blockId),
        };
        break;
      }
    }

    // Remove the block and its descendants
    const removeBlockAndChildren = (id: string) => {
      const block = newComposition.blocks[id];
      block?.children?.forEach(removeBlockAndChildren);
      delete newComposition.blocks[id];
    };
    removeBlockAndChildren(blockId);

    onCompositionChange(newComposition);
    if (selectedBlockId === blockId) {
      onBlockSelect(null);
    }
  };

  const rootBlock = composition.root
    ? composition.blocks[composition.root]
    : null;

  if (!rootBlock) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-3 border-b">
          <h3 className="text-sm font-semibold">Layers</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            No blocks yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold">Layers</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 group">
        <TreeNode
          blockId={composition.root}
          block={rootBlock}
          composition={composition}
          selectedBlockId={selectedBlockId}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          onBlockSelect={onBlockSelect}
          onMoveBlock={handleMoveBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onDeleteBlock={handleDeleteBlock}
          isRoot
        />
      </div>
    </div>
  );
}
