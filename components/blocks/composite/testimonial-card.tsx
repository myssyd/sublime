"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { TestimonialCardProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";
import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function TestimonialCardBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"testimonial-card">) {
  const props = block.props as TestimonialCardProps;

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
      {props.rating && (
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <HugeiconsIcon
              key={i}
              icon={StarIcon}
              className="w-5 h-5"
              color={i < props.rating! ? theme.accentColor : `${theme.textColor}30`}
            />
          ))}
        </div>
      )}

      <blockquote
        className="text-lg mb-6 leading-relaxed"
        style={{ color: theme.textColor }}
      >
        "{props.quote}"
      </blockquote>

      <div className="flex items-center gap-4">
        {props.avatar ? (
          <img
            src={props.avatar}
            alt={props.author}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold text-white"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {props.author.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div
            className="font-semibold"
            style={{ color: theme.textColor }}
          >
            {props.author}
          </div>
          {(props.role || props.company) && (
            <div
              className="text-sm opacity-70"
              style={{ color: theme.textColor }}
            >
              {props.role}
              {props.role && props.company && " at "}
              {props.company}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
