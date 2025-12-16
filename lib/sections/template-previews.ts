/**
 * Template preview configurations for visual thumbnails.
 *
 * Each preview describes the layout structure that gets rendered
 * as an SVG thumbnail in the template picker.
 */

export interface TemplatePreview {
  layout:
    | "centered"
    | "split-left"
    | "split-right"
    | "grid"
    | "cards"
    | "rows"
    | "banner"
    | "alternating"
    | "accordion"
    | "carousel"
    | "masonry"
    | "comparison"
    | "minimal";
  elements: Array<{
    type:
      | "headline"
      | "text"
      | "button"
      | "image"
      | "card"
      | "icon"
      | "avatar"
      | "badge";
    position?: string;
    size?: "sm" | "md" | "lg";
  }>;
  accent?: boolean;
}

export const TEMPLATE_PREVIEWS: Record<string, TemplatePreview> = {
  // Hero templates
  "hero-centered": {
    layout: "centered",
    elements: [
      { type: "headline", size: "lg" },
      { type: "text" },
      { type: "button" },
    ],
  },
  "hero-gradient": {
    layout: "centered",
    elements: [
      { type: "headline", size: "lg" },
      { type: "text" },
      { type: "button" },
    ],
    accent: true,
  },
  "hero-split": {
    layout: "split-left",
    elements: [
      { type: "headline" },
      { type: "text" },
      { type: "button" },
    ],
  },
  "hero-minimal": {
    layout: "centered",
    elements: [
      { type: "headline", size: "lg" },
      { type: "button" },
    ],
  },
  "hero-video": {
    layout: "centered",
    elements: [
      { type: "headline", size: "lg" },
      { type: "text" },
      { type: "button" },
    ],
    accent: true,
  },

  // Features templates
  "features-grid": {
    layout: "grid",
    elements: [],
  },
  "features-cards": {
    layout: "cards",
    elements: [],
  },
  "features-alternating": {
    layout: "alternating",
    elements: [],
  },
  "features-icons-left": {
    layout: "rows",
    elements: [],
  },

  // CTA templates
  "cta-simple": {
    layout: "banner",
    elements: [],
    accent: true,
  },
  "cta-banner": {
    layout: "banner",
    elements: [],
    accent: true,
  },
  "cta-split": {
    layout: "split-left",
    elements: [
      { type: "headline" },
      { type: "text" },
      { type: "button" },
    ],
  },

  // Pricing templates
  "pricing-simple": {
    layout: "cards",
    elements: [],
  },
  "pricing-comparison": {
    layout: "cards",
    elements: [],
    accent: true,
  },
  "pricing-toggle": {
    layout: "cards",
    elements: [],
  },

  // Testimonials templates
  "testimonials-grid": {
    layout: "grid",
    elements: [],
  },
  "testimonials-carousel": {
    layout: "centered",
    elements: [
      { type: "text" },
      { type: "avatar" },
    ],
  },
  "testimonials-quotes": {
    layout: "rows",
    elements: [],
  },

  // FAQ templates
  "faq-accordion": {
    layout: "rows",
    elements: [],
  },
  "faq-two-column": {
    layout: "grid",
    elements: [],
  },
  "faq-tabs": {
    layout: "cards",
    elements: [],
  },

  // About templates
  "about-text-left": {
    layout: "split-left",
    elements: [
      { type: "headline" },
      { type: "text" },
      { type: "text" },
    ],
  },
  "about-centered": {
    layout: "centered",
    elements: [
      { type: "headline" },
      { type: "text" },
    ],
  },

  // Services templates
  "services-grid": {
    layout: "grid",
    elements: [],
  },
  "services-cards": {
    layout: "cards",
    elements: [],
  },

  // Stats templates
  "stats-row": {
    layout: "grid",
    elements: [],
  },
  "stats-cards": {
    layout: "cards",
    elements: [],
  },

  // Logos templates
  "logos-strip": {
    layout: "grid",
    elements: [],
  },
  "logos-grid": {
    layout: "cards",
    elements: [],
  },

  // Contact templates
  "contact-form-left": {
    layout: "split-left",
    elements: [
      { type: "headline" },
      { type: "text" },
    ],
  },
  "contact-centered": {
    layout: "centered",
    elements: [
      { type: "headline" },
      { type: "text" },
    ],
  },

  // Team templates
  "team-grid": {
    layout: "grid",
    elements: [],
  },
  "team-cards": {
    layout: "cards",
    elements: [],
  },

  // Gallery templates
  "gallery-grid": {
    layout: "grid",
    elements: [],
  },
  "gallery-masonry": {
    layout: "cards",
    elements: [],
  },

  // Portfolio templates
  "portfolio-grid": {
    layout: "grid",
    elements: [],
  },
  "portfolio-cards": {
    layout: "cards",
    elements: [],
  },

  // Menu templates
  "menu-categorized": {
    layout: "rows",
    elements: [],
  },
  "menu-cards": {
    layout: "cards",
    elements: [],
  },
};
