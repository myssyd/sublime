"use client";

import React from "react";
import Link from "next/link";
import type { BlockRendererProps } from "../index";
import type { CtaBlockProps } from "@/lib/blocks/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaBlockComponent({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"cta-block">) {
  const props = block.props as CtaBlockProps;

  const getBackgroundStyle = () => {
    switch (props.variant) {
      case "gradient":
        return {
          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
        };
      case "image":
        return props.backgroundImage
          ? { backgroundImage: `url(${props.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { backgroundColor: theme.primaryColor };
      default:
        return { backgroundColor: theme.primaryColor };
    }
  };

  return (
    <section
      className={cn(
        "relative w-full px-4 md:px-6 py-16 md:py-24",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{
        fontFamily: theme.fontFamily,
        ...getBackgroundStyle(),
      }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {/* Overlay for image variant */}
      {props.variant === "image" && props.backgroundImage && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {props.headline}
        </h2>

        {props.subheadline && (
          <p className="text-lg md:text-xl text-white/80 mb-8">
            {props.subheadline}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          <Link href={isEditing ? "#" : props.primaryCta.href}>
            <Button
              size="lg"
              className="bg-white hover:bg-white/90"
              style={{ color: theme.primaryColor }}
              disabled={isEditing}
            >
              {props.primaryCta.text}
            </Button>
          </Link>
          {props.secondaryCta && (
            <Link href={isEditing ? "#" : props.secondaryCta.href}>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                disabled={isEditing}
              >
                {props.secondaryCta.text}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
