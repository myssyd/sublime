import type { TemplateDefinition } from "../types";
import { HeroCentered } from "./centered";
import { HeroGradient } from "./gradient";
import { HeroSplit } from "./split";

/**
 * Hero section template registry.
 *
 * Each template provides a unique visual style while accepting the same content schema.
 * Users can switch between templates without losing content.
 */
export const heroTemplates: Record<string, TemplateDefinition<"hero">> = {
  "hero-centered": {
    metadata: {
      id: "hero-centered",
      sectionType: "hero",
      name: "Centered",
      description: "Classic centered layout with headline, subheadline, and CTA buttons",
      tags: ["classic", "centered", "versatile"],
    },
    component: HeroCentered,
  },
  "hero-gradient": {
    metadata: {
      id: "hero-gradient",
      sectionType: "hero",
      name: "Gradient",
      description: "Bold gradient background using primary and secondary colors",
      tags: ["modern", "bold", "colorful"],
    },
    component: HeroGradient,
  },
  "hero-split": {
    metadata: {
      id: "hero-split",
      sectionType: "hero",
      name: "Split",
      description: "Two-column layout with content on one side and image on the other",
      tags: ["modern", "image-focused", "professional"],
    },
    component: HeroSplit,
  },
};

// Default hero template
export const defaultHeroTemplate = "hero-centered";

// Re-export individual components for direct use
export { HeroCentered, HeroGradient, HeroSplit };
