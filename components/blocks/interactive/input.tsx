"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { InputProps } from "@/lib/blocks/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function InputBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"input">) {
  const props = block.props as InputProps;

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
      <Input
        type={props.type || "text"}
        name={props.name}
        id={props.name}
        placeholder={props.placeholder}
        required={props.required}
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
