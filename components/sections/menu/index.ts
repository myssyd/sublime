import type { TemplateDefinition } from "../types";
import { MenuCategorized } from "./categorized";

export const menuTemplates: Record<string, TemplateDefinition<"menu">> = {
  "menu-categorized": {
    metadata: {
      id: "menu-categorized",
      sectionType: "menu",
      name: "Categorized",
      description: "Menu items organized by category with prices",
      tags: ["categories", "prices", "restaurant"],
    },
    component: MenuCategorized,
  },
};

export const defaultMenuTemplate = "menu-categorized";
export { MenuCategorized };
