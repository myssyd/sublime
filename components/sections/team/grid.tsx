"use client";

import { cn } from "@/lib/utils";
import { Linkedin01Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

export function TeamGrid({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"team">) {
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
            cn(
              "grid gap-8",
              (content.members || []).length <= 3
                ? "grid-cols-1 md:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            ),
            "members",
            styleOverrides
          )}
        >
          {(content.members || []).map((member, index) => (
            <div
              key={index}
              className={applyElementOverrides(
                "text-center group",
                `members[${index}].card`,
                styleOverrides
              )}
            >
              <div className="relative mb-4 mx-auto w-40 h-40">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className={applyElementOverrides(
                      "w-full h-full rounded-full object-cover",
                      `members[${index}].image`,
                      styleOverrides
                    )}
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-4xl font-bold"
                    style={{
                      backgroundColor: `${theme.primaryColor}20`,
                      color: theme.primaryColor,
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3
                className={applyElementOverrides(
                  "text-lg font-semibold",
                  `members[${index}].name`,
                  styleOverrides
                )}
                style={{ fontFamily: theme.fontFamily }}
              >
                {member.name}
              </h3>
              <p
                className={applyElementOverrides(
                  "text-sm opacity-70 mb-2",
                  `members[${index}].role`,
                  styleOverrides
                )}
                style={{ color: theme.primaryColor }}
              >
                {member.role}
              </p>
              {member.bio && (
                <p
                  className={applyElementOverrides(
                    "text-sm opacity-70 mb-3",
                    `members[${index}].bio`,
                    styleOverrides
                  )}
                >
                  {member.bio}
                </p>
              )}
              {member.social && (
                <div className="flex justify-center gap-3">
                  {member.social.twitter && (
                    <a
                      href={member.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <HugeiconsIcon icon={NewTwitterIcon} className="w-5 h-5" />
                    </a>
                  )}
                  {member.social.linkedin && (
                    <a
                      href={member.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <HugeiconsIcon icon={Linkedin01Icon} className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
