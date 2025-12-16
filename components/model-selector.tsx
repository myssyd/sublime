"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { AI_MODELS, type AIModel } from "@/lib/models";

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
  // Filter models based on props
  let filteredModels = AI_MODELS;
  if (showFreeOnly) {
    filteredModels = AI_MODELS.filter((m) => m.isFree);
  } else if (showPaidOnly) {
    filteredModels = AI_MODELS.filter((m) => !m.isFree);
  }

  const groupedModels = groupModelsByProvider(filteredModels);

  return (
    <Combobox
      value={value}
      onValueChange={(val) => {
        if (val) onValueChange(val);
      }}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder="Select model..."
        className={cn(
          size === "sm" ? "[&_input]:h-8 [&_input]:text-xs" : "[&_input]:h-9",
          triggerClassName
        )}
        showClear={false}
      />
      <ComboboxContent
        className={cn("min-w-[200px]", className)}
        positionerClassName="z-[200]"
      >
        <ComboboxList>
          <ComboboxEmpty>No models found</ComboboxEmpty>
          {Object.entries(groupedModels).map(([provider, models]) => (
            <ComboboxGroup key={provider}>
              <ComboboxLabel>{provider}</ComboboxLabel>
              {models.map((model) => (
                <ComboboxItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span>{model.name}</span>
                    {model.isFree && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">
                        Free
                      </span>
                    )}
                  </div>
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
