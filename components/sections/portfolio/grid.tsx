"use client";

import { cn } from "@/lib/utils";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

export function PortfolioGrid({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"portfolio">) {
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
              "text-3xl md:text-4xl font-bold",
              "headline",
              styleOverrides
            )}
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.headline}
          </h2>
        </div>

        <div
          className={applyElementOverrides(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
            "projects",
            styleOverrides
          )}
        >
          {(content.projects || []).map((project, index) => (
            <div
              key={index}
              className={applyElementOverrides(
                "group relative rounded-xl overflow-hidden",
                `projects[${index}].card`,
                styleOverrides
              )}
            >
              <img
                src={project.image}
                alt={project.title}
                className={applyElementOverrides(
                  "w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105",
                  `projects[${index}].image`,
                  styleOverrides
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                {project.category && (
                  <span
                    className="text-xs uppercase tracking-wider mb-2"
                    style={{ color: theme.accentColor }}
                  >
                    {project.category}
                  </span>
                )}
                <h3
                  className={applyElementOverrides(
                    "text-xl font-semibold text-white mb-2",
                    `projects[${index}].title`,
                    styleOverrides
                  )}
                >
                  {project.title}
                </h3>
                <p
                  className={applyElementOverrides(
                    "text-sm text-white/80",
                    `projects[${index}].description`,
                    styleOverrides
                  )}
                >
                  {project.description}
                </p>
              </div>
              {project.link && (
                <a
                  href={project.link}
                  className="absolute inset-0"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
