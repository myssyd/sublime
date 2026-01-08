"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { LogoCloudProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

export function LogoCloudBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"logo-cloud">) {
  const props = block.props as LogoCloudProps;

  const renderLogo = (logo: { src: string; alt: string; href?: string }, index: number) => {
    const logoImg = (
      <img
        src={logo.src}
        alt={logo.alt}
        className={cn(
          "h-8 md:h-10 w-auto object-contain",
          props.grayscale && "grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
        )}
      />
    );

    if (isEditing || !logo.href) {
      return (
        <div key={index} className="flex items-center justify-center p-4">
          {logoImg}
        </div>
      );
    }

    return (
      <a
        key={index}
        href={logo.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center p-4"
      >
        {logoImg}
      </a>
    );
  };

  const renderLogos = () => {
    if (!props.logos || props.logos.length === 0) {
      return (
        <div className="text-center opacity-50 py-8">
          No logos added yet
        </div>
      );
    }

    switch (props.variant) {
      case "grid":
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {props.logos.map((logo, index) => renderLogo(logo, index))}
          </div>
        );
      case "scroll":
        return (
          <div className="overflow-hidden">
            <div className="flex animate-scroll gap-8">
              {[...props.logos, ...props.logos].map((logo, index) =>
                renderLogo(logo, index)
              )}
            </div>
          </div>
        );
      case "inline":
      default:
        return (
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {props.logos.map((logo, index) => renderLogo(logo, index))}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "w-full py-8",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2 rounded"
      )}
      style={{ fontFamily: theme.fontFamily }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {props.title && (
        <p
          className="text-center text-sm font-medium opacity-60 mb-8"
          style={{ color: theme.textColor }}
        >
          {props.title}
        </p>
      )}
      {renderLogos()}
    </div>
  );
}
