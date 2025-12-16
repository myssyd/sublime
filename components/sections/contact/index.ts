import type { TemplateDefinition } from "../types";
import { ContactFormLeft } from "./form-left";

export const contactTemplates: Record<string, TemplateDefinition<"contact">> = {
  "contact-form-left": {
    metadata: {
      id: "contact-form-left",
      sectionType: "contact",
      name: "Form Left",
      description: "Contact form on left, contact info on right",
      tags: ["form", "two-column", "contact-info"],
    },
    component: ContactFormLeft,
  },
};

export const defaultContactTemplate = "contact-form-left";
export { ContactFormLeft };
