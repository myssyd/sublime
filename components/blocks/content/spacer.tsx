"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { SpacerProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "h-2",
  sm: "h-4",
  md: "h-8",
  lg: "h-16",
  xl: "h-24",
  "2xl": "h-32",
};

export function SpacerBlock({
  block,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"spacer">) {
  const props = block.props as SpacerProps;

  return (
    <div
      className={cn(
        "w-full",
        sizeClasses[props.size || "md"],
        block.styleOverrides,
        isEditing && "bg-gray-100 border border-dashed border-gray-300 cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500"
      )}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    />
  );
}
