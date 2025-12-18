"use client";

import React from "react";
import Link from "next/link";
import type { BlockRendererProps } from "../index";
import type { CardProps } from "@/lib/blocks/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const variantClasses = {
  default: "",
  elevated: "shadow-lg hover:shadow-xl transition-shadow",
  outlined: "border-2",
};

export function CardBlock({
  block,
  theme,
  children,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"card">) {
  const props = block.props as CardProps;

  const cardContent = (
    <Card
      className={cn(
        variantClasses[props.variant || "default"],
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{ fontFamily: theme.fontFamily }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {props.image && (
        <div className="relative w-full aspect-video overflow-hidden rounded-t-lg">
          <img
            src={props.image}
            alt={props.imageAlt || props.title || "Card image"}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {(props.title || props.description) && (
        <CardHeader>
          {props.title && (
            <CardTitle style={{ color: theme.textColor }}>
              {props.title}
            </CardTitle>
          )}
          {props.description && (
            <CardDescription>{props.description}</CardDescription>
          )}
        </CardHeader>
      )}
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );

  if (isEditing || !props.href) {
    return cardContent;
  }

  return (
    <Link href={props.href} className="block">
      {cardContent}
    </Link>
  );
}
