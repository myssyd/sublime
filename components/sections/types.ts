import type { Theme, SectionType, SectionContent } from "@/lib/sections/definitions";
import type { StyleOverrides, TemplateMetadata } from "@/lib/sections/templates";

/**
 * Props passed to every template component.
 * Templates receive typed content, theme, and optional style overrides.
 */
export interface TemplateProps<T extends SectionType = SectionType> {
  content: SectionContent<T>;
  theme: Theme;
  styleOverrides?: StyleOverrides;
  className?: string;
}

/**
 * Template definition combining metadata with the component.
 */
export interface TemplateDefinition<T extends SectionType = SectionType> {
  metadata: TemplateMetadata;
  component: React.ComponentType<TemplateProps<T>>;
}

/**
 * Registry of all templates for a specific section type.
 */
export type SectionTemplateRegistry<T extends SectionType> = Record<
  string,
  TemplateDefinition<T>
>;

/**
 * Props for the SectionRenderer component.
 */
export interface SectionRendererProps {
  type: string;
  templateId?: string;
  content: unknown;
  theme: Theme;
  styleOverrides?: StyleOverrides;
  className?: string;
  isCommentMode?: boolean;
  isSelectMode?: boolean;
  onElementClick?: (element: HTMLElement, event: React.MouseEvent) => void;
  onTextEdit?: (oldText: string, newText: string) => void;
}

/**
 * Simplified props for preview/display contexts.
 */
export interface SectionDisplayProps {
  type: string;
  templateId?: string;
  content: unknown;
  theme: Theme;
  styleOverrides?: StyleOverrides;
  className?: string;
}
