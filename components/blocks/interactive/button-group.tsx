"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { ButtonGroupProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const alignClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
};

const directionClasses = {
  row: "flex-row",
  col: "flex-col",
};

const gapClasses = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

export function ButtonGroupBlock({
  block,
  theme,
  children,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"button-group">) {
  const props = block.props as ButtonGroupProps;

  return (
    <div
      className={cn(
        "flex flex-wrap",
        directionClasses[props.direction || "row"],
        alignClasses[props.align || "start"],
        gapClasses[props.gap || "md"],
        block.styleOverrides,
        isEditing && "relative",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2 rounded"
      )}
      style={{ fontFamily: theme.fontFamily }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {children}
    </div>
  );
}
