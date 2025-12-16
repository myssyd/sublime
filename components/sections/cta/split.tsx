"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * CTASplit - Two-column CTA with image
 *
 * Split layout with content on one side and visual on the other.
 * Perfect for adding visual interest to call-to-action sections.
 */
export function CTASplit({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"cta">) {
  return (
    <section
      className={applySectionOverrides(
        cn("px-6 py-20 md:px-12 lg:px-20", className),
        styleOverrides
      )}
      style={{
        backgroundColor: theme.backgroundColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div
            className={applyElementOverrides(
              "order-2 md:order-1",
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
              style={{
                fontFamily: theme.fontFamily,
                color: theme.textColor,
              }}
            >
              {content.headline}
            </h2>

            {content.subheadline && (
              <p
                className={applyElementOverrides(
                  "text-lg md:text-xl opacity-70 mb-8",
                  "subheadline",
                  styleOverrides
                )}
                style={{
                  fontFamily: theme.fontFamily,
                  color: theme.textColor,
                }}
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
                  backgroundColor: theme.primaryColor,
                  color: theme.backgroundColor,
                }}
                asChild
              >
                <a href={content.cta.url || "#"}>
                  {content.cta.text || "Get Started"}
                </a>
              </Button>
            )}
          </div>

          {/* Visual element */}
          <div className="order-1 md:order-2">
            <div
              className="aspect-square rounded-3xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}30)`,
              }}
            >
              {/* Decorative elements */}
              <div
                className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-40 blur-2xl"
                style={{ backgroundColor: theme.primaryColor }}
              />
              <div
                className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full opacity-30 blur-3xl"
                style={{ backgroundColor: theme.secondaryColor }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
              >
                <div
                  className="w-24 h-24 rounded-2xl rotate-12"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
