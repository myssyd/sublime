"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

export function CTASimple({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"cta">) {
  const isGradient = content.style === "gradient";

  return (
    <section
      className={applySectionOverrides(
        cn("px-6 py-20 md:px-12 lg:px-20", className),
        styleOverrides
      )}
      style={{
        backgroundColor: isGradient ? undefined : theme.primaryColor,
        backgroundImage: isGradient
          ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
          : undefined,
        color: theme.backgroundColor,
      }}
    >
      <div
        className={applyElementOverrides(
          "max-w-4xl mx-auto text-center",
          "container",
          styleOverrides
        )}
      >
        <h2
          className={applyElementOverrides(
            "text-3xl md:text-4xl lg:text-5xl font-bold mb-4",
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
              "text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto",
              "subheadline",
              styleOverrides
            )}
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.subheadline}
          </p>
        )}

        {content.cta && (
          <Button
            size="lg"
            className={applyElementOverrides(
              "h-12 px-8 text-base font-semibold",
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
    </section>
  );
}
