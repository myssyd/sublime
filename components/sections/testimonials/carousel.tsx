"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft01Icon, ArrowRight01Icon, QuoteUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * TestimonialsCarousel - Single testimonial with navigation
 *
 * Shows one testimonial at a time with previous/next navigation.
 * Features large quote with centered avatar.
 */
export function TestimonialsCarousel({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"testimonials">) {
  const testimonials = content.testimonials || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  if (testimonials.length === 0) return null;

  const current = testimonials[currentIndex];

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
        {content.headline && (
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
        )}

        <div className="relative">
          {/* Main testimonial */}
          <div
            className={applyElementOverrides(
              "text-center px-4 md:px-16",
              `testimonials[${currentIndex}].card`,
              styleOverrides
            )}
          >
            <HugeiconsIcon
              icon={QuoteUpIcon}
              className="w-12 h-12 mx-auto mb-8"
              style={{ color: `${theme.primaryColor}40` }}
            />

            <blockquote
              className={applyElementOverrides(
                "text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed mb-10",
                `testimonials[${currentIndex}].quote`,
                styleOverrides
              )}
              style={{ fontFamily: theme.fontFamily }}
            >
              "{current.quote}"
            </blockquote>

            <div className="flex flex-col items-center gap-4">
              {current.avatar && (
                <img
                  src={current.avatar}
                  alt={current.author}
                  className={applyElementOverrides(
                    "w-16 h-16 rounded-full object-cover ring-4",
                    `testimonials[${currentIndex}].avatar`,
                    styleOverrides
                  )}
                  style={{
                    // @ts-expect-error - CSS custom property
                    "--tw-ring-color": `${theme.primaryColor}20`,
                  }}
                />
              )}
              <div className="text-center">
                <div
                  className={applyElementOverrides(
                    "font-semibold text-lg",
                    `testimonials[${currentIndex}].author`,
                    styleOverrides
                  )}
                >
                  {current.author}
                </div>
                {(current.role || current.company) && (
                  <div
                    className={applyElementOverrides(
                      "text-sm opacity-70 mt-1",
                      `testimonials[${currentIndex}].role`,
                      styleOverrides
                    )}
                  >
                    {current.role}
                    {current.role && current.company && " at "}
                    {current.company}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="rounded-full w-12 h-12"
                style={{
                  borderColor: `${theme.textColor}20`,
                }}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5" />
              </Button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentIndex
                        ? "w-6"
                        : "opacity-30 hover:opacity-50"
                    )}
                    style={{
                      backgroundColor:
                        index === currentIndex
                          ? theme.primaryColor
                          : theme.textColor,
                    }}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="rounded-full w-12 h-12"
                style={{
                  borderColor: `${theme.textColor}20`,
                }}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
