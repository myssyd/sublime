import type { TemplateDefinition } from "../types";
import { CTASimple } from "./simple";

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
};

export const defaultCtaTemplate = "cta-simple";
export { CTASimple };
