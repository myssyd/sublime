"use client";

import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  BlockComposition,
  BlockDefinition,
  BlockType,
} from "@/lib/blocks/types";
import { blockRegistry } from "@/lib/blocks/registry";
import { blockPropsSchemas } from "@/lib/blocks/schemas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import * as HugeIcons from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Copy01Icon } from "@hugeicons/core-free-icons";

// ============================================================================
// Types
// ============================================================================

interface BlockPropsPanelProps {
  composition: BlockComposition;
  selectedBlockId: string | null;
  onCompositionChange: (composition: BlockComposition) => void;
  onBlockSelect: (blockId: string | null) => void;
  className?: string;
}

interface PropEditorProps {
  propKey: string;
  value: any;
  schema: any;
  onChange: (value: any) => void;
}

// ============================================================================
// Property Editors
// ============================================================================

function TextPropEditor({ propKey, value, onChange }: PropEditorProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={propKey} className="text-xs capitalize">
        {propKey.replace(/([A-Z])/g, " $1").trim()}
      </Label>
      <Input
        id={propKey}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}

function TextareaPropEditor({ propKey, value, onChange }: PropEditorProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={propKey} className="text-xs capitalize">
        {propKey.replace(/([A-Z])/g, " $1").trim()}
      </Label>
      <Textarea
        id={propKey}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] text-sm resize-y"
      />
    </div>
  );
}

function NumberPropEditor({ propKey, value, onChange }: PropEditorProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={propKey} className="text-xs capitalize">
        {propKey.replace(/([A-Z])/g, " $1").trim()}
      </Label>
      <Input
        id={propKey}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="h-8 text-sm"
      />
    </div>
  );
}

function BooleanPropEditor({ propKey, value, onChange }: PropEditorProps) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={propKey} className="text-xs capitalize">
        {propKey.replace(/([A-Z])/g, " $1").trim()}
      </Label>
      <Switch
        id={propKey}
        checked={value || false}
        onCheckedChange={onChange}
      />
    </div>
  );
}

function SelectPropEditor({ propKey, value, schema, onChange }: PropEditorProps) {
  // Extract enum values from schema description or _def
  const options: string[] = schema?._def?.values || [];

  if (options.length === 0) {
    return <TextPropEditor propKey={propKey} value={value} schema={schema} onChange={onChange} />;
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={propKey} className="text-xs capitalize">
        {propKey.replace(/([A-Z])/g, " $1").trim()}
      </Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option: string) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ColorPropEditor({ propKey, value, onChange }: PropEditorProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={propKey} className="text-xs capitalize">
        {propKey.replace(/([A-Z])/g, " $1").trim()}
      </Label>
      <div className="flex gap-2">
        <Input
          id={propKey}
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-12 p-1 cursor-pointer"
        />
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="h-8 text-sm flex-1"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Property Editor Factory
// ============================================================================

function PropEditor({ propKey, value, schema, onChange }: PropEditorProps) {
  // Determine the type of editor based on schema or key name
  const schemaType = schema?._def?.typeName;

  // Special cases based on prop name
  if (propKey.toLowerCase().includes("color")) {
    return <ColorPropEditor propKey={propKey} value={value} schema={schema} onChange={onChange} />;
  }

  if (
    propKey === "content" ||
    propKey === "description" ||
    propKey === "text" ||
    propKey === "bio"
  ) {
    return <TextareaPropEditor propKey={propKey} value={value} schema={schema} onChange={onChange} />;
  }

  // Schema-based type detection
  if (schemaType === "ZodEnum") {
    return <SelectPropEditor propKey={propKey} value={value} schema={schema} onChange={onChange} />;
  }

  if (schemaType === "ZodBoolean") {
    return <BooleanPropEditor propKey={propKey} value={value} schema={schema} onChange={onChange} />;
  }

  if (schemaType === "ZodNumber") {
    return <NumberPropEditor propKey={propKey} value={value} schema={schema} onChange={onChange} />;
  }

  // Default to text input
  return <TextPropEditor propKey={propKey} value={value} schema={schema} onChange={onChange} />;
}

// ============================================================================
// Block Props Panel
// ============================================================================

export function BlockPropsPanel({
  composition,
  selectedBlockId,
  onCompositionChange,
  onBlockSelect,
  className,
}: BlockPropsPanelProps) {
  const [styleOverrides, setStyleOverrides] = useState("");

  const selectedBlock = selectedBlockId
    ? composition.blocks[selectedBlockId]
    : null;

  const blockMeta = selectedBlock ? blockRegistry[selectedBlock.type] : null;
  const propsSchema = selectedBlock
    ? blockPropsSchemas[selectedBlock.type as keyof typeof blockPropsSchemas]
    : null;

  // Update style overrides when block changes
  React.useEffect(() => {
    if (selectedBlock) {
      setStyleOverrides(selectedBlock.styleOverrides || "");
    }
  }, [selectedBlock]);

  // Handle prop change
  const handlePropChange = useCallback(
    (propKey: string, value: any) => {
      if (!selectedBlockId || !selectedBlock) return;

      const newComposition = { ...composition };
      newComposition.blocks = { ...newComposition.blocks };
      newComposition.blocks[selectedBlockId] = {
        ...selectedBlock,
        props: {
          ...selectedBlock.props,
          [propKey]: value,
        },
      };

      onCompositionChange(newComposition);
    },
    [composition, selectedBlockId, selectedBlock, onCompositionChange]
  );

  // Handle style overrides change
  const handleStyleOverridesChange = useCallback(() => {
    if (!selectedBlockId || !selectedBlock) return;

    const newComposition = { ...composition };
    newComposition.blocks = { ...newComposition.blocks };
    newComposition.blocks[selectedBlockId] = {
      ...selectedBlock,
      styleOverrides: styleOverrides || undefined,
    };

    onCompositionChange(newComposition);
  }, [composition, selectedBlockId, selectedBlock, styleOverrides, onCompositionChange]);

  // Handle delete block
  const handleDeleteBlock = useCallback(() => {
    if (!selectedBlockId || selectedBlockId === composition.root) return;

    const newComposition = { ...composition };
    newComposition.blocks = { ...newComposition.blocks };

    // Remove from parent's children
    for (const [id, block] of Object.entries(newComposition.blocks)) {
      if (block.children?.includes(selectedBlockId)) {
        newComposition.blocks[id] = {
          ...block,
          children: block.children.filter((c) => c !== selectedBlockId),
        };
        break;
      }
    }

    // Remove the block and its descendants
    const removeBlockAndChildren = (blockId: string) => {
      const block = newComposition.blocks[blockId];
      if (block?.children) {
        block.children.forEach(removeBlockAndChildren);
      }
      delete newComposition.blocks[blockId];
    };
    removeBlockAndChildren(selectedBlockId);

    onCompositionChange(newComposition);
    onBlockSelect(null);
  }, [composition, selectedBlockId, onCompositionChange, onBlockSelect]);

  // Handle duplicate block
  const handleDuplicateBlock = useCallback(() => {
    if (!selectedBlockId || !selectedBlock) return;

    const generateId = (type: BlockType) =>
      `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create mapping for new IDs
    const idMap: Record<string, string> = {};
    const collectIds = (blockId: string) => {
      const block = composition.blocks[blockId];
      idMap[blockId] = generateId(block.type);
      block.children?.forEach(collectIds);
    };
    collectIds(selectedBlockId);

    // Clone blocks with new IDs
    const newComposition = { ...composition };
    newComposition.blocks = { ...newComposition.blocks };

    const cloneBlock = (blockId: string): BlockDefinition => {
      const block = composition.blocks[blockId];
      return {
        ...block,
        id: idMap[blockId],
        children: block.children?.map((childId) => idMap[childId]),
      };
    };

    // Add cloned blocks
    Object.keys(idMap).forEach((oldId) => {
      newComposition.blocks[idMap[oldId]] = cloneBlock(oldId);
    });

    // Add to parent's children
    for (const [id, block] of Object.entries(newComposition.blocks)) {
      if (block.children?.includes(selectedBlockId)) {
        const index = block.children.indexOf(selectedBlockId);
        newComposition.blocks[id] = {
          ...block,
          children: [
            ...block.children.slice(0, index + 1),
            idMap[selectedBlockId],
            ...block.children.slice(index + 1),
          ],
        };
        break;
      }
    }

    onCompositionChange(newComposition);
    onBlockSelect(idMap[selectedBlockId]);
  }, [composition, selectedBlockId, selectedBlock, onCompositionChange, onBlockSelect]);

  // Get schema shape for iteration
  const getSchemaShape = () => {
    if (!propsSchema) return {};
    // @ts-ignore - accessing internal schema shape
    return propsSchema._def?.shape?.() || propsSchema.shape || {};
  };

  const schemaShape = getSchemaShape();

  if (!selectedBlock) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-4 border-b">
          <h3 className="font-semibold">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Select a block to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const IconComponent = blockMeta?.icon
    ? HugeIcons[blockMeta.icon as keyof typeof HugeIcons]
    : null;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          {IconComponent && (
            <HugeiconsIcon icon={IconComponent} className="w-4 h-4 text-primary" />
          )}
          <h3 className="font-semibold">{blockMeta?.name || selectedBlock.type}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{blockMeta?.description}</p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateBlock}
            className="flex-1"
          >
            <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4 mr-1" />
            Duplicate
          </Button>
          {selectedBlockId !== composition.root && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteBlock}
              className="flex-1 text-destructive hover:text-destructive"
            >
              <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Props Editor */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Block Props */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Content
          </h4>
          {Object.entries(schemaShape).map(([propKey, schema]) => {
            // Skip internal props
            if (propKey.startsWith("_")) return null;

            return (
              <PropEditor
                key={propKey}
                propKey={propKey}
                value={(selectedBlock.props as Record<string, unknown>)[propKey]}
                schema={schema}
                onChange={(value) => handlePropChange(propKey, value)}
              />
            );
          })}

          {Object.keys(schemaShape).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No editable properties
            </p>
          )}
        </div>

        {/* Style Overrides */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Custom Styles
          </h4>
          <div className="space-y-1.5">
            <Label htmlFor="styleOverrides" className="text-xs">
              Tailwind Classes
            </Label>
            <Textarea
              id="styleOverrides"
              value={styleOverrides}
              onChange={(e) => setStyleOverrides(e.target.value)}
              onBlur={handleStyleOverridesChange}
              placeholder="e.g., bg-blue-500 text-white p-4"
              className="min-h-[60px] text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Add custom Tailwind classes to override default styles
            </p>
          </div>
        </div>

        {/* Block ID (read-only) */}
        <div className="space-y-1.5 pt-4 border-t">
          <Label className="text-xs text-muted-foreground">Block ID</Label>
          <Input
            value={selectedBlock.id}
            readOnly
            className="h-8 text-xs font-mono bg-muted"
          />
        </div>
      </div>
    </div>
  );
}
