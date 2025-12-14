"use client";

import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun03Icon, Moon02Icon, ComputerIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const themes = [
  {
    value: "light" as const,
    label: "Light",
    icon: Sun03Icon,
    description: "Light theme",
  },
  {
    value: "dark" as const,
    label: "Dark",
    icon: Moon02Icon,
    description: "Dark theme",
  },
  {
    value: "system" as const,
    label: "System",
    icon: ComputerIcon,
    description: "Follow system preference",
  },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize how the app looks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                theme === t.value && "border-primary bg-muted/50"
              )}
            >
              <HugeiconsIcon
                icon={t.icon}
                className={cn(
                  "size-5",
                  theme === t.value ? "text-primary" : "text-muted-foreground"
                )}
              />
              <Label
                className={cn(
                  "text-sm cursor-pointer",
                  theme === t.value ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {t.label}
              </Label>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">D</kbd> to quickly toggle theme
        </p>
      </CardContent>
    </Card>
  );
}
