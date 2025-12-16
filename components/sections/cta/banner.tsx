"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * CTABanner - Compact inline banner CTA
 *
 * A sleek horizontal banner with headline and button side-by-side.
 * Great for placing between content sections.
 */
export function CTABanner({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"cta">) {
  return (
    <section
      className={applySectionOverrides(
        cn("px-6 py-12 md:px-12 lg:px-20", className),
        styleOverrides
      )}
      style={{
        backgroundColor: theme.backgroundColor,
      }}
    >
      <div
        className={applyElementOverrides(
          "max-w-6xl mx-auto rounded-2xl px-8 py-10 md:py-8",
          "container",
          styleOverrides
        )}
        style={{
          backgroundColor: theme.primaryColor,
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2
              className={applyElementOverrides(
                "text-2xl md:text-3xl font-bold text-white",
                "headline",
                styleOverrides
              )}
              style={{ fontFamily: theme.fontFamily }}
            >
              {content.headline}
            </h2>

            {content.subheadline && (
              <p
                className={applyElementOverrides(
                  "text-base md:text-lg text-white/80 mt-2",
                  "subheadline",
                  styleOverrides
                )}
                style={{ fontFamily: theme.fontFamily }}
              >
                {content.subheadline}
              </p>
            )}
          </div>

          {content.cta && (
            <Button
              size="lg"
              className={applyElementOverrides(
                "h-12 px-8 text-base font-semibold shrink-0",
                "cta.button",
                styleOverrides
              )}
              style={{
                backgroundColor: theme.backgroundColor,
                color: theme.primaryColor,
              }}
              asChild
            >
              <a href={content.cta.url || "#"}>
                {content.cta.text || "Get Started"}
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
