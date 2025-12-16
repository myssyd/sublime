"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

function getIcon(iconName?: string) {
  if (!iconName) return HugeIcons.Settings01Icon;
  const icons = HugeIcons as Record<string, any>;
  return icons[iconName] || HugeIcons.Settings01Icon;
}

export function ServicesGrid({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"services">) {
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
        <div className="text-center mb-16">
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

        <div
          className={applyElementOverrides(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
            "services",
            styleOverrides
          )}
        >
          {(content.services || []).map((service, index) => (
            <div
              key={index}
              className={applyElementOverrides(
                "p-6 rounded-xl border group hover:shadow-lg transition-shadow",
                `services[${index}].card`,
                styleOverrides
              )}
              style={{ borderColor: `${theme.textColor}15` }}
            >
              {service.icon && (
                <div
                  className={applyElementOverrides(
                    "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
                    `services[${index}].icon`,
                    styleOverrides
                  )}
                  style={{ backgroundColor: `${theme.primaryColor}15` }}
                >
                  <HugeiconsIcon
                    icon={getIcon(service.icon)}
                    className="w-6 h-6"
                    style={{ color: theme.primaryColor }}
                  />
                </div>
              )}
              <h3
                className={applyElementOverrides(
                  "text-lg font-semibold mb-2",
                  `services[${index}].title`,
                  styleOverrides
                )}
                style={{ fontFamily: theme.fontFamily }}
              >
                {service.title}
              </h3>
              <p
                className={applyElementOverrides(
                  "text-sm opacity-70 mb-4",
                  `services[${index}].description`,
                  styleOverrides
                )}
              >
                {service.description}
              </p>
              {service.price && (
                <p
                  className={applyElementOverrides(
                    "font-semibold mb-4",
                    `services[${index}].price`,
                    styleOverrides
                  )}
                  style={{ color: theme.primaryColor }}
                >
                  {service.price}
                </p>
              )}
              {service.link && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto font-medium group-hover:underline"
                  style={{ color: theme.primaryColor }}
                  asChild
                >
                  <a href={service.link}>
                    Learn more
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="w-4 h-4 ml-1"
                    />
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
