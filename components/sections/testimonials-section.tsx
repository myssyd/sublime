"use client";

import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";
import { QuoteUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface TestimonialsSectionProps {
  content: SectionContent<"testimonials">;
  theme: Theme;
  className?: string;
}

export function TestimonialsSection({
  content,
  theme,
  className,
}: TestimonialsSectionProps) {
  const layoutClasses = {
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    carousel: "flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4",
    featured: "flex flex-col gap-8",
  };

  return (
    <section
      className={cn("px-6 py-20 md:px-12 lg:px-20", className)}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {content.headline && (
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: theme.fontFamily }}
            >
              {content.headline}
            </h2>
          </div>
        )}

        <div className={layoutClasses[content.layout || "grid"]}>
          {content.testimonials.map((testimonial, index) => {
            if (content.layout === "featured" && index === 0) {
              return (
                <div
                  key={index}
                  className="text-center p-8 rounded-2xl"
                  style={{ backgroundColor: `${theme.primaryColor}08` }}
                >
                  <HugeiconsIcon
                    icon={QuoteUpIcon}
                    className="w-12 h-12 mx-auto mb-6 opacity-30"
                    style={{ color: theme.primaryColor }}
                  />
                  <blockquote
                    className="text-2xl md:text-3xl font-medium mb-8 leading-relaxed"
                    style={{ fontFamily: theme.fontFamily }}
                  >
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center justify-center gap-4">
                    {testimonial.avatar && (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    )}
                    <div className="text-left">
                      <div className="font-semibold">{testimonial.author}</div>
                      {(testimonial.role || testimonial.company) && (
                        <div className="text-sm opacity-70">
                          {testimonial.role}
                          {testimonial.role && testimonial.company && " at "}
                          {testimonial.company}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={cn(
                  "p-6 rounded-xl border flex flex-col",
                  content.layout === "carousel" &&
                    "min-w-[300px] md:min-w-[400px] snap-center"
                )}
                style={{ borderColor: `${theme.textColor}15` }}
              >
                <HugeiconsIcon
                  icon={QuoteUpIcon}
                  className="w-8 h-8 mb-4 opacity-30"
                  style={{ color: theme.primaryColor }}
                />
                <blockquote className="text-base mb-6 flex-1 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  {testimonial.avatar && (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium text-sm">
                      {testimonial.author}
                    </div>
                    {(testimonial.role || testimonial.company) && (
                      <div className="text-xs opacity-70">
                        {testimonial.role}
                        {testimonial.role && testimonial.company && " at "}
                        {testimonial.company}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
