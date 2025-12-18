"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { HeadingProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const levelClasses = {
  1: "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
  2: "text-3xl md:text-4xl font-bold tracking-tight",
  3: "text-2xl md:text-3xl font-semibold",
  4: "text-xl md:text-2xl font-semibold",
  5: "text-lg md:text-xl font-medium",
  6: "text-base md:text-lg font-medium",
};

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function HeadingBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
  onDoubleClick,
}: BlockRendererProps<"heading">) {
  const props = block.props as HeadingProps;
  const Tag = `h${props.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <Tag
      className={cn(
        levelClasses[props.level],
        alignClasses[props.align || "left"],
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2 rounded"
      )}
      style={{
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      onDoubleClick={isEditing ? () => onDoubleClick?.(block.id) : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {props.text}
    </Tag>
  );
}
