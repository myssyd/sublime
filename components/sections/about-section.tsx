"use client";

import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";

interface AboutSectionProps {
  content: SectionContent<"about">;
  theme: Theme;
  className?: string;
}

export function AboutSection({ content, theme, className }: AboutSectionProps) {
  const layoutClasses = {
    "text-left": "flex-row",
    "text-right": "flex-row-reverse",
    centered: "flex-col items-center text-center",
  };

  return (
    <section
      className={cn("px-6 py-20 md:px-12 lg:px-20", className)}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div
        className={cn(
          "max-w-6xl mx-auto flex flex-col md:flex gap-12",
          layoutClasses[content.layout || "text-left"]
        )}
      >
        {content.image && content.layout !== "centered" && (
          <div className="flex-1 md:max-w-md">
            <img
              src={content.image}
              alt={content.headline}
              className="w-full h-auto rounded-2xl object-cover"
            />
          </div>
        )}

        <div
          className={cn("flex-1", content.layout === "centered" && "max-w-3xl")}
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-6"
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.headline}
          </h2>

          {content.image && content.layout === "centered" && (
            <img
              src={content.image}
              alt={content.headline}
              className="w-full max-w-2xl mx-auto h-auto rounded-2xl object-cover mb-8"
            />
          )}

          <div
            className="prose prose-lg max-w-none opacity-85 leading-relaxed"
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
