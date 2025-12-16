"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * HeroGradient - Bold gradient background hero
 *
 * Features a stunning gradient background using primary and secondary colors.
 * Includes decorative circular elements for visual interest.
 */
export function HeroGradient({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"hero">) {
  return (
    <section
      className={applySectionOverrides(
        cn(
          "relative min-h-[80vh] flex flex-col justify-center items-center text-center px-6 py-20 overflow-hidden",
          className
        ),
        styleOverrides
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
      }}
    >
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full opacity-20"
          style={{ backgroundColor: theme.accentColor }}
        />
        <div
          className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full opacity-20"
          style={{ backgroundColor: theme.accentColor }}
        />
      </div>

      <div
        className={applyElementOverrides(
          "relative z-10 max-w-4xl mx-auto flex flex-col gap-6 items-center",
          "container",
          styleOverrides
        )}
      >
        <h1
          className={applyElementOverrides(
            "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white",
            "headline",
            styleOverrides
          )}
          style={{ fontFamily: theme.fontFamily }}
        >
          {content.headline}
        </h1>

        <p
          className={applyElementOverrides(
            "text-lg md:text-xl text-white/90 max-w-2xl",
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
                "h-12 px-8 text-base font-semibold bg-white hover:bg-white/90",
                "cta.button",
                styleOverrides
              )}
              style={{
                color: theme.primaryColor,
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
                  "h-12 px-8 text-base font-semibold border-white text-white hover:bg-white/10",
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
    </section>
  );
}
