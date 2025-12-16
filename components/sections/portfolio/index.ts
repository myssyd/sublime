import type { TemplateDefinition } from "../types";
import { PortfolioGrid } from "./grid";

export const portfolioTemplates: Record<string, TemplateDefinition<"portfolio">> = {
  "portfolio-grid": {
    metadata: {
      id: "portfolio-grid",
      sectionType: "portfolio",
      name: "Grid",
      description: "Portfolio projects in a hover-reveal grid",
      tags: ["grid", "projects", "hover-effect"],
    },
    component: PortfolioGrid,
  },
};

export const defaultPortfolioTemplate = "portfolio-grid";
export { PortfolioGrid };
