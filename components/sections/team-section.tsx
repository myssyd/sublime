"use client";

import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";
import { Linkedin01Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface TeamSectionProps {
  content: SectionContent<"team">;
  theme: Theme;
  className?: string;
}

export function TeamSection({ content, theme, className }: TeamSectionProps) {
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

        <div
          className={cn(
            "grid gap-8",
            content.members.length <= 3
              ? "grid-cols-1 md:grid-cols-3"
              : content.members.length === 4
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {content.members.map((member, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-4 mx-auto w-40 h-40">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover"
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
                className="text-lg font-semibold"
                style={{ fontFamily: theme.fontFamily }}
              >
                {member.name}
              </h3>
              <p
                className="text-sm opacity-70 mb-2"
                style={{ color: theme.primaryColor }}
              >
                {member.role}
              </p>
              {member.bio && (
                <p className="text-sm opacity-70 mb-3">{member.bio}</p>
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
