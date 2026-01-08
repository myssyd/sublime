"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { TextareaProps } from "@/lib/blocks/types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function TextareaBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"textarea">) {
  const props = block.props as TextareaProps;

  return (
    <div
      className={cn(
        "w-full space-y-2",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2 rounded p-1"
      )}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {props.label && (
        <Label
          htmlFor={props.name}
          style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
        >
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Textarea
        name={props.name}
        id={props.name}
        placeholder={props.placeholder}
        required={props.required}
        rows={props.rows || 4}
        disabled={isEditing}
        style={{ fontFamily: theme.fontFamily }}
      />
      {props.helperText && (
        <p
          className="text-sm opacity-70"
          style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
        >
          {props.helperText}
        </p>
      )}
    </div>
  );
}
