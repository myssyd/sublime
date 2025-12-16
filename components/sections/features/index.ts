import type { TemplateDefinition } from "../types";
import { FeaturesGrid } from "./grid";
import { FeaturesCards } from "./cards";
import { FeaturesAlternating } from "./alternating";
import { FeaturesIconsLeft } from "./icons-left";

export const featuresTemplates: Record<string, TemplateDefinition<"features">> = {
  "features-grid": {
    metadata: {
      id: "features-grid",
      sectionType: "features",
      name: "Grid",
      description: "Clean grid layout with centered icons and text",
      tags: ["clean", "centered", "minimal"],
    },
    component: FeaturesGrid,
  },
  "features-cards": {
    metadata: {
      id: "features-cards",
      sectionType: "features",
      name: "Cards",
      description: "Feature cards with subtle borders and backgrounds",
      tags: ["cards", "bordered", "modern"],
    },
    component: FeaturesCards,
  },
  "features-alternating": {
    metadata: {
      id: "features-alternating",
      sectionType: "features",
      name: "Alternating",
      description: "Zigzag layout with content and visuals alternating sides",
      tags: ["zigzag", "visual", "spacious"],
    },
    component: FeaturesAlternating,
  },
  "features-icons-left": {
    metadata: {
      id: "features-icons-left",
      sectionType: "features",
      name: "Icons Left",
      description: "Horizontal list layout with icons aligned to the left",
      tags: ["list", "horizontal", "compact"],
    },
    component: FeaturesIconsLeft,
  },
};

export const defaultFeaturesTemplate = "features-grid";
export { FeaturesGrid, FeaturesCards, FeaturesAlternating, FeaturesIconsLeft };
