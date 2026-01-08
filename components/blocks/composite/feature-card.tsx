"use client";

import React from "react";
import Link from "next/link";
import type { BlockRendererProps } from "../index";
import type { FeatureCardProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function FeatureCardBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"feature-card">) {
  const props = block.props as FeatureCardProps;

  const IconComponent = HugeIcons[props.icon as keyof typeof HugeIcons];

  const content = (
    <div
      className={cn(
        "p-6 rounded-lg border bg-card text-card-foreground",
        "hover:shadow-md transition-shadow",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{ fontFamily: theme.fontFamily }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: `${theme.primaryColor}15` }}
      >
        {IconComponent && (
          <HugeiconsIcon
            icon={IconComponent}
            className="w-6 h-6"
            color={theme.primaryColor}
          />
        )}
      </div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: theme.textColor }}
      >
        {props.title}
      </h3>
      <p className="text-sm opacity-70" style={{ color: theme.textColor }}>
        {props.description}
      </p>
    </div>
  );

  if (isEditing || !props.href) {
    return content;
  }

  return (
    <Link href={props.href} className="block">
      {content}
    </Link>
  );
}
