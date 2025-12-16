"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * HeroCentered - Classic centered hero layout
 *
 * A clean, centered design with headline, subheadline, and CTA buttons.
 * Supports optional background image with overlay.
 */
export function HeroCentered({
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
          "relative min-h-[80vh] flex flex-col justify-center items-center text-center px-6 py-20 md:px-12 lg:px-20",
          className
        ),
        styleOverrides
      )}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        backgroundImage: hasBackgroundImage
          ? `url(${content.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Background overlay for images */}
      {hasBackgroundImage && (
        <div
          className={applyElementOverrides(
            "absolute inset-0 bg-black/40",
            "background",
            styleOverrides
          )}
        />
      )}

      <div
        className={applyElementOverrides(
          "relative z-10 max-w-4xl mx-auto flex flex-col gap-6 items-center",
          "container",
          styleOverrides
        )}
      >
        <h1
          className={applyElementOverrides(
            "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
            "headline",
            styleOverrides
          )}
          style={{ fontFamily: theme.fontFamily }}
        >
          {content.headline}
        </h1>

        <p
          className={applyElementOverrides(
            "text-lg md:text-xl opacity-90 max-w-2xl",
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
              "flex flex-wrap gap-4 mt-4 justify-center",
              "cta",
              styleOverrides
            )}
          >
            <Button
              size="lg"
              className={applyElementOverrides(
                "h-12 px-8 text-base font-semibold",
                "cta.button",
                styleOverrides
              )}
              style={{
                backgroundColor: theme.primaryColor,
                color: theme.backgroundColor,
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
                  "h-12 px-8 text-base font-semibold",
                  "secondaryCta.button",
                  styleOverrides
                )}
                style={{
                  borderColor: theme.primaryColor,
                  color: theme.textColor,
                }}
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
    </section>
  );
}
