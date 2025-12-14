"use client";

import { getSectionDisplayName, getSectionIcon } from "@/lib/sections/metadata";
import { SectionType } from "@/lib/sections/definitions";
import { HugeiconsIcon } from "@hugeicons/react";
import * as HugeIcons from "@hugeicons/core-free-icons";

interface Section {
  _id: string;
  type: string;
  order: number;
}

interface LayersPanelProps {
  sections: Section[];
  selectedSectionId: string | null;
  onSectionSelect: (id: string) => void;
}

export function LayersPanel({
  sections,
  selectedSectionId,
  onSectionSelect,
}: LayersPanelProps) {
  const getIcon = (iconName: string) => {
    const icon = (HugeIcons as Record<string, unknown>)[iconName];
    return icon || HugeIcons.FileIcon;
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

          return (
            <button
              key={section._id}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedSectionId === section._id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => onSectionSelect(section._id)}
            >
              <span className="text-xs text-muted-foreground w-4">
                {index + 1}
              </span>
              <HugeiconsIcon
                icon={icon as typeof HugeIcons.FileIcon}
                className="w-4 h-4 shrink-0"
              />
              <span className="truncate">
                {getSectionDisplayName(section.type as SectionType)}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
