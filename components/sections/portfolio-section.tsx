"use client";

import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PortfolioSectionProps {
  content: SectionContent<"portfolio">;
  theme: Theme;
  className?: string;
}

export function PortfolioSection({
  content,
  theme,
  className,
}: PortfolioSectionProps) {
  const layoutClasses = {
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    masonry: "columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6",
    carousel: "flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4",
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
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.headline}
          </h2>
        </div>

        <div className={layoutClasses[content.layout || "grid"]}>
          {content.projects.map((project, index) => (
            <div
              key={index}
              className={cn(
                "group relative overflow-hidden rounded-xl",
                content.layout === "carousel" && "min-w-[300px] snap-center",
                content.layout === "masonry" && "break-inside-avoid"
              )}
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6"
              >
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {project.category && (
                    <span
                      className="text-xs uppercase tracking-wider opacity-70"
                      style={{ color: theme.accentColor }}
                    >
                      {project.category}
                    </span>
                  )}
                  <h3
                    className="text-xl font-semibold text-white mt-1"
                    style={{ fontFamily: theme.fontFamily }}
                  >
                    {project.title}
                  </h3>
                  <p className="text-sm text-white/80 mt-2 line-clamp-2">
                    {project.description}
                  </p>
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium mt-3 text-white hover:underline"
                    >
                      View Project
                      <HugeiconsIcon
                        icon={ArrowUpRight01Icon}
                        className="w-4 h-4"
                      />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
