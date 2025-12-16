import type { TemplateDefinition } from "../types";
import { TestimonialsGrid } from "./grid";
import { TestimonialsCarousel } from "./carousel";
import { TestimonialsQuotes } from "./quotes";

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
  "testimonials-carousel": {
    metadata: {
      id: "testimonials-carousel",
      sectionType: "testimonials",
      name: "Carousel",
      description: "Single testimonial with navigation arrows and dots",
      tags: ["carousel", "interactive", "focused"],
    },
    component: TestimonialsCarousel,
  },
  "testimonials-quotes": {
    metadata: {
      id: "testimonials-quotes",
      sectionType: "testimonials",
      name: "Quotes",
      description: "Large editorial-style quote blocks with emphasis",
      tags: ["editorial", "large", "elegant"],
    },
    component: TestimonialsQuotes,
  },
};

export const defaultTestimonialsTemplate = "testimonials-grid";
export { TestimonialsGrid, TestimonialsCarousel, TestimonialsQuotes };
