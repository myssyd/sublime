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
 * FeaturesIconsLeft - Horizontal list with icons on left
 *
 * Clean list layout with icons aligned to the left.
 * Perfect for feature lists and benefits.
 */
export function FeaturesIconsLeft({
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
      <div className="max-w-5xl mx-auto">
        {(content.headline || content.subheadline) && (
          <div
            className={applyElementOverrides(
              "text-center mb-16",
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
            "grid md:grid-cols-2 gap-8",
            "features",
            styleOverrides
          )}
        >
          {(content.features || []).map((feature, index) => (
            <div
              key={index}
              className={applyElementOverrides(
                "flex gap-5 p-6 rounded-xl transition-colors hover:bg-muted/50",
                `features[${index}].card`,
                styleOverrides
              )}
            >
              <div
                className={applyElementOverrides(
                  "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                  `features[${index}].icon`,
                  styleOverrides
                )}
                style={{ backgroundColor: `${theme.primaryColor}15` }}
              >
                <HugeiconsIcon
                  icon={getIcon(feature.icon)}
                  className="w-6 h-6"
                  style={{ color: theme.primaryColor }}
                />
              </div>
              <div>
                <h3
                  className={applyElementOverrides(
                    "text-lg font-semibold mb-2",
                    `features[${index}].title`,
                    styleOverrides
                  )}
                  style={{ fontFamily: theme.fontFamily }}
                >
                  {feature.title}
                </h3>
                <p
                  className={applyElementOverrides(
                    "text-sm opacity-80 leading-relaxed",
                    `features[${index}].description`,
                    styleOverrides
                  )}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
