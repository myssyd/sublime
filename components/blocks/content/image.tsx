"use client";

import React from "react";
import Image from "next/image";
import type { BlockRendererProps } from "../index";
import type { ImageProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

const roundedClasses = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

const aspectRatioClasses = {
  auto: "",
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
};

const objectFitClasses = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
};

export function ImageBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"image">) {
  const props = block.props as ImageProps;

  if (!props.src) {
    return (
      <div
        className={cn(
          "bg-gray-200 flex items-center justify-center",
          aspectRatioClasses[props.aspectRatio || "video"],
          roundedClasses[props.rounded || "md"],
          block.styleOverrides,
          isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
        )}
        onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
        data-block-id={block.id}
        data-block-type={block.type}
      >
        <span className="text-gray-400">No image</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        aspectRatioClasses[props.aspectRatio || "auto"],
        roundedClasses[props.rounded || "md"],
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {props.width && props.height ? (
        <Image
          src={props.src}
          alt={props.alt}
          width={props.width}
          height={props.height}
          className={cn(
            "w-full h-full",
            objectFitClasses[props.objectFit || "cover"]
          )}
        />
      ) : (
        <img
          src={props.src}
          alt={props.alt}
          className={cn(
            "w-full h-full",
            objectFitClasses[props.objectFit || "cover"]
          )}
        />
      )}
    </div>
  );
}
