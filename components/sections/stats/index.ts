import type { TemplateDefinition } from "../types";
import { StatsRow } from "./row";

export const statsTemplates: Record<string, TemplateDefinition<"stats">> = {
  "stats-row": {
    metadata: {
      id: "stats-row",
      sectionType: "stats",
      name: "Row",
      description: "Key metrics displayed in a responsive row",
      tags: ["numbers", "metrics", "centered"],
    },
    component: StatsRow,
  },
};

export const defaultStatsTemplate = "stats-row";
export { StatsRow };
