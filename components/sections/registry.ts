import type { SectionType } from "@/lib/sections/definitions";
import type { TemplateDefinition } from "./types";
import { DEFAULT_TEMPLATES } from "@/lib/sections/templates";

// Import template registries from each section type
import { heroTemplates } from "./hero";
import { featuresTemplates } from "./features";
import { testimonialsTemplates } from "./testimonials";
import { pricingTemplates } from "./pricing";
import { faqTemplates } from "./faq";
import { ctaTemplates } from "./cta";
import { aboutTemplates } from "./about";
import { servicesTemplates } from "./services";
import { statsTemplates } from "./stats";
import { logosTemplates } from "./logos";
import { contactTemplates } from "./contact";
import { teamTemplates } from "./team";
import { galleryTemplates } from "./gallery";
import { portfolioTemplates } from "./portfolio";
import { menuTemplates } from "./menu";

// Global template registry - combines all section templates
export const templateRegistry: Record<string, TemplateDefinition> = {
  ...heroTemplates,
  ...featuresTemplates,
  ...testimonialsTemplates,
  ...pricingTemplates,
  ...faqTemplates,
  ...ctaTemplates,
  ...aboutTemplates,
  ...servicesTemplates,
  ...statsTemplates,
  ...logosTemplates,
  ...contactTemplates,
  ...teamTemplates,
  ...galleryTemplates,
  ...portfolioTemplates,
  ...menuTemplates,
};

/**
 * Get a specific template by ID.
 *
 * @param templateId - The template ID (e.g., "hero-centered")
 * @returns The template definition or undefined
 */
export function getTemplate(templateId: string): TemplateDefinition | undefined {
  return templateRegistry[templateId];
}

/**
 * Get all templates for a specific section type.
 *
 * @param sectionType - The section type (e.g., "hero")
 * @returns Array of template definitions
 */
export function getTemplatesForSection(
  sectionType: SectionType
): TemplateDefinition[] {
  return Object.values(templateRegistry).filter(
    (t) => t.metadata.sectionType === sectionType
  );
}

/**
 * Get the default template ID for a section type.
 *
 * @param sectionType - The section type
 * @returns The default template ID
 */
export function getDefaultTemplateId(sectionType: SectionType): string {
  return DEFAULT_TEMPLATES[sectionType];
}

/**
 * Get the default template for a section type.
 *
 * @param sectionType - The section type
 * @returns The default template definition
 */
export function getDefaultTemplate(
  sectionType: SectionType
): TemplateDefinition | undefined {
  const templateId = getDefaultTemplateId(sectionType);
  return getTemplate(templateId);
}

/**
 * Check if a template ID exists in the registry.
 *
 * @param templateId - The template ID to check
 * @returns Whether the template exists
 */
export function hasTemplate(templateId: string): boolean {
  return templateId in templateRegistry;
}

/**
 * Get all registered template IDs.
 *
 * @returns Array of all template IDs
 */
export function getAllTemplateIds(): string[] {
  return Object.keys(templateRegistry);
}

/**
 * Get template metadata for UI display.
 *
 * @param sectionType - The section type
 * @returns Array of template metadata (without components)
 */
export function getTemplateMetadataForSection(sectionType: SectionType) {
  return getTemplatesForSection(sectionType).map((t) => t.metadata);
}
