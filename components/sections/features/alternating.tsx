"use client";

import { cn } from "@/lib/utils";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

function getIcon(iconName: string) {
  const icons = HugeIcons as Record<string, typeof HugeIcons.Rocket01Icon>;
  return icons[iconName] || icons["Rocket01Icon"];
}

/**
 * FeaturesAlternating - Zigzag layout with visual elements
 *
 * Features alternate between left and right with decorative visuals.
 * Great for storytelling and detailed feature explanations.
 */
export function FeaturesAlternating({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"features">) {
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
        {(content.headline || content.subheadline) && (
          <div
            className={applyElementOverrides(
              "text-center mb-20",
              "header",
              styleOverrides
            )}
          >
            {content.headline && (
              <h2
                className={applyElementOverrides(
                  "text-3xl md:text-4xl font-bold mb-4",
                  "headline",
                  styleOverrides
                )}
                style={{ fontFamily: theme.fontFamily }}
              >
                {content.headline}
              </h2>
            )}
            {content.subheadline && (
              <p
                className={applyElementOverrides(
                  "text-lg opacity-80 max-w-2xl mx-auto",
                  "subheadline",
                  styleOverrides
                )}
                style={{ fontFamily: theme.fontFamily }}
              >
                {content.subheadline}
              </p>
            )}
          </div>
        )}

        <div
          className={applyElementOverrides(
            "space-y-24",
            "features",
            styleOverrides
          )}
        >
          {(content.features || []).map((feature, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={index}
                className={applyElementOverrides(
                  cn(
                    "grid md:grid-cols-2 gap-12 items-center",
                    !isEven && "md:[&>*:first-child]:order-2"
                  ),
                  `features[${index}]`,
                  styleOverrides
                )}
              >
                {/* Content */}
                <div className={cn(isEven ? "md:pr-8" : "md:pl-8")}>
                  <div
                    className={applyElementOverrides(
                      "w-14 h-14 rounded-xl flex items-center justify-center mb-6",
                      `features[${index}].icon`,
                      styleOverrides
                    )}
                    style={{ backgroundColor: `${theme.primaryColor}15` }}
                  >
                    <HugeiconsIcon
                      icon={getIcon(feature.icon)}
                      className="w-7 h-7"
                      style={{ color: theme.primaryColor }}
                    />
                  </div>
                  <h3
                    className={applyElementOverrides(
                      "text-2xl md:text-3xl font-bold mb-4",
                      `features[${index}].title`,
                      styleOverrides
                    )}
                    style={{ fontFamily: theme.fontFamily }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={applyElementOverrides(
                      "text-base opacity-80 leading-relaxed",
                      `features[${index}].description`,
                      styleOverrides
                    )}
                  >
                    {feature.description}
                  </p>
                </div>

                {/* Visual */}
                <div
                  className={applyElementOverrides(
                    "aspect-square rounded-3xl relative overflow-hidden",
                    `features[${index}].card`,
                    styleOverrides
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor}10, ${theme.secondaryColor}15)`,
                  }}
                >
                  {/* Decorative elements */}
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div
                      className={cn(
                        "w-32 h-32 rounded-2xl",
                        isEven ? "rotate-12" : "-rotate-12"
                      )}
                      style={{ backgroundColor: `${theme.primaryColor}20` }}
                    />
                  </div>
                  <div
                    className={cn(
                      "absolute w-20 h-20 rounded-full blur-2xl",
                      isEven ? "top-1/4 right-1/4" : "bottom-1/4 left-1/4"
                    )}
                    style={{ backgroundColor: `${theme.primaryColor}30` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
