"use client";

import React from "react";
import { SectionType } from "@/lib/sections/definitions";
import { getTemplatesForSection } from "@/components/sections/registry";
import { DEFAULT_TEMPLATES } from "@/lib/sections/templates";
import { cn } from "@/lib/utils";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TEMPLATE_PREVIEWS } from "@/lib/sections/template-previews";

interface TemplatePickerProps {
  sectionType: SectionType;
  currentTemplateId: string | undefined;
  onTemplateSelect: (templateId: string) => void;
  isLoading?: boolean;
}

export function TemplatePicker({
  sectionType,
  currentTemplateId,
  onTemplateSelect,
  isLoading = false,
}: TemplatePickerProps) {
  const templates = getTemplatesForSection(sectionType);
  const defaultTemplateId = DEFAULT_TEMPLATES[sectionType];
  const activeTemplateId = currentTemplateId || defaultTemplateId;

  if (templates.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No templates available for this section type.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Templates
        </p>
        <span className="text-[10px] text-muted-foreground">
          {templates.length} available
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((template) => {
          const isActive = template.metadata.id === activeTemplateId;
          const preview = TEMPLATE_PREVIEWS[template.metadata.id];

          return (
            <button
              key={template.metadata.id}
              className={cn(
                "relative flex flex-col rounded-lg text-left transition-all overflow-hidden",
                "border-2",
                isActive
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-muted-foreground/30",
                isLoading && "opacity-50 pointer-events-none"
              )}
              onClick={() => {
                if (!isActive && !isLoading) {
                  onTemplateSelect(template.metadata.id);
                }
              }}
              disabled={isLoading}
            >
              {/* Preview thumbnail */}
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {preview ? (
                  <TemplatePreviewSVG preview={preview} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 9h16M9 4v16"
                      />
                    </svg>
                  </div>
                )}
                {isActive && (
                  <div className="absolute top-1.5 right-1.5">
                    <div className="bg-primary rounded-full p-0.5">
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        className="w-3.5 h-3.5 text-primary-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Template info */}
              <div className="p-2">
                <span className="text-xs font-medium truncate block">
                  {template.metadata.name}
                </span>
                {template.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {template.metadata.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1 py-0.5 bg-muted rounded text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TemplatePreviewProps {
  preview: {
    layout: "centered" | "split-left" | "split-right" | "grid" | "cards" | "rows" | "banner" | "alternating" | "accordion" | "carousel" | "masonry" | "comparison" | "minimal";
    elements: Array<{
      type: "headline" | "text" | "button" | "image" | "card" | "icon" | "avatar" | "badge";
      position?: string;
      size?: "sm" | "md" | "lg";
    }>;
    accent?: boolean;
  };
}

function TemplatePreviewSVG({ preview }: TemplatePreviewProps) {
  const { layout, elements, accent } = preview;

  return (
    <svg
      viewBox="0 0 120 90"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Background */}
      <rect width="120" height="90" fill="currentColor" className="text-muted" />

      {/* Layout-specific rendering */}
      {layout === "centered" && (
        <g className="text-muted-foreground/30">
          {elements.map((el, i) => renderElement(el, i, "centered"))}
        </g>
      )}

      {layout === "split-left" && (
        <g className="text-muted-foreground/30">
          <rect x="65" y="10" width="50" height="70" rx="2" fill="currentColor" className="text-muted-foreground/20" />
          {elements.map((el, i) => renderElement(el, i, "split-left"))}
        </g>
      )}

      {layout === "split-right" && (
        <g className="text-muted-foreground/30">
          <rect x="5" y="10" width="50" height="70" rx="2" fill="currentColor" className="text-muted-foreground/20" />
          {elements.map((el, i) => renderElement(el, i, "split-right"))}
        </g>
      )}

      {layout === "grid" && (
        <g className="text-muted-foreground/30">
          {[0, 1, 2].map((col) => (
            <g key={col}>
              <rect
                x={10 + col * 35}
                y="35"
                width="30"
                height="45"
                rx="2"
                fill="currentColor"
                className="text-muted-foreground/10"
              />
              <circle cx={25 + col * 35} cy="48" r="6" fill="currentColor" />
              <rect x={15 + col * 35} y="58" width="20" height="3" rx="1" fill="currentColor" />
              <rect x={12 + col * 35} y="64" width="26" height="2" rx="1" fill="currentColor" className="text-muted-foreground/20" />
              <rect x={14 + col * 35} y="68" width="22" height="2" rx="1" fill="currentColor" className="text-muted-foreground/20" />
            </g>
          ))}
          <rect x="30" y="10" width="60" height="5" rx="1" fill="currentColor" />
          <rect x="35" y="18" width="50" height="3" rx="1" fill="currentColor" className="text-muted-foreground/20" />
        </g>
      )}

      {layout === "cards" && (
        <g className="text-muted-foreground/30">
          {[0, 1, 2].map((col) => (
            <g key={col}>
              <rect
                x={8 + col * 36}
                y="32"
                width="32"
                height="50"
                rx="3"
                fill="currentColor"
                className="text-muted-foreground/15"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <circle cx={24 + col * 36} cy="46" r="5" fill="currentColor" />
              <rect x={14 + col * 36} y="56" width="20" height="3" rx="1" fill="currentColor" />
              <rect x={11 + col * 36} y="62" width="26" height="2" rx="1" fill="currentColor" className="text-muted-foreground/20" />
              <rect x={13 + col * 36} y="66" width="22" height="2" rx="1" fill="currentColor" className="text-muted-foreground/20" />
            </g>
          ))}
          <rect x="30" y="8" width="60" height="5" rx="1" fill="currentColor" />
          <rect x="35" y="16" width="50" height="3" rx="1" fill="currentColor" className="text-muted-foreground/20" />
        </g>
      )}

      {layout === "rows" && (
        <g className="text-muted-foreground/30">
          <rect x="30" y="8" width="60" height="5" rx="1" fill="currentColor" />
          {[0, 1, 2].map((row) => (
            <g key={row}>
              <rect
                x="10"
                y={22 + row * 22}
                width="100"
                height="18"
                rx="2"
                fill="currentColor"
                className="text-muted-foreground/10"
              />
              <circle cx="22" cy={31 + row * 22} r="5" fill="currentColor" />
              <rect x="32" y={28 + row * 22} width="40" height="3" rx="1" fill="currentColor" />
              <rect x="32" y={33 + row * 22} width="60" height="2" rx="1" fill="currentColor" className="text-muted-foreground/20" />
            </g>
          ))}
        </g>
      )}

      {layout === "banner" && (
        <g className="text-muted-foreground/30">
          <rect x="10" y="25" width="100" height="40" rx="3" fill="currentColor" className={accent ? "text-primary/20" : "text-muted-foreground/15"} />
          <rect x="25" y="35" width="70" height="5" rx="1" fill="currentColor" />
          <rect x="35" y="43" width="50" height="3" rx="1" fill="currentColor" className="text-muted-foreground/20" />
          <rect x="45" y="52" width="30" height="8" rx="2" fill="currentColor" className={accent ? "text-primary/50" : ""} />
        </g>
      )}

      {layout === "alternating" && (
        <g className="text-muted-foreground/30">
          <rect x="30" y="5" width="60" height="4" rx="1" fill="currentColor" />
          {[0, 1].map((row) => (
            <g key={row}>
              <rect
                x={row % 2 === 0 ? 10 : 62}
                y={18 + row * 35}
                width="48"
                height="30"
                rx="2"
                fill="currentColor"
                className="text-muted-foreground/15"
              />
              <rect
                x={row % 2 === 0 ? 65 : 10}
                y={22 + row * 35}
                width="35"
                height="4"
                rx="1"
                fill="currentColor"
              />
              <rect
                x={row % 2 === 0 ? 65 : 10}
                y={29 + row * 35}
                width="45"
                height="2"
                rx="1"
                fill="currentColor"
                className="text-muted-foreground/20"
              />
              <rect
                x={row % 2 === 0 ? 65 : 10}
                y={33 + row * 35}
                width="40"
                height="2"
                rx="1"
                fill="currentColor"
                className="text-muted-foreground/20"
              />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function renderElement(
  el: TemplatePreviewProps["preview"]["elements"][0],
  index: number,
  layout: string
): React.ReactNode {
  const yOffset = index * 12;

  if (layout === "centered") {
    switch (el.type) {
      case "headline":
        return (
          <rect
            key={index}
            x="25"
            y={25 + yOffset}
            width="70"
            height={el.size === "lg" ? 8 : 5}
            rx="1"
            fill="currentColor"
          />
        );
      case "text":
        return (
          <rect
            key={index}
            x="30"
            y={25 + yOffset}
            width="60"
            height="3"
            rx="1"
            fill="currentColor"
            className="text-muted-foreground/20"
          />
        );
      case "button":
        return (
          <rect
            key={index}
            x="45"
            y={25 + yOffset}
            width="30"
            height="8"
            rx="2"
            fill="currentColor"
          />
        );
    }
  }

  if (layout === "split-left") {
    switch (el.type) {
      case "headline":
        return (
          <rect key={index} x="8" y={20 + yOffset} width="50" height="5" rx="1" fill="currentColor" />
        );
      case "text":
        return (
          <rect
            key={index}
            x="8"
            y={20 + yOffset}
            width="45"
            height="3"
            rx="1"
            fill="currentColor"
            className="text-muted-foreground/20"
          />
        );
      case "button":
        return (
          <rect key={index} x="8" y={20 + yOffset} width="25" height="7" rx="2" fill="currentColor" />
        );
    }
  }

  if (layout === "split-right") {
    switch (el.type) {
      case "headline":
        return (
          <rect key={index} x="62" y={20 + yOffset} width="50" height="5" rx="1" fill="currentColor" />
        );
      case "text":
        return (
          <rect
            key={index}
            x="62"
            y={20 + yOffset}
            width="45"
            height="3"
            rx="1"
            fill="currentColor"
            className="text-muted-foreground/20"
          />
        );
      case "button":
        return (
          <rect key={index} x="62" y={20 + yOffset} width="25" height="7" rx="2" fill="currentColor" />
        );
    }
  }

  return null;
}
