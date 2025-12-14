"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PricingSectionProps {
  content: SectionContent<"pricing">;
  theme: Theme;
  className?: string;
}

export function PricingSection({
  content,
  theme,
  className,
}: PricingSectionProps) {
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

        <div
          className={cn(
            "grid gap-8",
            (content.tiers || []).length === 1 && "max-w-md mx-auto",
            (content.tiers || []).length === 2 && "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto",
            (content.tiers || []).length >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {(content.tiers || []).map((tier, index) => (
            <div
              key={index}
              className={cn(
                "relative rounded-2xl p-8 flex flex-col",
                tier.highlighted
                  ? "ring-2 shadow-xl"
                  : "border"
              )}
              style={{
                borderColor: tier.highlighted
                  ? theme.primaryColor
                  : `${theme.textColor}20`,
                backgroundColor: tier.highlighted
                  ? `${theme.primaryColor}08`
                  : "transparent",
                // @ts-expect-error - CSS custom property for ring color
                "--tw-ring-color": theme.primaryColor,
              }}
            >
              {tier.highlighted && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: theme.primaryColor,
                    color: theme.backgroundColor,
                  }}
                >
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  {tier.name}
                </h3>
                <p className="text-sm opacity-70 mb-4">{tier.description}</p>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-4xl font-bold"
                    style={{ fontFamily: theme.fontFamily }}
                  >
                    {tier.price}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {(tier.features || []).map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <HugeiconsIcon
                      icon={Tick01Icon}
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: theme.primaryColor }}
                    />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.cta && (
                <Button
                  className={cn(
                    "w-full h-12 font-semibold",
                    tier.highlighted ? "" : "border"
                  )}
                  style={
                    tier.highlighted
                      ? {
                          backgroundColor: theme.primaryColor,
                          color: theme.backgroundColor,
                        }
                      : {
                          backgroundColor: "transparent",
                          borderColor: theme.primaryColor,
                          color: theme.primaryColor,
                        }
                  }
                  asChild
                >
                  <a href={tier.cta.url || "#"}>{tier.cta.text || "Get Started"}</a>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
