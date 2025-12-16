import type { TemplateDefinition } from "../types";
import { TeamGrid } from "./grid";

export const teamTemplates: Record<string, TemplateDefinition<"team">> = {
  "team-grid": {
    metadata: {
      id: "team-grid",
      sectionType: "team",
      name: "Grid",
      description: "Team member cards in a responsive grid",
      tags: ["grid", "cards", "social-links"],
    },
    component: TeamGrid,
  },
};

export const defaultTeamTemplate = "team-grid";
export { TeamGrid };
