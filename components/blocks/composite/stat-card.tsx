"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { StatCardProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";

export function StatCardBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"stat-card">) {
  const props = block.props as StatCardProps;

  const IconComponent = props.icon
    ? HugeIcons[props.icon as keyof typeof HugeIcons]
    : null;

  const getTrendColor = () => {
    if (!props.trend) return theme.textColor;
    switch (props.trend.direction) {
      case "up":
        return "#22c55e";
      case "down":
        return "#ef4444";
      default:
        return theme.textColor;
    }
  };

  return (
    <div
      className={cn(
        "p-6 rounded-xl border bg-card text-card-foreground",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{ fontFamily: theme.fontFamily }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-sm font-medium opacity-70 mb-1"
            style={{ color: theme.textColor }}
          >
            {props.label}
          </p>
          <p
            className="text-3xl font-bold"
            style={{ color: theme.textColor }}
          >
            {props.value}
          </p>
          {props.description && (
            <p
              className="text-sm opacity-60 mt-1"
              style={{ color: theme.textColor }}
            >
              {props.description}
            </p>
          )}
          {props.trend && (
            <div
              className="flex items-center gap-1 mt-2 text-sm font-medium"
              style={{ color: getTrendColor() }}
            >
              <HugeiconsIcon
                icon={props.trend.direction === "up" ? ArrowUp01Icon : ArrowDown01Icon}
                className="w-4 h-4"
              />
              {props.trend.value}
            </div>
          )}
        </div>
        {IconComponent && (
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${theme.primaryColor}15` }}
          >
            <HugeiconsIcon
              icon={IconComponent}
              className="w-6 h-6"
              color={theme.primaryColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}
