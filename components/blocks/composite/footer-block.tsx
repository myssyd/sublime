"use client";

import React from "react";
import Link from "next/link";
import type { BlockRendererProps } from "../index";
import type { FooterBlockProps } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const socialIconMap: Record<string, keyof typeof HugeIcons> = {
  twitter: "NewTwitterIcon",
  linkedin: "Linkedin01Icon",
  github: "GithubIcon",
  instagram: "InstagramIcon",
  facebook: "Facebook01Icon",
  youtube: "YoutubeIcon",
};

export function FooterBlockComponent({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"footer-block">) {
  const props = block.props as FooterBlockProps;

  return (
    <footer
      className={cn(
        "w-full px-4 md:px-6 py-12 border-t",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{ fontFamily: theme.fontFamily, backgroundColor: theme.backgroundColor }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              {props.logo && (
                <img src={props.logo} alt="Logo" className="h-8 w-auto" />
              )}
              {props.logoText && (
                <span
                  className="text-xl font-bold"
                  style={{ color: theme.textColor }}
                >
                  {props.logoText}
                </span>
              )}
            </div>
            {props.description && (
              <p
                className="text-sm opacity-70 mb-4"
                style={{ color: theme.textColor }}
              >
                {props.description}
              </p>
            )}
            {props.socialLinks && props.socialLinks.length > 0 && (
              <div className="flex gap-3">
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

          {/* Link Columns */}
          {props.columns?.map((column, colIndex) => (
            <div key={colIndex}>
              <h4
                className="font-semibold mb-4"
                style={{ color: theme.textColor }}
              >
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={isEditing ? "#" : link.href}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                      style={{ color: theme.textColor }}
                      onClick={isEditing ? (e) => e.preventDefault() : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        {props.copyright && (
          <div
            className="pt-8 border-t text-sm opacity-60 text-center"
            style={{ color: theme.textColor }}
          >
            {props.copyright}
          </div>
        )}
      </div>
    </footer>
  );
}
