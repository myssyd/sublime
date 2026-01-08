"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { SelectProps } from "@/lib/blocks/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SelectBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"select">) {
  const props = block.props as SelectProps;

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
      <Select name={props.name} disabled={isEditing}>
        <SelectTrigger style={{ fontFamily: theme.fontFamily }}>
          <SelectValue placeholder={props.placeholder || "Select an option"} />
        </SelectTrigger>
        <SelectContent>
          {props.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
