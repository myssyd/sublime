"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface GallerySectionProps {
  content: SectionContent<"gallery">;
  theme: Theme;
  className?: string;
}

export function GallerySection({
  content,
  theme,
  className,
}: GallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const layoutClasses = {
    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
    masonry: "columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4",
    carousel: "flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4",
  };

  return (
    <section
      className={cn("px-6 py-20 md:px-12 lg:px-20", className)}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {content.headline && (
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: theme.fontFamily }}
            >
              {content.headline}
            </h2>
          </div>
        )}

        <div className={layoutClasses[content.layout || "grid"]}>
          {content.images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "relative group cursor-pointer overflow-hidden rounded-lg",
                content.layout === "carousel" && "min-w-[250px] snap-center",
                content.layout === "masonry" && "break-inside-avoid"
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
              src={content.images[lightboxIndex].src}
              alt={content.images[lightboxIndex].alt}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {content.images[lightboxIndex].caption && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-center">
                {content.images[lightboxIndex].caption}
              </div>
            )}
            {/* Navigation */}
            <button
              className="absolute left-4 text-white/70 hover:text-white transition-colors text-4xl"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(
                  (lightboxIndex - 1 + content.images.length) %
                    content.images.length
                );
              }}
            >
              ‹
            </button>
            <button
              className="absolute right-4 text-white/70 hover:text-white transition-colors text-4xl"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex + 1) % content.images.length);
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
