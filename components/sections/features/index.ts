import type { TemplateDefinition } from "../types";
import { FeaturesGrid } from "./grid";
import { FeaturesCards } from "./cards";

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
};

export const defaultFeaturesTemplate = "features-grid";
export { FeaturesGrid, FeaturesCards };
