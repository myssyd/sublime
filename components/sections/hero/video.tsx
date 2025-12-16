"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * HeroVideo - Video background hero section
 *
 * Immersive full-screen hero with video/image background.
 * Features a gradient overlay for text readability.
 */
export function HeroVideo({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"hero">) {
  const hasBackgroundImage = Boolean(content.backgroundImage);

  return (
    <section
      className={applySectionOverrides(
        cn(
          "relative min-h-screen flex flex-col justify-center items-center text-center px-6 py-20 overflow-hidden",
          className
        ),
        styleOverrides
      )}
    >
      {/* Background image/video */}
      {hasBackgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${content.backgroundImage})` }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: theme.primaryColor }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className={applyElementOverrides(
          "absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70",
          "background",
          styleOverrides
        )}
      />

      {/* Animated grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

      <div
        className={applyElementOverrides(
          "relative z-10 max-w-4xl mx-auto flex flex-col gap-6 items-center",
          "container",
          styleOverrides
        )}
      >
        <h1
          className={applyElementOverrides(
            "text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-lg",
            "headline",
            styleOverrides
          )}
          style={{ fontFamily: theme.fontFamily }}
        >
          {content.headline}
        </h1>

        <p
          className={applyElementOverrides(
            "text-lg md:text-2xl text-white/90 max-w-2xl drop-shadow-md",
            "subheadline",
            styleOverrides
          )}
          style={{ fontFamily: theme.fontFamily }}
        >
          {content.subheadline}
        </p>

        {content.cta && (
          <div
            className={applyElementOverrides(
              "flex flex-wrap gap-4 mt-6 justify-center",
              "cta",
              styleOverrides
            )}
          >
            <Button
              size="lg"
              className={applyElementOverrides(
                "h-14 px-10 text-base font-semibold shadow-xl hover:shadow-2xl transition-shadow",
                "cta.button",
                styleOverrides
              )}
              style={{
                backgroundColor: theme.primaryColor,
                color: "#fff",
              }}
              asChild
            >
              <a href={content.cta.url || "#"}>
                {content.cta.text || "Get Started"}
              </a>
            </Button>

            {content.secondaryCta && (
              <Button
                variant="outline"
                size="lg"
                className={applyElementOverrides(
                  "h-14 px-10 text-base font-semibold border-white/30 text-white hover:bg-white/10 backdrop-blur-sm",
                  "secondaryCta.button",
                  styleOverrides
                )}
                asChild
              >
                <a href={content.secondaryCta.url || "#"}>
                  {content.secondaryCta.text || "Learn More"}
                </a>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
