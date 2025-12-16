import type { TemplateDefinition } from "../types";
import { AboutTextLeft } from "./text-left";

export const aboutTemplates: Record<string, TemplateDefinition<"about">> = {
  "about-text-left": {
    metadata: {
      id: "about-text-left",
      sectionType: "about",
      name: "Text Left",
      description: "Image on left, text content on right",
      tags: ["image", "text", "two-column"],
    },
    component: AboutTextLeft,
  },
};

export const defaultAboutTemplate = "about-text-left";
export { AboutTextLeft };
