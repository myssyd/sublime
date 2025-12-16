"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * HeroMinimal - Clean, minimalist hero design
 *
 * Ultra-clean layout with just the essentials: headline and CTA.
 * Perfect for brands that value simplicity and whitespace.
 */
export function HeroMinimal({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"hero">) {
  return (
    <section
      className={applySectionOverrides(
        cn(
          "relative min-h-[70vh] flex flex-col justify-center items-center text-center px-6 py-24",
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
        className={applyElementOverrides(
          "relative z-10 max-w-3xl mx-auto flex flex-col gap-8 items-center",
          "container",
          styleOverrides
        )}
      >
        <h1
          className={applyElementOverrides(
            "text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]",
            "headline",
            styleOverrides
          )}
          style={{ fontFamily: theme.fontFamily }}
        >
          {content.headline}
        </h1>

        {content.subheadline && (
          <p
            className={applyElementOverrides(
              "text-lg md:text-xl opacity-70 max-w-xl",
              "subheadline",
              styleOverrides
            )}
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.subheadline}
          </p>
        )}

        {content.cta && (
          <div
            className={applyElementOverrides(
              "flex flex-wrap gap-4 mt-2 justify-center",
              "cta",
              styleOverrides
            )}
          >
            <Button
              size="lg"
              className={applyElementOverrides(
                "h-14 px-10 text-base font-medium rounded-full",
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
                variant="ghost"
                size="lg"
                className={applyElementOverrides(
                  "h-14 px-10 text-base font-medium rounded-full",
                  "secondaryCta.button",
                  styleOverrides
                )}
                style={{
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
