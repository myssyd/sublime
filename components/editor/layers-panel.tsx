"use client";

import { useState } from "react";
import { getSectionDisplayName, getSectionIcon } from "@/lib/sections/metadata";
import { SectionType } from "@/lib/sections/definitions";
import { getTemplatesForSection } from "@/components/sections/registry";
import { getTemplate } from "@/components/sections/registry";
import { DEFAULT_TEMPLATES } from "@/lib/sections/templates";
import { HugeiconsIcon } from "@hugeicons/react";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

interface Section {
  _id: string;
  type: string;
  templateId?: string;
  order: number;
}

interface LayersPanelProps {
  sections: Section[];
  selectedSectionId: string | null;
  onSectionSelect: (id: string) => void;
  onTemplateChange?: (sectionId: string, templateId: string) => void;
  isTemplateLoading?: boolean;
}

export function LayersPanel({
  sections,
  selectedSectionId,
  onSectionSelect,
  onTemplateChange,
  isTemplateLoading,
}: LayersPanelProps) {
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    null
  );

  const getIcon = (iconName: string) => {
    const icon = (HugeIcons as Record<string, unknown>)[iconName];
    return icon || HugeIcons.FileIcon;
  };

  const handleSectionClick = (sectionId: string) => {
    onSectionSelect(sectionId);
    // Toggle expansion when clicking the same section
    if (expandedSectionId === sectionId) {
      setExpandedSectionId(null);
    } else {
      setExpandedSectionId(sectionId);
    }
  };

  const handleTemplateSelect = (sectionId: string, templateId: string) => {
    if (onTemplateChange && !isTemplateLoading) {
      onTemplateChange(sectionId, templateId);
    }
  };

  return (
    <div className="p-2 space-y-1">
      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground p-3 text-center">
          No sections yet
        </p>
      ) : (
        sections.map((section, index) => {
          const iconName = getSectionIcon(section.type as SectionType);
          const icon = getIcon(iconName);
          const isSelected = selectedSectionId === section._id;
          const isExpanded = expandedSectionId === section._id;

          // Get templates for this section type
          const templates = getTemplatesForSection(section.type as SectionType);
          const defaultTemplateId = DEFAULT_TEMPLATES[section.type as SectionType];
          const currentTemplateId = section.templateId || defaultTemplateId;
          const currentTemplate = getTemplate(currentTemplateId);

          return (
            <div key={section._id} className="space-y-1">
              {/* Section Header */}
              <button
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => handleSectionClick(section._id)}
              >
                <span
                  className={cn(
                    "text-xs w-4",
                    isSelected
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {index + 1}
                </span>
                <HugeiconsIcon
                  icon={icon as typeof HugeIcons.FileIcon}
                  className="w-4 h-4 shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <span className="truncate block">
                    {getSectionDisplayName(section.type as SectionType)}
                  </span>
                  {currentTemplate && templates.length > 1 && (
                    <span
                      className={cn(
                        "text-[10px] truncate block",
                        isSelected
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {currentTemplate.metadata.name}
                    </span>
                  )}
                </div>
                {templates.length > 1 && (
                  <HugeiconsIcon
                    icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                    className={cn(
                      "w-3.5 h-3.5 shrink-0 transition-transform",
                      isSelected
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  />
                )}
              </button>

              {/* Expanded Template Options */}
              {isExpanded && templates.length > 1 && (
                <div className="ml-6 pl-2 border-l-2 border-muted space-y-0.5">
                  <p className="text-[10px] text-muted-foreground px-2 py-1 uppercase tracking-wider">
                    Templates
                  </p>
                  {templates.map((template) => {
                    const isActive = template.metadata.id === currentTemplateId;

                    return (
                      <button
                        key={template.metadata.id}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-foreground",
                          isTemplateLoading && "opacity-50 pointer-events-none"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isActive) {
                            handleTemplateSelect(
                              section._id,
                              template.metadata.id
                            );
                          }
                        }}
                        disabled={isTemplateLoading}
                      >
                        {isActive ? (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            className="w-3.5 h-3.5 shrink-0 text-primary"
                          />
                        ) : (
                          <span className="w-3.5 h-3.5 shrink-0 rounded-full border border-muted-foreground/30" />
                        )}
                        <span className="truncate">{template.metadata.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
