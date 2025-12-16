"use client";

import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

export function MenuCategorized({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"menu">) {
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

        <div
          className={applyElementOverrides(
            "space-y-12",
            "categories",
            styleOverrides
          )}
        >
          {(content.categories || []).map((category, catIndex) => (
            <div key={catIndex}>
              <h3
                className={applyElementOverrides(
                  "text-2xl font-semibold mb-6 pb-2 border-b",
                  `categories[${catIndex}].name`,
                  styleOverrides
                )}
                style={{
                  fontFamily: theme.fontFamily,
                  borderColor: `${theme.textColor}20`,
                }}
              >
                {category.name}
              </h3>
              <div className="space-y-6">
                {(category.items || []).map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={applyElementOverrides(
                      "flex gap-4",
                      `categories[${catIndex}].items[${itemIndex}]`,
                      styleOverrides
                    )}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4
                            className={applyElementOverrides(
                              "font-medium",
                              `categories[${catIndex}].items[${itemIndex}].name`,
                              styleOverrides
                            )}
                            style={{ fontFamily: theme.fontFamily }}
                          >
                            {item.name}
                          </h4>
                          {item.description && (
                            <p className="text-sm opacity-70 mt-1">
                              {item.description}
                            </p>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {item.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `${theme.primaryColor}20`,
                                    color: theme.primaryColor,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span
                          className={applyElementOverrides(
                            "font-semibold flex-shrink-0",
                            `categories[${catIndex}].items[${itemIndex}].price`,
                            styleOverrides
                          )}
                          style={{ color: theme.primaryColor }}
                        >
                          {item.price}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
