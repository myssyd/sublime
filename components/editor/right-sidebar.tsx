"use client";

import { Theme } from "@/lib/sections/definitions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayersPanel } from "./layers-panel";
import { SettingsPanel } from "./settings-panel";
import { cn } from "@/lib/utils";

interface Section {
  _id: string;
  type: string;
  templateId?: string;
  order: number;
}

interface RightSidebarProps {
  isOpen: boolean;
  sections: Section[];
  selectedSectionId: string | null;
  onSectionSelect: (id: string) => void;
  theme: Theme;
  onThemeChange: (updates: Partial<Theme>) => void;
  onTemplateChange?: (sectionId: string, templateId: string) => void;
  isTemplateLoading?: boolean;
}

export function RightSidebar({
  isOpen,
  sections,
  selectedSectionId,
  onSectionSelect,
  theme,
  onThemeChange,
  onTemplateChange,
  isTemplateLoading,
}: RightSidebarProps) {
  return (
    <div
      className={cn(
        "bg-background overflow-hidden transition-all duration-200 rounded-lg shadow-xl shrink-0",
        isOpen ? "w-72 ml-2" : "w-0 ml-0"
      )}
    >
      <div className="w-72 h-full overflow-y-auto">
        <Tabs defaultValue="layers" className="h-full flex flex-col">
          <div className="border-b p-2">
            <TabsList className="w-full">
              <TabsTrigger value="layers" className="flex-1">
                Layers
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                Settings
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="layers" className="flex-1 mt-0 overflow-y-auto">
            <LayersPanel
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSectionSelect={onSectionSelect}
              onTemplateChange={onTemplateChange}
              isTemplateLoading={isTemplateLoading}
            />
          </TabsContent>
          <TabsContent value="settings" className="flex-1 mt-0 overflow-y-auto">
            <SettingsPanel theme={theme} onThemeChange={onThemeChange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
