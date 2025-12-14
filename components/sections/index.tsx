"use client";

import { SectionType, Theme } from "@/lib/sections/definitions";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
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
      <Empty className="border-red-300 p-8">
        <EmptyHeader>
          <EmptyTitle className="text-red-500">
            Unknown section type: {type}
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
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
            cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M14 6H22M18 2L18 10' stroke='%233b82f6' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M6.09881 19.5C4.7987 19.3721 3.82475 18.9816 3.17157 18.3284C2 17.1569 2 15.2712 2 11.5V11C2 7.22876 2 5.34315 3.17157 4.17157C4.34315 3 6.22876 3 10 3H11.5M6.5 18C6.29454 19.0019 5.37769 21.1665 6.31569 21.8651C6.806 22.2218 7.58729 21.8408 9.14987 21.0789C10.2465 20.5441 11.3562 19.9309 12.5546 19.655C12.9931 19.5551 13.4395 19.5125 14 19.5C17.7712 19.5 19.6569 19.5 20.8284 18.3284C21.947 17.2098 21.9976 15.4403 21.9999 12' stroke='%233b82f6' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") 4 4, pointer !important;
            outline: 2px dashed transparent !important;
            outline-offset: 2px !important;
            transition: outline-color 200ms ease-out, outline-offset 200ms ease-out, background-color 200ms ease-out !important;
          }
          .section-comment-mode *:hover {
            outline-color: #3b82f6 !important;
            outline-offset: 4px !important;
          }
          .comment-selected-element {
            outline-color: #3b82f6 !important;
            outline-offset: 4px !important;
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
