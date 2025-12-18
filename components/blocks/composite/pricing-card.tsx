"use client";

import React from "react";
import Link from "next/link";
import type { BlockRendererProps } from "../index";
import type { PricingCardProps } from "@/lib/blocks/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function PricingCardBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"pricing-card">) {
  const props = block.props as PricingCardProps;

  return (
    <div
      className={cn(
        "relative p-6 rounded-xl border bg-card text-card-foreground",
        props.highlighted && "border-2 shadow-lg",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{
        fontFamily: theme.fontFamily,
        borderColor: props.highlighted ? theme.primaryColor : undefined,
      }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {props.badge && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full text-white"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {props.badge}
        </div>
      )}

      <div className="text-center mb-6">
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: theme.textColor }}
        >
          {props.name}
        </h3>
        <div className="flex items-baseline justify-center gap-1">
          <span
            className="text-4xl font-bold"
            style={{ color: theme.textColor }}
          >
            {props.price}
          </span>
          {props.period && (
            <span className="text-sm opacity-70" style={{ color: theme.textColor }}>
              {props.period}
            </span>
          )}
        </div>
        {props.description && (
          <p
            className="mt-2 text-sm opacity-70"
            style={{ color: theme.textColor }}
          >
            {props.description}
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {props.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              color={theme.primaryColor}
            />
            <span
              className="text-sm"
              style={{ color: theme.textColor }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {isEditing ? (
        <Button
          className="w-full"
          variant={props.highlighted ? "default" : "outline"}
          style={props.highlighted ? { backgroundColor: theme.primaryColor } : undefined}
          disabled
        >
          {props.ctaText || "Get Started"}
        </Button>
      ) : (
        <Link href={props.ctaHref || "#"} className="block">
          <Button
            className="w-full"
            variant={props.highlighted ? "default" : "outline"}
            style={props.highlighted ? { backgroundColor: theme.primaryColor } : undefined}
          >
            {props.ctaText || "Get Started"}
          </Button>
        </Link>
      )}
    </div>
  );
}
