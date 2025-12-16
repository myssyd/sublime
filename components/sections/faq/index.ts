import type { TemplateDefinition } from "../types";
import { FAQAccordion } from "./accordion";

export const faqTemplates: Record<string, TemplateDefinition<"faq">> = {
  "faq-accordion": {
    metadata: {
      id: "faq-accordion",
      sectionType: "faq",
      name: "Accordion",
      description: "Expandable FAQ items with smooth animation",
      tags: ["accordion", "expandable", "clean"],
    },
    component: FAQAccordion,
  },
};

export const defaultFaqTemplate = "faq-accordion";
export { FAQAccordion };
