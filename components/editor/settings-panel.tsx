"use client";

import { useState } from "react";
import { Theme } from "@/lib/sections/definitions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import {
  PRESET_THEMES,
  generateThemeFromPrimary,
  findMatchingPreset,
  parseHslString,
  type PresetTheme,
} from "@/lib/theme-presets";

interface SettingsPanelProps {
  theme: Theme;
  onThemeChange: (updates: Partial<Theme>) => void;
}

const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
  { value: "Raleway", label: "Raleway" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "system-ui", label: "System Default" },
];

function ThemeSwatch({
  preset,
  isSelected,
  onClick,
}: {
  preset: PresetTheme;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = `hsl(${preset.hue}, ${preset.saturation}%, ${preset.lightness}%)`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all",
        "hover:bg-muted/50",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border"
      )}
    >
      <div
        className="w-8 h-8 rounded-full shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-muted-foreground">{preset.name}</span>
    </button>
  );
}

function CustomThemeSwatch({
  customColor,
  isSelected,
  onColorChange,
}: {
  customColor: string | null;
  isSelected: boolean;
  onColorChange: (color: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all",
            "hover:bg-muted/50",
            isSelected
              ? "border-primary ring-2 ring-primary/20"
              : "border-border"
          )}
        >
          {customColor ? (
            <div
              className="w-8 h-8 rounded-full shadow-sm"
              style={{ backgroundColor: customColor }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
              <HugeiconsIcon
                icon={Add01Icon}
                className="w-4 h-4 text-muted-foreground"
              />
            </div>
          )}
          <span className="text-xs text-muted-foreground">Custom</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <ColorPicker color={customColor || "#3b82f6"} onChange={onColorChange} />
      </PopoverContent>
    </Popover>
  );
}

function ThemeGrid({
  selectedThemeId,
  customColor,
  onPresetSelect,
  onCustomColorChange,
}: {
  selectedThemeId: string | null;
  customColor: string | null;
  onPresetSelect: (themeId: string) => void;
  onCustomColorChange: (color: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {PRESET_THEMES.map((preset) => (
        <ThemeSwatch
          key={preset.id}
          preset={preset}
          isSelected={selectedThemeId === preset.id}
          onClick={() => onPresetSelect(preset.id)}
        />
      ))}
      <CustomThemeSwatch
        customColor={customColor}
        isSelected={selectedThemeId === "custom"}
        onColorChange={onCustomColorChange}
      />
    </div>
  );
}

export function SettingsPanel({ theme, onThemeChange }: SettingsPanelProps) {
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(() => {
    const matchedPreset = findMatchingPreset(theme.primaryColor);
    return matchedPreset || "custom";
  });
  const [customColor, setCustomColor] = useState<string | null>(() => {
    const matchedPreset = findMatchingPreset(theme.primaryColor);
    return matchedPreset ? null : theme.primaryColor;
  });

  const handlePresetSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
    const preset = PRESET_THEMES.find((p) => p.id === themeId);
    if (preset) {
      const newTheme = generateThemeFromPrimary(
        preset.hue,
        preset.saturation,
        preset.lightness
      );
      onThemeChange({ ...newTheme, fontFamily: theme.fontFamily });
    }
  };

  const handleCustomColorChange = (color: string) => {
    setSelectedThemeId("custom");
    setCustomColor(color);

    const parsed = parseHslString(color);
    if (parsed) {
      const newTheme = generateThemeFromPrimary(parsed.h, parsed.s, parsed.l);
      onThemeChange({ ...newTheme, fontFamily: theme.fontFamily });
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Typography */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Typography</h3>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Font Family</label>
          <Select
            value={theme.fontFamily}
            onValueChange={(value) => onThemeChange({ fontFamily: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Theme</h3>
        <ThemeGrid
          selectedThemeId={selectedThemeId}
          customColor={customColor}
          onPresetSelect={handlePresetSelect}
          onCustomColorChange={handleCustomColorChange}
        />
      </div>
    </div>
  );
}
