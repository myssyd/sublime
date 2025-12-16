"use client";

import { SectionType, Theme } from "@/lib/sections/definitions";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { StyleOverrides } from "@/lib/sections/templates";
import { getTemplate, getDefaultTemplateId, hasTemplate } from "./registry";

// Legacy section components (for backward compatibility)
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

// Legacy component registry (for backward compatibility)
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
  templateId?: string;
  content: any;
  theme: Theme;
  styleOverrides?: StyleOverrides;
  className?: string;
  isCommentMode?: boolean;
  isSelectMode?: boolean;
  onElementClick?: (element: HTMLElement, event: React.MouseEvent) => void;
  onTextEdit?: (oldText: string, newText: string) => void;
}

// Selector for interactive elements
const INTERACTIVE_ELEMENTS_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, span, a, button, img, li, div[class*="card"], div[class*="item"]';

// Selector for text elements that can be edited
const TEXT_ELEMENTS_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, span, a, button, li';

// Dynamic section renderer
export function SectionRenderer({
  type,
  templateId,
  content,
  theme,
  styleOverrides,
  className,
  isCommentMode,
  isSelectMode,
  onElementClick,
  onTextEdit,
}: SectionRendererProps) {
  // Determine which template to use
  const resolvedTemplateId = templateId || getDefaultTemplateId(type as SectionType);
  const template = hasTemplate(resolvedTemplateId) ? getTemplate(resolvedTemplateId) : null;

  // Use template system if available, otherwise fall back to legacy
  const useLegacy = !template;
  const LegacyComponent = useLegacy ? sectionRegistry[type as SectionType] : null;

  if (!template && !LegacyComponent) {
    console.warn(`Unknown section type or template: ${type} / ${templateId}`);
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
    // Handle comment mode
    if (isCommentMode && onElementClick) {
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
      return;
    }

    // Handle select mode - single click to edit text
    if (isSelectMode && onTextEdit) {
      const target = e.target as HTMLElement;
      const textElement = target.closest(TEXT_ELEMENTS_SELECTOR) as HTMLElement;

      if (!textElement) return;

      // Skip if already editing
      if (textElement.getAttribute("contenteditable") === "true") return;

      e.preventDefault();
      e.stopPropagation();

      // Store original text for potential cancel
      const originalText = textElement.textContent || "";

      // Make element editable
      textElement.setAttribute("contenteditable", "true");
      textElement.classList.add("select-editing-element");
      textElement.focus();

      // Place cursor at end of text
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textElement);
      range.collapse(false); // false = collapse to end
      selection?.removeAllRanges();
      selection?.addRange(range);

      const handleBlur = () => {
        textElement.removeAttribute("contenteditable");
        textElement.classList.remove("select-editing-element");

        const newText = textElement.textContent || "";
        if (newText !== originalText && newText.trim() !== "") {
          onTextEdit(originalText, newText);
        } else if (newText.trim() === "") {
          // Restore original if empty
          textElement.textContent = originalText;
        }

        textElement.removeEventListener("blur", handleBlur);
        textElement.removeEventListener("keydown", handleKeyDown);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          textElement.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          textElement.textContent = originalText;
          textElement.blur();
        }
      };

      textElement.addEventListener("blur", handleBlur);
      textElement.addEventListener("keydown", handleKeyDown);
    }
  };

  const modeClass = isCommentMode
    ? "section-comment-mode"
    : isSelectMode
      ? "section-select-mode"
      : "";

  // Render the appropriate component
  const renderSection = () => {
    if (template) {
      const TemplateComponent = template.component;
      return (
        <TemplateComponent
          content={content}
          theme={theme}
          styleOverrides={styleOverrides}
          className={className}
        />
      );
    }
    // Legacy fallback
    if (LegacyComponent) {
      return <LegacyComponent content={content} theme={theme} className={className} />;
    }
    return null;
  };

  return (
    <div
      className={`relative ${modeClass}`}
      onClick={handleClick}
    >
      {renderSection()}

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

      {/* Select mode styles */}
      {isSelectMode && (
        <style jsx global>{`
          .section-select-mode h1,
          .section-select-mode h2,
          .section-select-mode h3,
          .section-select-mode h4,
          .section-select-mode h5,
          .section-select-mode h6,
          .section-select-mode p,
          .section-select-mode span,
          .section-select-mode a,
          .section-select-mode button,
          .section-select-mode li,
          .section-select-mode img,
          .section-select-mode div[class*="card"],
          .section-select-mode div[class*="item"] {
            outline: 1px solid transparent !important;
            outline-offset: 2px !important;
            transition: outline-color 150ms ease-out, outline-offset 150ms ease-out !important;
            border-radius: 2px !important;
          }
          .section-select-mode h1:hover,
          .section-select-mode h2:hover,
          .section-select-mode h3:hover,
          .section-select-mode h4:hover,
          .section-select-mode h5:hover,
          .section-select-mode h6:hover,
          .section-select-mode p:hover,
          .section-select-mode span:hover,
          .section-select-mode a:hover,
          .section-select-mode button:hover,
          .section-select-mode li:hover,
          .section-select-mode img:hover,
          .section-select-mode div[class*="card"]:hover,
          .section-select-mode div[class*="item"]:hover {
            outline-color: rgba(100, 116, 139, 0.5) !important;
            outline-offset: 4px !important;
          }
          .select-editing-element {
            outline-color: #3b82f6 !important;
            outline-offset: 4px !important;
            cursor: text !important;
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
