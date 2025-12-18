"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { IconProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const sizeClasses = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export function IconBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"icon">) {
  const props = block.props as IconProps;

  const getColor = () => {
    switch (props.color) {
      case "primary":
        return theme.primaryColor;
      case "secondary":
        return theme.secondaryColor;
      case "accent":
        return theme.accentColor;
      case "muted":
        return `${theme.textColor}80`;
      default:
        return "currentColor";
    }
  };

  // Get icon from HugeIcons
  const iconName = props.name as keyof typeof HugeIcons;
  const IconComponent = HugeIcons[iconName];

  if (!IconComponent) {
    return (
      <div
        className={cn(
          sizeClasses[props.size || "md"],
          "bg-gray-200 rounded",
          block.styleOverrides,
          isEditing && isSelected && "ring-2 ring-blue-500"
        )}
        onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
        data-block-id={block.id}
        data-block-type={block.type}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2 rounded"
      )}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      <HugeiconsIcon
        icon={IconComponent}
        className={sizeClasses[props.size || "md"]}
        color={getColor()}
      />
    </div>
  );
}
