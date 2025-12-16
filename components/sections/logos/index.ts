import type { TemplateDefinition } from "../types";
import { LogosStrip } from "./strip";

export const logosTemplates: Record<string, TemplateDefinition<"logos">> = {
  "logos-strip": {
    metadata: {
      id: "logos-strip",
      sectionType: "logos",
      name: "Strip",
      description: "Logo strip with hover effects",
      tags: ["logos", "trust", "partners"],
    },
    component: LogosStrip,
  },
};

export const defaultLogosTemplate = "logos-strip";
export { LogosStrip };
