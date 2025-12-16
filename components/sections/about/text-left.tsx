"use client";

import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

export function AboutTextLeft({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"about">) {
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
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
        {content.image && (
          <div className="flex-1 md:max-w-md">
            <img
              src={content.image}
              alt={content.headline}
              className={applyElementOverrides(
                "w-full h-auto rounded-2xl object-cover",
                "image",
                styleOverrides
              )}
            />
          </div>
        )}

        <div className="flex-1">
          <h2
            className={applyElementOverrides(
              "text-3xl md:text-4xl font-bold mb-6",
              "headline",
              styleOverrides
            )}
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.headline}
          </h2>

          {content.content && (
            <div
              className={applyElementOverrides(
                "prose prose-lg max-w-none opacity-85 leading-relaxed",
                "content",
                styleOverrides
              )}
              style={{ fontFamily: theme.fontFamily }}
            >
              {(content.content || "").split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
