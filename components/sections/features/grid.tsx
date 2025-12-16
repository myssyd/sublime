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
  const icons = HugeIcons as Record<string, any>;
  return icons[iconName] || icons["Rocket01Icon"];
}

export function FeaturesGrid({
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
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
            "features",
            styleOverrides
          )}
        >
          {(content.features || []).map((feature, index) => (
            <div
              key={index}
              className={applyElementOverrides(
                "text-center",
                `features[${index}]`,
                styleOverrides
              )}
            >
              <div
                className={applyElementOverrides(
                  "w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4",
                  `features[${index}].icon`,
                  styleOverrides
                )}
                style={{ backgroundColor: `${theme.primaryColor}20` }}
              >
                <HugeiconsIcon
                  icon={getIcon(feature.icon)}
                  className="w-7 h-7"
                  style={{ color: theme.primaryColor }}
                />
              </div>
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
                  "text-sm opacity-80",
                  `features[${index}].description`,
                  styleOverrides
                )}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
