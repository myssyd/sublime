"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * HeroSplit - Two-column split layout hero
 *
 * Content on one side, image on the other.
 * Uses the content.layout field to determine left/right positioning.
 */
export function HeroSplit({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"hero">) {
  const isContentLeft = content.layout !== "split-right";

  return (
    <section
      className={applySectionOverrides(
        cn(
          "relative min-h-[80vh] flex items-center px-6 py-20 md:px-12 lg:px-20",
          className
        ),
        styleOverrides
      )}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div
        className={cn(
          "w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center",
          !isContentLeft && "md:[&>*:first-child]:order-2"
        )}
      >
        {/* Content side */}
        <div
          className={applyElementOverrides(
            cn(
              "flex flex-col gap-6",
              isContentLeft ? "text-left" : "text-left md:text-right"
            ),
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
              "text-lg md:text-xl opacity-90",
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
                cn(
                  "flex flex-wrap gap-4 mt-4",
                  !isContentLeft && "md:justify-end"
                ),
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

        {/* Image side */}
        <div
          className={applyElementOverrides(
            "relative aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden",
            "image",
            styleOverrides
          )}
          style={{
            backgroundColor: theme.secondaryColor,
          }}
        >
          {content.backgroundImage ? (
            <img
              src={content.backgroundImage}
              alt={content.headline}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}40)`,
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
