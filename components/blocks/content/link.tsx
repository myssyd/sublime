"use client";

import React from "react";
import Link from "next/link";
import type { BlockRendererProps } from "../index";
import type { LinkProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const variantClasses = {
  default: "text-current hover:opacity-80 transition-opacity",
  underline: "underline underline-offset-4 hover:no-underline transition-all",
  muted: "opacity-70 hover:opacity-100 transition-opacity",
};

export function LinkBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"link">) {
  const props = block.props as LinkProps;

  const linkContent = (
    <span
      className={cn(
        variantClasses[props.variant || "default"],
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2 rounded"
      )}
      style={{ color: theme.primaryColor }}
    >
      {props.text}
    </span>
  );

  if (isEditing) {
    return (
      <span
        onClick={(e) => { e.stopPropagation(); onSelect?.(block.id); }}
        data-block-id={block.id}
        data-block-type={block.type}
      >
        {linkContent}
      </span>
    );
  }

  if (props.isExternal) {
    return (
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        data-block-id={block.id}
        data-block-type={block.type}
      >
        {linkContent}
      </a>
    );
  }

  return (
    <Link
      href={props.href}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {linkContent}
    </Link>
  );
}
