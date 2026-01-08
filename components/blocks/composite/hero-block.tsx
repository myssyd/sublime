"use client";

import React from "react";
import Link from "next/link";
import type { BlockRendererProps } from "../index";
import type { HeroBlockProps } from "@/lib/blocks/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const minHeightClasses = {
  auto: "",
  screen: "min-h-screen",
  half: "min-h-[60vh]",
};

export function HeroBlockComponent({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"hero-block">) {
  const props = block.props as HeroBlockProps;
  const hasImage = props.image && props.imagePosition !== "none";

  return (
    <section
      className={cn(
        "relative w-full px-4 md:px-6",
        minHeightClasses[props.minHeight || "half"],
        "flex items-center",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{
        fontFamily: theme.fontFamily,
        backgroundColor:
          props.imagePosition === "background" && props.image
            ? undefined
            : theme.backgroundColor,
      }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {/* Background Image */}
      {props.imagePosition === "background" && props.image && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${props.image})` }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      )}

      <div
        className={cn(
          "relative z-10 max-w-7xl mx-auto w-full py-16 md:py-24",
          props.imagePosition === "left" || props.imagePosition === "right"
            ? "grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
            : ""
        )}
      >
        {/* Image on Left */}
        {props.imagePosition === "left" && props.image && (
          <div className="relative aspect-video md:aspect-square rounded-xl overflow-hidden">
            <img
              src={props.image}
              alt="Hero"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            props.alignment === "center" && !hasImage && "text-center mx-auto max-w-3xl",
            props.alignment === "left" && "text-left"
          )}
        >
          <h1
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6",
              props.imagePosition === "background" && "text-white"
            )}
            style={{
              color: props.imagePosition === "background" ? "white" : theme.textColor,
            }}
          >
            {props.headline}
          </h1>

          {props.subheadline && (
            <p
              className={cn(
                "text-lg md:text-xl mb-8 opacity-80",
                props.alignment === "center" && !hasImage && "max-w-2xl mx-auto",
                props.imagePosition === "background" && "text-white"
              )}
              style={{
                color: props.imagePosition === "background" ? "white" : theme.textColor,
              }}
            >
              {props.subheadline}
            </p>
          )}

          {(props.primaryCta || props.secondaryCta) && (
            <div
              className={cn(
                "flex flex-wrap gap-4",
                props.alignment === "center" && !hasImage && "justify-center"
              )}
            >
              {props.primaryCta && (
                <Link href={isEditing ? "#" : props.primaryCta.href}>
                  <Button
                    size="lg"
                    style={{ backgroundColor: theme.primaryColor }}
                    disabled={isEditing}
                  >
                    {props.primaryCta.text}
                  </Button>
                </Link>
              )}
              {props.secondaryCta && (
                <Link href={isEditing ? "#" : props.secondaryCta.href}>
                  <Button
                    size="lg"
                    variant="outline"
                    className={cn(
                      props.imagePosition === "background" &&
                        "border-white text-white hover:bg-white/10"
                    )}
                    disabled={isEditing}
                  >
                    {props.secondaryCta.text}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Image on Right */}
        {props.imagePosition === "right" && props.image && (
          <div className="relative aspect-video md:aspect-square rounded-xl overflow-hidden">
            <img
              src={props.image}
              alt="Hero"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
