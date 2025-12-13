"use client";

import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";

interface StatsSectionProps {
  content: SectionContent<"stats">;
  theme: Theme;
  className?: string;
}

export function StatsSection({ content, theme, className }: StatsSectionProps) {
  return (
    <section
      className={cn("px-6 py-16 md:px-12 lg:px-20", className)}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {content.headline && (
          <div className="text-center mb-12">
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: theme.fontFamily }}
            >
              {content.headline}
            </h2>
          </div>
        )}

        <div
          className={cn(
            "grid gap-8 text-center",
            content.stats.length <= 3
              ? "grid-cols-1 md:grid-cols-3"
              : content.stats.length === 4
                ? "grid-cols-2 md:grid-cols-4"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
          )}
        >
          {content.stats.map((stat, index) => (
            <div key={index} className="p-4">
              <div
                className="text-4xl md:text-5xl font-bold mb-2"
                style={{
                  color: theme.primaryColor,
                  fontFamily: theme.fontFamily,
                }}
              >
                {stat.value}
              </div>
              <div className="text-sm opacity-70 uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
