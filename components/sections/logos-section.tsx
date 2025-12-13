"use client";

import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";

interface LogosSectionProps {
  content: SectionContent<"logos">;
  theme: Theme;
  className?: string;
}

export function LogosSection({ content, theme, className }: LogosSectionProps) {
  return (
    <section
      className={cn("px-6 py-12 md:px-12 lg:px-20", className)}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <p
          className="text-center text-sm uppercase tracking-wider opacity-60 mb-8"
          style={{ fontFamily: theme.fontFamily }}
        >
          {content.headline}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {content.logos.map((logo, index) => {
            const LogoImage = (
              <img
                src={logo.src}
                alt={logo.alt}
                className="h-8 md:h-10 w-auto opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
              />
            );

            if (logo.url) {
              return (
                <a
                  key={index}
                  href={logo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  {LogoImage}
                </a>
              );
            }

            return (
              <div key={index} className="flex-shrink-0">
                {LogoImage}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
