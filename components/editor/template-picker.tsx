"use client";

import { SectionType } from "@/lib/sections/definitions";
import { getTemplatesForSection } from "@/components/sections/registry";
import { DEFAULT_TEMPLATES } from "@/lib/sections/templates";
import { cn } from "@/lib/utils";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
    <div className="p-3 space-y-2">
      <p className="text-xs text-muted-foreground px-1 mb-3">
        Choose a template variant for this section
      </p>
      <div className="space-y-1">
        {templates.map((template) => {
          const isActive = template.metadata.id === activeTemplateId;

          return (
            <button
              key={template.metadata.id}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                "border",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:bg-muted",
                isLoading && "opacity-50 pointer-events-none"
              )}
              onClick={() => {
                if (!isActive && !isLoading) {
                  onTemplateSelect(template.metadata.id);
                }
              }}
              disabled={isLoading}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {template.metadata.name}
                  </span>
                  {isActive && (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="w-4 h-4 text-primary shrink-0"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {template.metadata.description}
                </p>
                {template.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.metadata.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 bg-muted rounded"
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
