"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { DividerProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const spacingClasses = {
  sm: "my-4",
  md: "my-8",
  lg: "my-12",
};

const variantClasses = {
  solid: "border-solid",
  dashed: "border-dashed",
  dotted: "border-dotted",
};

export function DividerBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"divider">) {
  const props = block.props as DividerProps;
  const isVertical = props.orientation === "vertical";

  return (
    <div
      className={cn(
        isVertical ? "h-full w-px" : "w-full h-px",
        !isVertical && spacingClasses[props.spacing || "md"],
        "border-0",
        isVertical ? "border-l" : "border-t",
        variantClasses[props.variant || "solid"],
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500"
      )}
      style={{ borderColor: `${theme.textColor}20` }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    />
  );
}
