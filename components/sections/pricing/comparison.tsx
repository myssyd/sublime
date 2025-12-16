"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tick01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

/**
 * PricingComparison - Feature comparison table
 *
 * Displays pricing tiers as columns with feature rows for easy comparison.
 * Highlighted tier gets visual emphasis.
 */
export function PricingComparison({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"pricing">) {
  const tiers = content.tiers || [];

  // Collect all unique features across tiers
  const allFeatures = Array.from(
    new Set(tiers.flatMap((tier) => tier.features || []))
  );

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

        {/* Mobile: Cards view */}
        <div className="lg:hidden">
          <div
            className={applyElementOverrides(
              "grid gap-6 md:grid-cols-2",
              "tiers",
              styleOverrides
            )}
          >
            {tiers.map((tier, index) => (
              <div
                key={index}
                className={applyElementOverrides(
                  cn(
                    "rounded-2xl p-6 flex flex-col",
                    tier.highlighted ? "ring-2 shadow-lg" : "border"
                  ),
                  `tiers[${index}].card`,
                  styleOverrides
                )}
                style={{
                  borderColor: tier.highlighted
                    ? theme.primaryColor
                    : `${theme.textColor}20`,
                  // @ts-expect-error - CSS custom property
                  "--tw-ring-color": theme.primaryColor,
                }}
              >
                <h3 className="text-lg font-semibold mb-1">{tier.name}</h3>
                <div className="text-3xl font-bold mb-4">{tier.price}</div>
                <ul className="space-y-2 mb-6 flex-1">
                  {(tier.features || []).map((feature, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm">
                      <HugeiconsIcon
                        icon={Tick01Icon}
                        className="w-4 h-4"
                        style={{ color: theme.primaryColor }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                {tier.cta && (
                  <Button
                    className="w-full h-11"
                    style={{
                      backgroundColor: tier.highlighted
                        ? theme.primaryColor
                        : "transparent",
                      color: tier.highlighted
                        ? theme.backgroundColor
                        : theme.primaryColor,
                      borderColor: theme.primaryColor,
                    }}
                    variant={tier.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <a href={tier.cta.url || "#"}>{tier.cta.text}</a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Comparison table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-4 w-1/4" />
                {tiers.map((tier, index) => (
                  <th
                    key={index}
                    className={cn(
                      "p-6 text-center",
                      tier.highlighted && "relative"
                    )}
                  >
                    {tier.highlighted && (
                      <div
                        className="absolute inset-x-0 -top-3 h-1 rounded-t-full"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                    )}
                    <div
                      className={applyElementOverrides(
                        cn(
                          "rounded-t-xl p-6",
                          tier.highlighted && "shadow-lg"
                        ),
                        `tiers[${index}].card`,
                        styleOverrides
                      )}
                      style={{
                        backgroundColor: tier.highlighted
                          ? `${theme.primaryColor}10`
                          : undefined,
                      }}
                    >
                      <div className="text-lg font-semibold mb-2">
                        {tier.name}
                      </div>
                      <div
                        className="text-4xl font-bold"
                        style={{ fontFamily: theme.fontFamily }}
                      >
                        {tier.price}
                      </div>
                      <div className="text-sm opacity-70 mt-1">
                        {tier.description}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFeatures.map((feature, fi) => (
                <tr
                  key={fi}
                  className="border-t"
                  style={{ borderColor: `${theme.textColor}10` }}
                >
                  <td className="p-4 text-sm">{feature}</td>
                  {tiers.map((tier, ti) => {
                    const hasFeature = (tier.features || []).includes(feature);
                    return (
                      <td
                        key={ti}
                        className="p-4 text-center"
                        style={{
                          backgroundColor: tier.highlighted
                            ? `${theme.primaryColor}05`
                            : undefined,
                        }}
                      >
                        {hasFeature ? (
                          <HugeiconsIcon
                            icon={Tick01Icon}
                            className="w-5 h-5 mx-auto"
                            style={{ color: theme.primaryColor }}
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            className="w-5 h-5 mx-auto opacity-30"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="p-4" />
                {tiers.map((tier, index) => (
                  <td
                    key={index}
                    className="p-6"
                    style={{
                      backgroundColor: tier.highlighted
                        ? `${theme.primaryColor}05`
                        : undefined,
                    }}
                  >
                    {tier.cta && (
                      <Button
                        className={applyElementOverrides(
                          "w-full h-12 font-semibold",
                          `tiers[${index}].cta`,
                          styleOverrides
                        )}
                        style={{
                          backgroundColor: tier.highlighted
                            ? theme.primaryColor
                            : "transparent",
                          color: tier.highlighted
                            ? theme.backgroundColor
                            : theme.primaryColor,
                          borderColor: theme.primaryColor,
                        }}
                        variant={tier.highlighted ? "default" : "outline"}
                        asChild
                      >
                        <a href={tier.cta.url || "#"}>{tier.cta.text}</a>
                      </Button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
