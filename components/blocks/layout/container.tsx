"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { ContainerProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
};

export function ContainerBlock({
  block,
  theme,
  children,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"container">) {
  const props = block.props as ContainerProps;
  const Tag = props.as || "div";

  return (
    <Tag
      className={cn(
        "w-full",
        maxWidthClasses[props.maxWidth || "xl"],
        paddingClasses[props.padding || "md"],
        props.centered && "mx-auto",
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
    </Tag>
  );
}
