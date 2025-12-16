import type { TemplateDefinition } from "../types";
import { CTASimple } from "./simple";
import { CTABanner } from "./banner";
import { CTASplit } from "./split";

export const ctaTemplates: Record<string, TemplateDefinition<"cta">> = {
  "cta-simple": {
    metadata: {
      id: "cta-simple",
      sectionType: "cta",
      name: "Simple",
      description: "Bold CTA section with headline and button",
      tags: ["bold", "centered", "action"],
    },
    component: CTASimple,
  },
  "cta-banner": {
    metadata: {
      id: "cta-banner",
      sectionType: "cta",
      name: "Banner",
      description: "Compact horizontal banner with inline CTA button",
      tags: ["compact", "inline", "modern"],
    },
    component: CTABanner,
  },
  "cta-split": {
    metadata: {
      id: "cta-split",
      sectionType: "cta",
      name: "Split",
      description: "Two-column layout with content and visual element",
      tags: ["visual", "modern", "spacious"],
    },
    component: CTASplit,
  },
};

export const defaultCtaTemplate = "cta-simple";
export { CTASimple, CTABanner, CTASplit };
