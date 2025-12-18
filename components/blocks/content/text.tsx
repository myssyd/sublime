"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { TextProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function TextBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
  onDoubleClick,
}: BlockRendererProps<"text">) {
  const props = block.props as TextProps;
  const Tag = props.as || "p";

  return (
    <Tag
      className={cn(
        sizeClasses[props.size || "base"],
        alignClasses[props.align || "left"],
        props.muted && "opacity-70",
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
