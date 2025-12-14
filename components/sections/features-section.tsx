"use client";

import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface FeaturesSectionProps {
  content: SectionContent<"features">;
  theme: Theme;
  className?: string;
}

// Helper to get icon component by name
function getIcon(iconName: string) {
  const icons = HugeIcons as Record<string, any>;
  return icons[iconName] || icons["Rocket01Icon"];
}

export function FeaturesSection({
  content,
  theme,
  className,
}: FeaturesSectionProps) {
  const layoutClasses = {
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
    alternating: "flex flex-col gap-16",
    cards: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
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
        {(content.headline || content.subheadline) && (
          <div className="text-center mb-16">
            {content.headline && (
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ fontFamily: theme.fontFamily }}
              >
                {content.headline}
              </h2>
            )}
            {content.subheadline && (
              <p
                className="text-lg opacity-80 max-w-2xl mx-auto"
                style={{ fontFamily: theme.fontFamily }}
              >
                {content.subheadline}
              </p>
            )}
          </div>
        )}

        <div className={layoutClasses[content.layout || "grid"]}>
          {(content.features || []).map((feature, index) => {
            if (content.layout === "alternating") {
              return (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col md:flex-row gap-8 items-center",
                    index % 2 === 1 && "md:flex-row-reverse"
                  )}
                >
                  <div
                    className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${theme.primaryColor}20` }}
                  >
                    <HugeiconsIcon
                      icon={getIcon(feature.icon)}
                      className="w-10 h-10"
                      style={{ color: theme.primaryColor }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{ fontFamily: theme.fontFamily }}
                    >
                      {feature.title}
                    </h3>
                    <p className="opacity-80">{feature.description}</p>
                  </div>
                </div>
              );
            }

            if (content.layout === "cards") {
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl border"
                  style={{
                    borderColor: `${theme.textColor}20`,
                    backgroundColor: `${theme.primaryColor}05`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${theme.primaryColor}20` }}
                  >
                    <HugeiconsIcon
                      icon={getIcon(feature.icon)}
                      className="w-6 h-6"
                      style={{ color: theme.primaryColor }}
                    />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ fontFamily: theme.fontFamily }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm opacity-80">{feature.description}</p>
                </div>
              );
            }

            // Default grid layout
            return (
              <div key={index} className="text-center">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${theme.primaryColor}20` }}
                >
                  <HugeiconsIcon
                    icon={getIcon(feature.icon)}
                    className="w-7 h-7"
                    style={{ color: theme.primaryColor }}
                  />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm opacity-80">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
