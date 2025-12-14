"use client";

import { Theme } from "@/lib/sections/definitions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

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

// Generate harmonious colors based on a primary color
function generateHarmoniousColors(primaryHsl: string): Partial<Theme> {
  // Parse HSL from string like "hsl(210, 80%, 50%)"
  const match = primaryHsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
  if (!match) return {};

  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]);
  const l = parseFloat(match[3]);

  // Generate complementary and analogous colors
  const secondary = `hsl(${(h + 30) % 360}, ${Math.max(s - 10, 20)}%, ${Math.min(l + 10, 70)}%)`;
  const accent = `hsl(${(h + 180) % 360}, ${Math.min(s + 10, 90)}%, ${l}%)`;
  const background = `hsl(${h}, ${Math.max(s - 60, 5)}%, 98%)`;
  const text = `hsl(${h}, ${Math.max(s - 50, 10)}%, 15%)`;

  return {
    primaryColor: primaryHsl,
    secondaryColor: secondary,
    accentColor: accent,
    backgroundColor: background,
    textColor: text,
  };
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-muted-foreground">{label}</label>
      <ColorPicker color={value} onChange={onChange} />
    </div>
  );
}

export function SettingsPanel({ theme, onThemeChange }: SettingsPanelProps) {
  const handleGenerateHarmony = () => {
    const harmonious = generateHarmoniousColors(theme.primaryColor);
    if (Object.keys(harmonious).length > 0) {
      onThemeChange(harmonious);
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

      {/* Colors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Colors</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateHarmony}
            className="h-7 text-xs"
          >
            <HugeiconsIcon icon={SparklesIcon} className="w-3 h-3 mr-1" />
            Generate
          </Button>
        </div>
        <div className="space-y-3">
          <ColorRow
            label="Primary"
            value={theme.primaryColor}
            onChange={(value) => onThemeChange({ primaryColor: value })}
          />
          <ColorRow
            label="Secondary"
            value={theme.secondaryColor}
            onChange={(value) => onThemeChange({ secondaryColor: value })}
          />
          <ColorRow
            label="Accent"
            value={theme.accentColor}
            onChange={(value) => onThemeChange({ accentColor: value })}
          />
          <ColorRow
            label="Background"
            value={theme.backgroundColor}
            onChange={(value) => onThemeChange({ backgroundColor: value })}
          />
          <ColorRow
            label="Text"
            value={theme.textColor}
            onChange={(value) => onThemeChange({ textColor: value })}
          />
        </div>
      </div>
    </div>
  );
}
