import { z } from "zod";
import type { SectionType } from "./definitions";

// Template metadata interface
export interface TemplateMetadata {
  id: string; // e.g., "hero-centered"
  sectionType: SectionType; // e.g., "hero"
  name: string; // e.g., "Centered Hero"
  description: string; // e.g., "Classic centered layout with headline and CTA"
  thumbnail?: string; // Preview image URL
  tags: string[]; // e.g., ["modern", "minimal", "bold"]
}

// Template definition with component reference
export interface TemplateDefinition<T = unknown> {
  metadata: TemplateMetadata;
  component: React.ComponentType<TemplateProps<T>>;
}

// Props passed to every template component
export interface TemplateProps<T = unknown> {
  content: T;
  theme: import("./definitions").Theme;
  styleOverrides?: StyleOverrides;
  className?: string;
}

// Style overrides - pure Tailwind classes
export interface StyleOverrides {
  // Section-level: applies to the section container
  section?: string; // e.g., "py-32 bg-gradient-to-br animate-fade-in"

  // Element-level: keyed by selector path
  elements?: Record<string, string>; // e.g., { "headline": "text-6xl font-black" }
}

// Template registry type
export type TemplateRegistry = Record<string, TemplateDefinition>;

// Default templates per section type
export const DEFAULT_TEMPLATES: Record<SectionType, string> = {
  hero: "hero-centered",
  features: "features-grid",
  pricing: "pricing-simple",
  testimonials: "testimonials-grid",
  faq: "faq-accordion",
  cta: "cta-simple",
  menu: "menu-categorized",
  portfolio: "portfolio-grid",
  team: "team-grid",
  gallery: "gallery-grid",
  contact: "contact-form-left",
  stats: "stats-row",
  logos: "logos-strip",
  about: "about-text-left",
  services: "services-grid",
};

// Helper to generate template ID
export function createTemplateId(
  sectionType: SectionType,
  variant: string
): string {
  return `${sectionType}-${variant}`;
}

// Helper to extract section type from template ID
export function getSectionTypeFromTemplateId(
  templateId: string
): SectionType | null {
  const parts = templateId.split("-");
  if (parts.length < 2) return null;

  // Handle multi-word section types like "form-left" -> extract "contact" or similar
  const sectionType = parts[0] as SectionType;
  return sectionType;
}

// Element selectors documentation for AI prompts
export const ELEMENT_SELECTORS: Record<SectionType, string[]> = {
  hero: [
    "headline",
    "subheadline",
    "cta",
    "cta.button",
    "secondaryCta",
    "secondaryCta.button",
    "container",
    "background",
  ],
  features: [
    "headline",
    "subheadline",
    "features",
    "features[*].icon",
    "features[*].title",
    "features[*].description",
    "features[*].card",
  ],
  pricing: [
    "headline",
    "subheadline",
    "tiers",
    "tiers[*].card",
    "tiers[*].name",
    "tiers[*].price",
    "tiers[*].description",
    "tiers[*].features",
    "tiers[*].cta",
  ],
  testimonials: [
    "headline",
    "testimonials",
    "testimonials[*].card",
    "testimonials[*].quote",
    "testimonials[*].author",
    "testimonials[*].role",
    "testimonials[*].avatar",
  ],
  faq: ["headline", "items", "items[*].question", "items[*].answer"],
  cta: ["headline", "subheadline", "cta", "cta.button", "container"],
  menu: [
    "headline",
    "categories",
    "categories[*].name",
    "categories[*].items",
    "categories[*].items[*].name",
    "categories[*].items[*].price",
  ],
  portfolio: [
    "headline",
    "projects",
    "projects[*].card",
    "projects[*].title",
    "projects[*].description",
    "projects[*].image",
  ],
  team: [
    "headline",
    "members",
    "members[*].card",
    "members[*].name",
    "members[*].role",
    "members[*].bio",
    "members[*].image",
  ],
  gallery: ["headline", "images", "images[*]", "images[*].caption"],
  contact: [
    "headline",
    "subheadline",
    "form",
    "form.fields",
    "form.submit",
    "contactInfo",
    "contactInfo.email",
    "contactInfo.phone",
    "contactInfo.address",
  ],
  stats: ["headline", "stats", "stats[*].value", "stats[*].label"],
  logos: ["headline", "logos", "logos[*]"],
  about: ["headline", "content", "image", "container"],
  services: [
    "headline",
    "subheadline",
    "services",
    "services[*].card",
    "services[*].icon",
    "services[*].title",
    "services[*].description",
    "services[*].price",
  ],
};
