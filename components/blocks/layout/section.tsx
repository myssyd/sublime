"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { SectionProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
  none: "",
};

const paddingClasses = {
  none: "",
  sm: "px-4 py-8",
  md: "px-6 py-12",
  lg: "px-8 py-16",
  xl: "px-12 py-24",
};

export function SectionBlock({
  block,
  theme,
  children,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"section">) {
  const props = block.props as SectionProps;
  const Tag = props.as || "section";

  const getBackgroundStyle = () => {
    switch (props.background) {
      case "primary":
        return { backgroundColor: theme.primaryColor };
      case "secondary":
        return { backgroundColor: theme.secondaryColor };
      case "accent":
        return { backgroundColor: theme.accentColor };
      case "muted":
        return { backgroundColor: `${theme.textColor}10` };
      case "custom":
        return { backgroundColor: props.customBackground };
      default:
        return {};
    }
  };

  return (
    <Tag
      className={cn(
        "w-full",
        paddingClasses[props.padding || "lg"],
        block.styleOverrides,
        isEditing && "relative",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{
        ...getBackgroundStyle(),
        fontFamily: theme.fontFamily,
      }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      <div
        className={cn(
          "mx-auto w-full",
          maxWidthClasses[props.maxWidth || "xl"]
        )}
      >
        {children}
      </div>
    </Tag>
  );
}
