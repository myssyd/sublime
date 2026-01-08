"use client";

import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { blockRegistry, blockCategories, getBlocksByCategory } from "@/lib/blocks/registry";
import type { BlockType, BlockCategory } from "@/lib/blocks/types";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@/components/ui/input";
import { Search01Icon } from "@hugeicons/core-free-icons";

// ============================================================================
// Draggable Block Item
// ============================================================================

interface DraggableBlockProps {
  type: BlockType;
  name: string;
  icon: string;
  description: string;
}

function DraggableBlock({ type, name, icon, description }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      type: "palette-block",
      blockType: type,
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const IconComponent = HugeIcons[icon as keyof typeof HugeIcons];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card cursor-grab",
        "hover:border-primary/50 hover:bg-accent/50 transition-colors",
        isDragging && "opacity-50 cursor-grabbing shadow-lg"
      )}
    >
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        {IconComponent && (
          <HugeiconsIcon icon={IconComponent} className="w-4 h-4 text-primary" />
        )}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{name}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Block Palette
// ============================================================================

interface BlockPaletteProps {
  className?: string;
}

export function BlockPalette({ className }: BlockPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<BlockCategory>>(
    new Set(["layout", "content", "interactive", "composite"])
  );

  const toggleCategory = (category: BlockCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredBlocks = Object.values(blockRegistry).filter((block) =>
    searchQuery
      ? block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const getBlocksForCategory = (categoryId: BlockCategory) =>
    filteredBlocks.filter((block) => block.category === categoryId);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <Input
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {blockCategories.map((category) => {
          const blocks = getBlocksForCategory(category.id);
          if (blocks.length === 0) return null;

          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex items-center justify-between w-full text-left mb-2 group"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {blocks.length}
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <DraggableBlock
                      key={block.type}
                      type={block.type}
                      name={block.name}
                      icon={block.icon}
                      description={block.description}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredBlocks.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No blocks found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compact Block Palette (for sidebar)
// ============================================================================

export function CompactBlockPalette({ className }: BlockPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>("layout");

  const blocks = getBlocksByCategory(activeCategory);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Category Tabs */}
      <div className="flex border-b">
        {blockCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              activeCategory === category.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Blocks Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {blocks.map((block) => {
            const IconComponent = HugeIcons[block.icon as keyof typeof HugeIcons];

            return (
              <DraggableBlock
                key={block.type}
                type={block.type}
                name={block.name}
                icon={block.icon}
                description={block.description}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
