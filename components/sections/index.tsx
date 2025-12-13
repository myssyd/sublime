"use client";

import { SectionType, Theme } from "@/lib/sections/definitions";
import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { PricingSection } from "./pricing-section";
import { TestimonialsSection } from "./testimonials-section";
import { FAQSection } from "./faq-section";
import { CTASection } from "./cta-section";
import { MenuSection } from "./menu-section";
import { PortfolioSection } from "./portfolio-section";
import { TeamSection } from "./team-section";
import { GallerySection } from "./gallery-section";
import { ContactSection } from "./contact-section";
import { StatsSection } from "./stats-section";
import { LogosSection } from "./logos-section";
import { AboutSection } from "./about-section";
import { ServicesSection } from "./services-section";

// Component registry mapping section types to their React components
export const sectionRegistry: Record<
  SectionType,
  React.ComponentType<{ content: any; theme: Theme; className?: string }>
> = {
  hero: HeroSection,
  features: FeaturesSection,
  pricing: PricingSection,
  testimonials: TestimonialsSection,
  faq: FAQSection,
  cta: CTASection,
  menu: MenuSection,
  portfolio: PortfolioSection,
  team: TeamSection,
  gallery: GallerySection,
  contact: ContactSection,
  stats: StatsSection,
  logos: LogosSection,
  about: AboutSection,
  services: ServicesSection,
};

// Props for the SectionRenderer
interface SectionRendererProps {
  type: string;
  content: any;
  theme: Theme;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

// Dynamic section renderer
export function SectionRenderer({
  type,
  content,
  theme,
  className,
  onClick,
  isSelected,
}: SectionRendererProps) {
  const Component = sectionRegistry[type as SectionType];

  if (!Component) {
    console.warn(`Unknown section type: ${type}`);
    return (
      <div
        className="p-8 text-center border-2 border-dashed border-red-300 rounded-lg"
        onClick={onClick}
      >
        <p className="text-red-500">Unknown section type: {type}</p>
      </div>
    );
  }

  return (
    <div
      className={`relative ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
      onClick={onClick}
    >
      <Component content={content} theme={theme} className={className} />
    </div>
  );
}

// Export all section components for direct use if needed
export {
  HeroSection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
  MenuSection,
  PortfolioSection,
  TeamSection,
  GallerySection,
  ContactSection,
  StatsSection,
  LogosSection,
  AboutSection,
  ServicesSection,
};
