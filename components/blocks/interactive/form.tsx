"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { FormProps } from "@/lib/blocks/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FormBlock({
  block,
  theme,
  children,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"form">) {
  const props = block.props as FormProps;

  const handleSubmit = (e: React.FormEvent) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    // In production, handle form submission
    if (!props.action) {
      e.preventDefault();
      // Could show success message here
      alert(props.successMessage || "Form submitted successfully!");
    }
  };

  return (
    <form
      action={props.action}
      method={props.method || "POST"}
      onSubmit={handleSubmit}
      className={cn(
        "w-full space-y-4",
        block.styleOverrides,
        isEditing && "relative",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2 rounded p-2"
      )}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {children}
      <Button
        type="submit"
        className="w-full"
        style={{ backgroundColor: theme.primaryColor, fontFamily: theme.fontFamily }}
        disabled={isEditing}
      >
        {props.submitText || "Submit"}
      </Button>
    </form>
  );
}
