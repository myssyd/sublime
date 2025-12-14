"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AI_MODELS, type AIModel } from "@/lib/models";

// Re-export for convenience
export { AI_MODELS, MODEL_ID_MAP, getOpenRouterModelId, type AIModel } from "@/lib/models";

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
  // Filter models based on props
  let filteredModels = AI_MODELS;
  if (showFreeOnly) {
    filteredModels = AI_MODELS.filter((m) => m.isFree);
  } else if (showPaidOnly) {
    filteredModels = AI_MODELS.filter((m) => !m.isFree);
  }

  const groupedModels = groupModelsByProvider(filteredModels);
  const selectedModel = AI_MODELS.find((m) => m.id === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          size === "sm" ? "h-8 text-xs" : "h-9",
          triggerClassName
        )}
      >
        <SelectValue>
          {selectedModel ? (
            <span className="flex items-center gap-1.5">
              <span>{selectedModel.name}</span>
              {selectedModel.isFree && (
                <span className="text-[10px] text-muted-foreground">(Free)</span>
              )}
            </span>
          ) : (
            "Select model"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={cn("z-150", className)}>
        {Object.entries(groupedModels).map(([provider, models]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="text-xs text-muted-foreground px-2 py-1.5">
              {provider}
            </SelectLabel>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <span>{model.name}</span>
                  {model.isFree && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">
                      Free
                    </span>
                  )}
                </div>
                {model.description && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {model.description}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
