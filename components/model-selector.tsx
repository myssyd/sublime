"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AI_MODELS, type AIModel } from "@/lib/models";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

// Re-export for convenience
export { AI_MODELS, MODEL_ID_MAP, DEFAULT_MODEL, getOpenRouterModelId, type AIModel } from "@/lib/models";

// Group models by provider
function groupModelsByProvider(models: AIModel[]): Record<string, AIModel[]> {
  return models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);
}

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  showFreeOnly?: boolean;
  showPaidOnly?: boolean;
  size?: "default" | "sm";
  className?: string;
  triggerClassName?: string;
}

export function ModelSelector({
  value,
  onValueChange,
  disabled = false,
  showFreeOnly = false,
  showPaidOnly = false,
  size = "default",
  className,
  triggerClassName,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // Filter models based on props
  let filteredModels = AI_MODELS;
  if (showFreeOnly) {
    filteredModels = AI_MODELS.filter((m) => m.isFree);
  } else if (showPaidOnly) {
    filteredModels = AI_MODELS.filter((m) => !m.isFree);
  }

  const groupedModels = groupModelsByProvider(filteredModels);
  const selectedModel = filteredModels.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal",
            size === "sm" ? "h-8 text-xs" : "h-9",
            triggerClassName
          )}
        >
          <span className="truncate">
            {selectedModel ? selectedModel.name : "Select model..."}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="ml-2 size-4 shrink-0 text-muted-foreground"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[320px] p-0 z-[200]", className)}
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            {Object.entries(groupedModels).map(([provider, models]) => (
              <CommandGroup key={provider} heading={provider}>
                {models.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={`${model.name} ${model.provider}`}
                    onSelect={() => {
                      onValueChange(model.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      {model.isFree && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">
                          Free
                        </span>
                      )}
                    </div>
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      strokeWidth={2}
                      className={cn(
                        "ml-auto size-4",
                        value === model.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
