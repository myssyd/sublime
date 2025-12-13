import { SectionType } from "./definitions";

export interface SectionMetadata {
  displayName: string;
  description: string;
  icon: string; // Hugeicon name
  industries: string[]; // When to suggest this section ("all" means universal)
  position: "top" | "middle" | "bottom" | "any";
}

export const sectionMetadata: Record<SectionType, SectionMetadata> = {
  hero: {
    displayName: "Hero",
    description:
      "The main banner with headline, subheadline, and call-to-action",
    icon: "Home01Icon",
    industries: ["all"],
    position: "top",
  },
  features: {
    displayName: "Features",
    description: "Grid or list of product/service features with icons",
    icon: "GridIcon",
    industries: ["saas", "agency", "ecommerce", "startup"],
    position: "middle",
  },
  pricing: {
    displayName: "Pricing",
    description: "Pricing tiers with features comparison",
    icon: "DollarCircleIcon",
    industries: ["saas", "agency", "freelancer"],
    position: "middle",
  },
  testimonials: {
    displayName: "Testimonials",
    description: "Customer quotes and social proof",
    icon: "QuoteUpIcon",
    industries: ["all"],
    position: "middle",
  },
  faq: {
    displayName: "FAQ",
    description: "Frequently asked questions with expandable answers",
    icon: "HelpCircleIcon",
    industries: ["all"],
    position: "bottom",
  },
  cta: {
    displayName: "Call to Action",
    description: "Final conversion section with prominent button",
    icon: "CursorClick01Icon",
    industries: ["all"],
    position: "bottom",
  },
  menu: {
    displayName: "Menu",
    description: "Food/drink menu with categories and prices",
    icon: "Restaurant01Icon",
    industries: ["restaurant", "cafe", "bar", "bakery"],
    position: "middle",
  },
  portfolio: {
    displayName: "Portfolio",
    description: "Showcase of past work or projects",
    icon: "Image01Icon",
    industries: ["agency", "freelancer", "photographer", "designer"],
    position: "middle",
  },
  team: {
    displayName: "Team",
    description: "Team member profiles with photos and roles",
    icon: "UserGroup01Icon",
    industries: ["agency", "startup", "consulting", "law"],
    position: "middle",
  },
  gallery: {
    displayName: "Gallery",
    description: "Image gallery or portfolio grid",
    icon: "ImageGalleryIcon",
    industries: ["restaurant", "photographer", "real-estate", "event"],
    position: "middle",
  },
  contact: {
    displayName: "Contact",
    description: "Contact form and business information",
    icon: "Mail01Icon",
    industries: ["all"],
    position: "bottom",
  },
  stats: {
    displayName: "Stats",
    description: "Key metrics and numbers that build credibility",
    icon: "ChartLineData01Icon",
    industries: ["saas", "agency", "startup", "consulting"],
    position: "middle",
  },
  logos: {
    displayName: "Client Logos",
    description: "Trusted by / As seen in logo strip",
    icon: "Building02Icon",
    industries: ["saas", "agency", "startup", "consulting"],
    position: "middle",
  },
  about: {
    displayName: "About",
    description: "Company story, mission, or background",
    icon: "InformationCircleIcon",
    industries: ["all"],
    position: "middle",
  },
  services: {
    displayName: "Services",
    description: "List of services offered with descriptions",
    icon: "Settings01Icon",
    industries: ["agency", "freelancer", "consulting", "law", "medical"],
    position: "middle",
  },
};

// Industry presets - suggested section combinations
export const industryPresets: Record<string, SectionType[]> = {
  saas: [
    "hero",
    "logos",
    "features",
    "stats",
    "pricing",
    "testimonials",
    "faq",
    "cta",
  ],
  agency: [
    "hero",
    "services",
    "portfolio",
    "team",
    "testimonials",
    "stats",
    "contact",
  ],
  restaurant: ["hero", "about", "menu", "gallery", "testimonials", "contact"],
  ecommerce: ["hero", "features", "stats", "testimonials", "faq", "cta"],
  freelancer: [
    "hero",
    "about",
    "services",
    "portfolio",
    "testimonials",
    "pricing",
    "contact",
  ],
  startup: [
    "hero",
    "features",
    "stats",
    "team",
    "testimonials",
    "pricing",
    "cta",
  ],
  consulting: [
    "hero",
    "about",
    "services",
    "team",
    "testimonials",
    "stats",
    "contact",
  ],
  photographer: ["hero", "about", "portfolio", "gallery", "testimonials", "contact"],
  "real-estate": ["hero", "features", "gallery", "testimonials", "stats", "contact"],
  medical: ["hero", "about", "services", "team", "testimonials", "faq", "contact"],
  law: ["hero", "about", "services", "team", "testimonials", "contact"],
  event: ["hero", "about", "gallery", "testimonials", "faq", "contact"],
};

// Get sections recommended for an industry
export function getSectionsForIndustry(industry: string): SectionType[] {
  const preset = industryPresets[industry.toLowerCase()];
  if (preset) return preset;

  // Default: return sections marked for "all" industries
  return (Object.entries(sectionMetadata) as [SectionType, SectionMetadata][])
    .filter(([, meta]) => meta.industries.includes("all"))
    .map(([type]) => type);
}

// Get display name for a section type
export function getSectionDisplayName(type: SectionType): string {
  return sectionMetadata[type]?.displayName ?? type;
}

// Get icon for a section type
export function getSectionIcon(type: SectionType): string {
  return sectionMetadata[type]?.icon ?? "FileIcon";
}
