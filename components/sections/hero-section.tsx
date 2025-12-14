"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";

interface HeroSectionProps {
  content: SectionContent<"hero">;
  theme: Theme;
  className?: string;
}

export function HeroSection({ content, theme, className }: HeroSectionProps) {
  const layoutClasses = {
    centered: "text-center items-center",
    "split-left": "text-left items-start md:flex-row",
    "split-right": "text-right items-end md:flex-row-reverse",
  };

  return (
    <section
      className={cn(
        "relative min-h-[80vh] flex flex-col justify-center px-6 py-20 md:px-12 lg:px-20",
        layoutClasses[content.layout || "centered"],
        className
      )}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        backgroundImage: content.backgroundImage
          ? `url(${content.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {content.backgroundImage && (
        <div
          className="absolute inset-0 bg-black/40"
          style={{ backgroundColor: `${theme.backgroundColor}80` }}
        />
      )}

      <div
        className={cn(
          "relative z-10 max-w-4xl mx-auto flex flex-col gap-6",
          content.layout === "centered" && "items-center"
        )}
      >
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
          style={{ fontFamily: theme.fontFamily }}
        >
          {content.headline}
        </h1>

        <p
          className="text-lg md:text-xl opacity-90 max-w-2xl"
          style={{ fontFamily: theme.fontFamily }}
        >
          {content.subheadline}
        </p>

        {content.cta && (
          <div className="flex flex-wrap gap-4 mt-4">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold"
              style={{
                backgroundColor: theme.primaryColor,
                color: theme.backgroundColor,
              }}
              asChild
            >
              <a href={content.cta.url || "#"}>{content.cta.text || "Get Started"}</a>
            </Button>

            {content.secondaryCta && (
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base font-semibold"
                style={{
                  borderColor: theme.primaryColor,
                  color: theme.textColor,
                }}
                asChild
              >
                <a href={content.secondaryCta.url || "#"}>{content.secondaryCta.text || "Learn More"}</a>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
