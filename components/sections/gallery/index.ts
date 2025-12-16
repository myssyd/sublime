import type { TemplateDefinition } from "../types";
import { GalleryGrid } from "./grid";

export const galleryTemplates: Record<string, TemplateDefinition<"gallery">> = {
  "gallery-grid": {
    metadata: {
      id: "gallery-grid",
      sectionType: "gallery",
      name: "Grid",
      description: "Image gallery grid with lightbox",
      tags: ["grid", "images", "lightbox"],
    },
    component: GalleryGrid,
  },
};

export const defaultGalleryTemplate = "gallery-grid";
export { GalleryGrid };
