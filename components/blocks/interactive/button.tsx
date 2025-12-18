"use client";

import React from "react";
import Link from "next/link";
import type { BlockRendererProps } from "../index";
import type { ButtonProps } from "@/lib/blocks/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function ButtonBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"button">) {
  const props = block.props as ButtonProps;

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = HugeIcons[iconName as keyof typeof HugeIcons];
    return IconComponent ? (
      <HugeiconsIcon icon={IconComponent} className="w-4 h-4" />
    ) : null;
  };

  const buttonStyle =
    props.variant === "default"
      ? { backgroundColor: theme.primaryColor }
      : undefined;

  const buttonContent = (
    <Button
      variant={props.variant || "default"}
      size={props.size || "default"}
      className={cn(
        props.fullWidth && "w-full",
        block.styleOverrides,
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={buttonStyle}
      onClick={isEditing ? (e) => { e.preventDefault(); e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {getIconComponent(props.iconStart)}
      {props.text}
      {getIconComponent(props.iconEnd)}
    </Button>
  );

  if (isEditing || !props.href) {
    return buttonContent;
  }

  return (
    <Link href={props.href} className={props.fullWidth ? "w-full" : ""}>
      {buttonContent}
    </Link>
  );
}
