"use client";

import React from "react";
import type { BlockRendererProps } from "../index";
import type { TeamMemberCardProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const socialIconMap: Record<string, keyof typeof HugeIcons> = {
  twitter: "NewTwitterIcon",
  linkedin: "Linkedin01Icon",
  github: "GithubIcon",
  instagram: "InstagramIcon",
  facebook: "Facebook01Icon",
  website: "Globe02Icon",
};

export function TeamMemberCardBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"team-member-card">) {
  const props = block.props as TeamMemberCardProps;

  return (
    <div
      className={cn(
        "p-6 rounded-xl border bg-card text-card-foreground text-center",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{ fontFamily: theme.fontFamily }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {props.avatar ? (
        <img
          src={props.avatar}
          alt={props.name}
          className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
        />
      ) : (
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold text-white mx-auto mb-4"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {props.name.charAt(0).toUpperCase()}
        </div>
      )}

      <h3
        className="text-lg font-semibold mb-1"
        style={{ color: theme.textColor }}
      >
        {props.name}
      </h3>
      <p
        className="text-sm opacity-70 mb-3"
        style={{ color: theme.textColor }}
      >
        {props.role}
      </p>

      {props.bio && (
        <p
          className="text-sm opacity-60 mb-4"
          style={{ color: theme.textColor }}
        >
          {props.bio}
        </p>
      )}

      {props.socialLinks && props.socialLinks.length > 0 && (
        <div className="flex justify-center gap-3">
          {props.socialLinks.map((link, index) => {
            const iconName = socialIconMap[link.platform.toLowerCase()];
            const IconComponent = iconName ? HugeIcons[iconName] : null;

            return (
              <a
                key={index}
                href={isEditing ? undefined : link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                style={{ backgroundColor: `${theme.textColor}10` }}
                onClick={isEditing ? (e) => e.preventDefault() : undefined}
              >
                {IconComponent && (
                  <HugeiconsIcon
                    icon={IconComponent}
                    className="w-4 h-4"
                    color={theme.textColor}
                  />
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
