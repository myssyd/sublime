"use client";

import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

export function StatsRow({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"stats">) {
  return (
    <section
      className={applySectionOverrides(
        cn("px-6 py-16 md:px-12 lg:px-20", className),
        styleOverrides
      )}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {content.headline && (
          <div className="text-center mb-12">
            <h2
              className={applyElementOverrides(
                "text-2xl md:text-3xl font-bold",
                "headline",
                styleOverrides
              )}
              style={{ fontFamily: theme.fontFamily }}
            >
              {content.headline}
            </h2>
          </div>
        )}

        <div
          className={applyElementOverrides(
            cn(
              "grid gap-8 text-center",
              (content.stats || []).length <= 3
                ? "grid-cols-1 md:grid-cols-3"
                : (content.stats || []).length === 4
                  ? "grid-cols-2 md:grid-cols-4"
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
            ),
            "stats",
            styleOverrides
          )}
        >
          {(content.stats || []).map((stat, index) => (
            <div
              key={index}
              className={applyElementOverrides(
                "p-4",
                `stats[${index}]`,
                styleOverrides
              )}
            >
              <div
                className={applyElementOverrides(
                  "text-4xl md:text-5xl font-bold mb-2",
                  `stats[${index}].value`,
                  styleOverrides
                )}
                style={{
                  color: theme.primaryColor,
                  fontFamily: theme.fontFamily,
                }}
              >
                {stat.value}
              </div>
              <div
                className={applyElementOverrides(
                  "text-sm opacity-70 uppercase tracking-wide",
                  `stats[${index}].label`,
                  styleOverrides
                )}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
