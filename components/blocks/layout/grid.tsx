"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { GridProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const gapClasses = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-12",
};

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

function getColumnsClass(columns: GridProps["columns"]): string {
  if (typeof columns === "number") {
    return `grid-cols-1 md:grid-cols-${Math.min(columns, 4)} lg:grid-cols-${columns}`;
  }

  const parts: string[] = ["grid-cols-1"];
  if (columns?.sm) parts.push(`sm:grid-cols-${columns.sm}`);
  if (columns?.md) parts.push(`md:grid-cols-${columns.md}`);
  if (columns?.lg) parts.push(`lg:grid-cols-${columns.lg}`);
  if (columns?.xl) parts.push(`xl:grid-cols-${columns.xl}`);

  return parts.join(" ");
}

export function GridBlock({
  block,
  theme,
  children,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"grid">) {
  const props = block.props as GridProps;

  return (
    <div
      className={cn(
        "grid w-full",
        getColumnsClass(props.columns),
        gapClasses[props.gap || "md"],
        alignClasses[props.alignItems || "stretch"],
        block.styleOverrides,
        isEditing && "relative",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
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
