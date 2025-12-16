"use client";

import { cn } from "@/lib/utils";
import { QuoteUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

export function TestimonialsGrid({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"testimonials">) {
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
        {content.headline && (
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
        )}

        <div
          className={applyElementOverrides(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
            "testimonials",
            styleOverrides
          )}
        >
          {(content.testimonials || []).map((testimonial, index) => (
            <div
              key={index}
              className={applyElementOverrides(
                "p-6 rounded-xl border flex flex-col",
                `testimonials[${index}].card`,
                styleOverrides
              )}
              style={{ borderColor: `${theme.textColor}15` }}
            >
              <HugeiconsIcon
                icon={QuoteUpIcon}
                className="w-8 h-8 mb-4 opacity-30"
                style={{ color: theme.primaryColor }}
              />
              <blockquote
                className={applyElementOverrides(
                  "text-base mb-6 flex-1 leading-relaxed",
                  `testimonials[${index}].quote`,
                  styleOverrides
                )}
              >
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                {testimonial.avatar && (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className={applyElementOverrides(
                      "w-10 h-10 rounded-full object-cover",
                      `testimonials[${index}].avatar`,
                      styleOverrides
                    )}
                  />
                )}
                <div>
                  <div
                    className={applyElementOverrides(
                      "font-medium text-sm",
                      `testimonials[${index}].author`,
                      styleOverrides
                    )}
                  >
                    {testimonial.author}
                  </div>
                  {(testimonial.role || testimonial.company) && (
                    <div
                      className={applyElementOverrides(
                        "text-xs opacity-70",
                        `testimonials[${index}].role`,
                        styleOverrides
                      )}
                    >
                      {testimonial.role}
                      {testimonial.role && testimonial.company && " at "}
                      {testimonial.company}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
