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
  isCommentMode?: boolean;
  selectedElement?: HTMLElement | null;
  onElementClick?: (element: HTMLElement, event: React.MouseEvent) => void;
}

// Selector for interactive elements
const INTERACTIVE_ELEMENTS_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, span, a, button, img, li, div[class*="card"], div[class*="item"]';

// Dynamic section renderer
export function SectionRenderer({
  type,
  content,
  theme,
  className,
  isCommentMode,
  selectedElement,
  onElementClick,
}: SectionRendererProps) {
  const Component = sectionRegistry[type as SectionType];

  if (!Component) {
    console.warn(`Unknown section type: ${type}`);
    return (
      <div className="p-8 text-center border-2 border-dashed border-red-300 rounded-lg">
        <p className="text-red-500">Unknown section type: {type}</p>
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isCommentMode || !onElementClick) return;

    e.preventDefault();
    e.stopPropagation();

    // Find the closest interactive element (not the section wrapper itself)
    const target = e.target as HTMLElement;
    const interactiveElement = target.closest(
      INTERACTIVE_ELEMENTS_SELECTOR
    ) as HTMLElement;

    if (interactiveElement) {
      onElementClick(interactiveElement, e);
    } else {
      // Fallback to the clicked element itself
      onElementClick(target, e);
    }
  };

  return (
    <div
      className={`relative ${isCommentMode ? "section-comment-mode" : ""}`}
      onClick={handleClick}
    >
      <Component content={content} theme={theme} className={className} />

      {/* Comment mode styles */}
      {isCommentMode && (
        <style jsx global>{`
          .section-comment-mode * {
            cursor: pointer !important;
          }
          .section-comment-mode *:hover {
            outline: 2px dashed #3b82f6 !important;
            outline-offset: 2px !important;
          }
          .comment-selected-element {
            outline: 2px dashed #3b82f6 !important;
            outline-offset: 2px !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
          }
        `}</style>
      )}
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
