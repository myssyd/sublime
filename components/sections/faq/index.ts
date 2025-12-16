import type { TemplateDefinition } from "../types";
import { FAQAccordion } from "./accordion";
import { FAQTwoColumn } from "./two-column";
import { FAQTabs } from "./tabs";

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
  "faq-two-column": {
    metadata: {
      id: "faq-two-column",
      sectionType: "faq",
      name: "Two Column",
      description: "Side-by-side grid with all answers visible",
      tags: ["grid", "scannable", "open"],
    },
    component: FAQTwoColumn,
  },
  "faq-tabs": {
    metadata: {
      id: "faq-tabs",
      sectionType: "faq",
      name: "Tabs",
      description: "Interactive tabbed interface for exploring FAQs",
      tags: ["tabs", "interactive", "focused"],
    },
    component: FAQTabs,
  },
};

export const defaultFaqTemplate = "faq-accordion";
export { FAQAccordion, FAQTwoColumn, FAQTabs };
