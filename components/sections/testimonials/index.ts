import type { TemplateDefinition } from "../types";
import { TestimonialsGrid } from "./grid";

export const testimonialsTemplates: Record<string, TemplateDefinition<"testimonials">> = {
  "testimonials-grid": {
    metadata: {
      id: "testimonials-grid",
      sectionType: "testimonials",
      name: "Grid",
      description: "Clean grid of testimonial cards with quotes and author info",
      tags: ["grid", "cards", "clean"],
    },
    component: TestimonialsGrid,
  },
};

export const defaultTestimonialsTemplate = "testimonials-grid";
export { TestimonialsGrid };
