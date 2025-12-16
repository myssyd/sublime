"use client";

import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * FAQTwoColumn - Side-by-side FAQ grid
 *
 * Displays FAQ items in a two-column grid without expand/collapse.
 * All answers are visible at once for easy scanning.
 */
export function FAQTwoColumn({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"faq">) {
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

        <div
          className={applyElementOverrides(
            "grid md:grid-cols-2 gap-x-12 gap-y-10",
            "items",
            styleOverrides
          )}
        >
          {(content.items || []).map((item, index) => (
            <div
              key={index}
              className={applyElementOverrides(
                "relative",
                `items[${index}]`,
                styleOverrides
              )}
            >
              {/* Question number badge */}
              <div
                className="absolute -left-3 -top-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold hidden md:flex"
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  color: theme.primaryColor,
                }}
              >
                {index + 1}
              </div>

              <h3
                className={applyElementOverrides(
                  "font-semibold text-lg mb-3",
                  `items[${index}].question`,
                  styleOverrides
                )}
                style={{ fontFamily: theme.fontFamily }}
              >
                {item.question}
              </h3>
              <p
                className={applyElementOverrides(
                  "text-sm opacity-80 leading-relaxed",
                  `items[${index}].answer`,
                  styleOverrides
                )}
              >
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
