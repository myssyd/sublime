"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HugeiconsIcon } from "@hugeicons/react";
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface DraggableSectionProps {
  id: string;
  children: React.ReactNode;
  isSelected?: boolean;
}

export function DraggableSection({
  id,
  children,
  isSelected,
}: DraggableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "opacity-50 z-50",
        isSelected && "ring-2 ring-primary ring-inset"
      )}
    >
      {/* Drag handle - appears on hover */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute top-2 left-1/2 -translate-x-1/2 z-10",
          "flex items-center justify-center",
          "w-8 h-6 rounded-md",
          "bg-background/90 border shadow-sm",
          "cursor-grab active:cursor-grabbing",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          isDragging && "opacity-100"
        )}
      >
        <HugeiconsIcon
          icon={DragDropVerticalIcon}
          className="w-4 h-4 text-muted-foreground"
        />
      </div>
      {children}
    </div>
  );
}
