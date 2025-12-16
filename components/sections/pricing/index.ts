import type { TemplateDefinition } from "../types";
import { PricingSimple } from "./simple";
import { PricingComparison } from "./comparison";
import { PricingToggle } from "./toggle";

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
  "pricing-comparison": {
    metadata: {
      id: "pricing-comparison",
      sectionType: "pricing",
      name: "Comparison",
      description: "Feature comparison table for easy tier comparison",
      tags: ["table", "comparison", "detailed"],
    },
    component: PricingComparison,
  },
  "pricing-toggle": {
    metadata: {
      id: "pricing-toggle",
      sectionType: "pricing",
      name: "Toggle",
      description: "Monthly/Annual billing toggle with animated pricing",
      tags: ["toggle", "animated", "interactive"],
    },
    component: PricingToggle,
  },
};

export const defaultPricingTemplate = "pricing-simple";
export { PricingSimple, PricingComparison, PricingToggle };
