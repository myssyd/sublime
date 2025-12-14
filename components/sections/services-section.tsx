"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface ServicesSectionProps {
  content: SectionContent<"services">;
  theme: Theme;
  className?: string;
}

function getIcon(iconName?: string) {
  if (!iconName) return HugeIcons.Settings01Icon;
  const icons = HugeIcons as Record<string, any>;
  return icons[iconName] || HugeIcons.Settings01Icon;
}

export function ServicesSection({
  content,
  theme,
  className,
}: ServicesSectionProps) {
  const layoutClasses = {
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    list: "flex flex-col gap-4 max-w-3xl mx-auto",
    cards: "grid grid-cols-1 md:grid-cols-2 gap-6",
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
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.headline}
          </h2>
          {content.subheadline && (
            <p
              className="text-lg opacity-80 max-w-2xl mx-auto"
              style={{ fontFamily: theme.fontFamily }}
            >
              {content.subheadline}
            </p>
          )}
        </div>

        <div className={layoutClasses[content.layout || "grid"]}>
          {(content.services || []).map((service, index) => {
            if (content.layout === "list") {
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-black/5 transition-colors"
                >
                  {service.icon && (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${theme.primaryColor}15` }}
                    >
                      <HugeiconsIcon
                        icon={getIcon(service.icon)}
                        className="w-6 h-6"
                        style={{ color: theme.primaryColor }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h3
                        className="text-lg font-semibold"
                        style={{ fontFamily: theme.fontFamily }}
                      >
                        {service.title}
                      </h3>
                      {service.price && (
                        <span
                          className="font-semibold"
                          style={{ color: theme.primaryColor }}
                        >
                          {service.price}
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-70 mt-1">
                      {service.description}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className="p-6 rounded-xl border group hover:shadow-lg transition-shadow"
                style={{ borderColor: `${theme.textColor}15` }}
              >
                {service.icon && (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
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
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  {service.title}
                </h3>
                <p className="text-sm opacity-70 mb-4">{service.description}</p>
                {service.price && (
                  <p
                    className="font-semibold mb-4"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
