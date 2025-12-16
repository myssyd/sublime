"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

export function GalleryGrid({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"gallery">) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section
      className={applySectionOverrides(
        cn("px-6 py-20 md:px-12 lg:px-20", className),
        styleOverrides
      )}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {content.headline && (
          <div className="text-center mb-16">
            <h2
              className={applyElementOverrides(
                "text-3xl md:text-4xl font-bold",
                "headline",
                styleOverrides
              )}
              style={{ fontFamily: theme.fontFamily }}
            >
              {content.headline}
            </h2>
          </div>
        )}

        <div
          className={applyElementOverrides(
            "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
            "images",
            styleOverrides
          )}
        >
          {(content.images || []).map((image, index) => (
            <div
              key={index}
              className={applyElementOverrides(
                "relative group cursor-pointer overflow-hidden rounded-lg",
                `images[${index}]`,
                styleOverrides
              )}
              onClick={() => setLightboxIndex(index)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {image.caption && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white text-sm">{image.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              onClick={() => setLightboxIndex(null)}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-8 h-8" />
            </button>
            <img
              src={(content.images || [])[lightboxIndex]?.src}
              alt={(content.images || [])[lightboxIndex]?.alt}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </section>
  );
}
