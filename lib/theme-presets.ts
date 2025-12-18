import type { Theme } from "@/lib/sections/definitions";

export interface PresetTheme {
  id: string;
  name: string;
  hue: number;
  saturation: number;
  lightness: number;
}

export const PRESET_THEMES: PresetTheme[] = [
  { id: "blue", name: "Blue", hue: 217, saturation: 91, lightness: 60 },
  { id: "violet", name: "Violet", hue: 258, saturation: 90, lightness: 66 },
  { id: "rose", name: "Rose", hue: 350, saturation: 89, lightness: 60 },
  { id: "orange", name: "Orange", hue: 25, saturation: 95, lightness: 53 },
  { id: "green", name: "Green", hue: 142, saturation: 71, lightness: 45 },
  { id: "teal", name: "Teal", hue: 175, saturation: 77, lightness: 40 },
  { id: "cyan", name: "Cyan", hue: 189, saturation: 94, lightness: 43 },
  { id: "indigo", name: "Indigo", hue: 239, saturation: 84, lightness: 67 },
  { id: "pink", name: "Pink", hue: 330, saturation: 81, lightness: 60 },
  { id: "amber", name: "Amber", hue: 38, saturation: 92, lightness: 50 },
];

export function generateThemeFromPrimary(
  h: number,
  s: number,
  l: number
): Omit<Theme, "fontFamily"> {
  return {
    primaryColor: `hsl(${h}, ${s}%, ${l}%)`,
    secondaryColor: `hsl(${(h + 30) % 360}, ${Math.max(s * 0.4, 15)}%, ${Math.min(l + 30, 85)}%)`,
    accentColor: `hsl(${(h + 120) % 360}, ${Math.min(s * 0.9, 85)}%, ${l}%)`,
    backgroundColor: `hsl(${h}, ${Math.min(s * 0.1, 10)}%, 98%)`,
    textColor: `hsl(${h}, ${Math.min(s * 0.2, 15)}%, 12%)`,
  };
}

export function parseHslString(
  hslString: string
): { h: number; s: number; l: number } | null {
  const match = hslString.match(
    /hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
  );
  if (!match) return null;
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

export function findMatchingPreset(primaryColor: string): string | null {
  const parsed = parseHslString(primaryColor);
  if (!parsed) return null;

  for (const preset of PRESET_THEMES) {
    // Allow some tolerance for matching (within 5 degrees hue, 5% saturation/lightness)
    if (
      Math.abs(preset.hue - parsed.h) < 5 &&
      Math.abs(preset.saturation - parsed.s) < 5 &&
      Math.abs(preset.lightness - parsed.l) < 5
    ) {
      return preset.id;
    }
  }
  return null;
}
