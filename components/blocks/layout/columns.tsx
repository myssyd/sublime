"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { ColumnsProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const layoutClasses = {
  "1-1": "grid-cols-1 md:grid-cols-2",
  "1-2": "grid-cols-1 md:grid-cols-3 [&>*:first-child]:md:col-span-1 [&>*:last-child]:md:col-span-2",
  "2-1": "grid-cols-1 md:grid-cols-3 [&>*:first-child]:md:col-span-2 [&>*:last-child]:md:col-span-1",
  "1-1-1": "grid-cols-1 md:grid-cols-3",
  "1-2-1": "grid-cols-1 md:grid-cols-4 [&>*:nth-child(2)]:md:col-span-2",
  "2-1-1": "grid-cols-1 md:grid-cols-4 [&>*:first-child]:md:col-span-2",
  "1-1-2": "grid-cols-1 md:grid-cols-4 [&>*:last-child]:md:col-span-2",
};

const gapClasses = {
  none: "gap-0",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-12",
};

const alignClasses = {
  top: "items-start",
  center: "items-center",
  bottom: "items-end",
};

const stackOnClasses = {
  sm: "sm:grid-cols-1",
  md: "",
  lg: "lg:grid-cols-1",
  never: "",
};

export function ColumnsBlock({
  block,
  theme,
  children,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"columns">) {
  const props = block.props as ColumnsProps;

  return (
    <div
      className={cn(
        "grid w-full",
        layoutClasses[props.layout || "1-1"],
        gapClasses[props.gap || "md"],
        alignClasses[props.verticalAlign || "top"],
        props.stackOn && props.stackOn !== "never" && stackOnClasses[props.stackOn],
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
