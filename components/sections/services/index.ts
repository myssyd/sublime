import type { TemplateDefinition } from "../types";
import { ServicesGrid } from "./grid";

export const servicesTemplates: Record<string, TemplateDefinition<"services">> = {
  "services-grid": {
    metadata: {
      id: "services-grid",
      sectionType: "services",
      name: "Grid",
      description: "Service cards in a responsive grid layout",
      tags: ["grid", "cards", "hover-effect"],
    },
    component: ServicesGrid,
  },
};

export const defaultServicesTemplate = "services-grid";
export { ServicesGrid };
