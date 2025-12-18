"use client";

import React, { useState } from "react";
import type { BlockRendererProps } from "../index";
import type { FaqItemProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function FaqItemBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"faq-item">) {
  const props = block.props as FaqItemProps;
  const [isOpen, setIsOpen] = useState(props.defaultOpen || false);

  return (
    <div
      className={cn(
        "border-b",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2 rounded"
      )}
      style={{ fontFamily: theme.fontFamily }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      <button
        className="w-full py-4 flex items-center justify-between text-left"
        onClick={(e) => {
          if (isEditing) {
            e.stopPropagation();
            return;
          }
          setIsOpen(!isOpen);
        }}
        disabled={isEditing}
      >
        <span
          className="font-medium text-lg pr-4"
          style={{ color: theme.textColor }}
        >
          {props.question}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className={cn(
            "w-5 h-5 flex-shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          color={theme.textColor}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 pb-4" : "max-h-0"
        )}
      >
        <p
          className="opacity-70"
          style={{ color: theme.textColor }}
        >
          {props.answer}
        </p>
      </div>
    </div>
  );
}
