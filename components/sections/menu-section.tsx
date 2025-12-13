"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";
import { Badge } from "@/components/ui/badge";

interface MenuSectionProps {
  content: SectionContent<"menu">;
  theme: Theme;
  className?: string;
}

export function MenuSection({ content, theme, className }: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <section
      className={cn("px-6 py-20 md:px-12 lg:px-20", className)}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.headline}
          </h2>
        </div>

        {/* Category tabs */}
        {content.categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {content.categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setActiveCategory(index)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  activeCategory === index
                    ? "text-white"
                    : "opacity-70 hover:opacity-100"
                )}
                style={{
                  backgroundColor:
                    activeCategory === index
                      ? theme.primaryColor
                      : `${theme.textColor}10`,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Menu items */}
        <div className="space-y-6">
          {content.categories[activeCategory]?.items.map((item, index) => (
            <div
              key={index}
              className="flex gap-4 p-4 rounded-xl hover:bg-black/5 transition-colors"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className="font-semibold"
                      style={{ fontFamily: theme.fontFamily }}
                    >
                      {item.name}
                    </h3>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {item.tags.map((tag, tagIndex) => (
                          <Badge
                            key={tagIndex}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <span
                    className="font-semibold flex-shrink-0"
                    style={{ color: theme.primaryColor }}
                  >
                    {item.price}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm opacity-70 mt-2">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
