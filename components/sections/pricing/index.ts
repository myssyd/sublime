import type { TemplateDefinition } from "../types";
import { PricingSimple } from "./simple";

export const pricingTemplates: Record<string, TemplateDefinition<"pricing">> = {
  "pricing-simple": {
    metadata: {
      id: "pricing-simple",
      sectionType: "pricing",
      name: "Simple",
      description: "Clean pricing cards with features list and CTA",
      tags: ["clean", "cards", "modern"],
    },
    component: PricingSimple,
  },
};

export const defaultPricingTemplate = "pricing-simple";
export { PricingSimple };
