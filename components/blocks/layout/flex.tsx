"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { FlexProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const directionClasses = {
  row: "flex-row",
  col: "flex-col",
  "row-reverse": "flex-row-reverse",
  "col-reverse": "flex-col-reverse",
};

const gapClasses = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-12",
};

const justifyClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

export function FlexBlock({
  block,
  theme,
  children,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"flex">) {
  const props = block.props as FlexProps;

  return (
    <div
      className={cn(
        "flex w-full",
        directionClasses[props.direction || "row"],
        gapClasses[props.gap || "md"],
        justifyClasses[props.justify || "start"],
        alignClasses[props.align || "center"],
        props.wrap && "flex-wrap",
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
