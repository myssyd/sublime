"use client";

import { cn } from "@/lib/utils";
import { QuoteUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * TestimonialsQuotes - Large quote blocks
 *
 * Stacked large quote blocks with prominent quotation marks.
 * Clean, editorial-style layout.
 */
export function TestimonialsQuotes({
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
      <div className="max-w-5xl mx-auto">
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
            "space-y-12",
            "testimonials",
            styleOverrides
          )}
        >
          {(content.testimonials || []).map((testimonial, index) => (
            <div
              key={index}
              className={applyElementOverrides(
                cn(
                  "relative p-8 md:p-12 rounded-2xl",
                  index % 2 === 0 ? "md:ml-0 md:mr-16" : "md:ml-16 md:mr-0"
                ),
                `testimonials[${index}].card`,
                styleOverrides
              )}
              style={{
                backgroundColor: `${theme.primaryColor}08`,
              }}
            >
              {/* Large quote mark */}
              <div
                className="absolute -top-4 -left-2 md:-top-6 md:-left-4"
                style={{ color: theme.primaryColor }}
              >
                <HugeiconsIcon
                  icon={QuoteUpIcon}
                  className="w-12 h-12 md:w-16 md:h-16 opacity-40"
                />
              </div>

              <blockquote
                className={applyElementOverrides(
                  "text-lg md:text-xl lg:text-2xl leading-relaxed mb-8 relative z-10",
                  `testimonials[${index}].quote`,
                  styleOverrides
                )}
                style={{ fontFamily: theme.fontFamily }}
              >
                {testimonial.quote}
              </blockquote>

              <div className="flex items-center gap-4">
                {testimonial.avatar ? (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className={applyElementOverrides(
                      "w-14 h-14 rounded-full object-cover",
                      `testimonials[${index}].avatar`,
                      styleOverrides
                    )}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.backgroundColor,
                    }}
                  >
                    {testimonial.author.charAt(0)}
                  </div>
                )}
                <div>
                  <div
                    className={applyElementOverrides(
                      "font-semibold text-base",
                      `testimonials[${index}].author`,
                      styleOverrides
                    )}
                  >
                    {testimonial.author}
                  </div>
                  {(testimonial.role || testimonial.company) && (
                    <div
                      className={applyElementOverrides(
                        "text-sm opacity-70",
                        `testimonials[${index}].role`,
                        styleOverrides
                      )}
                    >
                      {testimonial.role}
                      {testimonial.role && testimonial.company && ", "}
                      {testimonial.company}
                    </div>
                  )}
                </div>
              </div>

              {/* Decorative line */}
              <div
                className={cn(
                  "absolute bottom-0 w-1/3 h-1 rounded-full",
                  index % 2 === 0 ? "right-8" : "left-8"
                )}
                style={{ backgroundColor: `${theme.primaryColor}30` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
