"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * FAQTabs - Tabbed FAQ selector
 *
 * Shows questions as clickable tabs with answer displayed below.
 * Great for interactive exploration of FAQ content.
 */
export function FAQTabs({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"faq">) {
  const [activeIndex, setActiveIndex] = useState(0);
  const items = content.items || [];
  const activeItem = items[activeIndex];

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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
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
            "grid lg:grid-cols-[280px,1fr] gap-8",
            "items",
            styleOverrides
          )}
        >
          {/* Question tabs */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {items.map((item, index) => (
              <button
                key={index}
                className={applyElementOverrides(
                  cn(
                    "px-4 py-3 text-left text-sm rounded-lg transition-all whitespace-nowrap lg:whitespace-normal",
                    activeIndex === index
                      ? "font-medium shadow-sm"
                      : "opacity-70 hover:opacity-100"
                  ),
                  `items[${index}].question`,
                  styleOverrides
                )}
                style={{
                  backgroundColor:
                    activeIndex === index
                      ? `${theme.primaryColor}15`
                      : "transparent",
                  color:
                    activeIndex === index ? theme.primaryColor : theme.textColor,
                }}
                onClick={() => setActiveIndex(index)}
              >
                {item.question}
              </button>
            ))}
          </div>

          {/* Answer panel */}
          {activeItem && (
            <div
              className={applyElementOverrides(
                "rounded-2xl p-8",
                `items[${activeIndex}]`,
                styleOverrides
              )}
              style={{
                backgroundColor: `${theme.primaryColor}08`,
              }}
            >
              <h3
                className={applyElementOverrides(
                  "font-semibold text-xl mb-4",
                  `items[${activeIndex}].question`,
                  styleOverrides
                )}
                style={{
                  fontFamily: theme.fontFamily,
                  color: theme.primaryColor,
                }}
              >
                {activeItem.question}
              </h3>
              <p
                className={applyElementOverrides(
                  "text-base leading-relaxed opacity-80",
                  `items[${activeIndex}].answer`,
                  styleOverrides
                )}
              >
                {activeItem.answer}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
