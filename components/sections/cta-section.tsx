"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";

interface CTASectionProps {
  content: SectionContent<"cta">;
  theme: Theme;
  className?: string;
}

export function CTASection({ content, theme, className }: CTASectionProps) {
  const styleClasses = {
    simple: "",
    gradient: "bg-gradient-to-r",
    "image-bg": "bg-cover bg-center",
  };

  return (
    <section
      className={cn(
        "px-6 py-20 md:px-12 lg:px-20",
        styleClasses[content.style || "simple"],
        className
      )}
      style={{
        backgroundColor:
          content.style === "gradient" ? undefined : theme.primaryColor,
        backgroundImage:
          content.style === "gradient"
            ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
            : undefined,
        color: theme.backgroundColor,
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          style={{ fontFamily: theme.fontFamily }}
        >
          {content.headline}
        </h2>

        {content.subheadline && (
          <p
            className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto"
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.subheadline}
          </p>
        )}

        {content.cta && (
          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold"
            style={{
              backgroundColor: theme.backgroundColor,
              color: theme.primaryColor,
            }}
            asChild
          >
            <a href={content.cta.url || "#"}>{content.cta.text || "Get Started"}</a>
          </Button>
        )}
      </div>
    </section>
  );
}
