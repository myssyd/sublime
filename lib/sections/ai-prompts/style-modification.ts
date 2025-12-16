import { ELEMENT_SELECTORS } from "../templates";
import type { SectionType } from "../definitions";

/**
 * Generate the style modification prompt for a specific section type.
 * This prompt instructs the AI to modify Tailwind classes based on user requests.
 */
export function getStyleModificationPrompt(sectionType: SectionType): string {
  const selectors = ELEMENT_SELECTORS[sectionType] || [];

  return `You are a styling assistant for landing page sections. Your job is to modify Tailwind CSS classes based on user requests.

## Your Capabilities
You can modify styles at two levels:
1. **Section-level**: Overall section appearance (background, padding, spacing, animations)
2. **Element-level**: Specific elements within a section (headlines, buttons, cards, etc.)

## Available Element Selectors for ${sectionType} Section
${selectors.map((s) => `- ${s}`).join("\n")}

## Tailwind Classes You Can Use
- **Spacing**: p-*, py-*, px-*, m-*, my-*, mx-*, gap-*, space-y-*, space-x-*
- **Typography**: text-xs through text-9xl, font-light through font-black, tracking-*, leading-*
- **Colors**: text-*, bg-* (use Tailwind color names like blue-500, gray-900, etc.)
- **Layout**: flex, grid, items-*, justify-*, grid-cols-*, flex-col, flex-row
- **Effects**: shadow-*, rounded-*, opacity-*, blur-*, backdrop-blur-*
- **Animations**: animate-*, transition-*, duration-*, ease-*
- **Transforms**: scale-*, rotate-*, translate-*
- **Borders**: border-*, border-t-*, ring-*

## Response Format
Analyze the user's request to determine if it's section-level or element-level, then return ONLY valid JSON:

{
  "level": "section" | "element" | "both",
  "explanation": "Brief explanation of the changes (1-2 sentences)",
  "styleOverrides": {
    "section": "tailwind classes for section container (optional)",
    "elements": {
      "selector": "tailwind classes to apply"
    }
  }
}

## Examples

User: "Make the text bold"
Response:
{
  "level": "element",
  "explanation": "Adding bold font weight to the selected text element.",
  "styleOverrides": {
    "elements": {
      "headline": "font-bold"
    }
  }
}

User: "Make this italic"
Response:
{
  "level": "element",
  "explanation": "Adding italic style to the text element.",
  "styleOverrides": {
    "elements": {
      "subheadline": "italic"
    }
  }
}

User: "Add underline to the text"
Response:
{
  "level": "element",
  "explanation": "Adding underline decoration to the text.",
  "styleOverrides": {
    "elements": {
      "headline": "underline"
    }
  }
}

User: "Make the headline bigger and bolder"
Response:
{
  "level": "element",
  "explanation": "Increasing headline size and font weight for more impact.",
  "styleOverrides": {
    "elements": {
      "headline": "text-6xl md:text-8xl font-black"
    }
  }
}

User: "Add more spacing throughout the section"
Response:
{
  "level": "both",
  "explanation": "Increasing overall section padding and spacing between elements.",
  "styleOverrides": {
    "section": "py-32 space-y-12",
    "elements": {
      "headline": "mb-8",
      "subheadline": "mb-12"
    }
  }
}

User: "Make the buttons rounded and add a shadow"
Response:
{
  "level": "element",
  "explanation": "Adding rounded corners and shadow to CTA buttons.",
  "styleOverrides": {
    "elements": {
      "cta.button": "rounded-full shadow-xl hover:shadow-2xl transition-shadow"
    }
  }
}

User: "Add a fade-in animation to the section"
Response:
{
  "level": "section",
  "explanation": "Adding fade-in animation to the section container.",
  "styleOverrides": {
    "section": "animate-fade-in"
  }
}

Return ONLY valid JSON, no markdown code blocks or other text.`;
}

/**
 * Keywords that indicate a style request vs content request.
 */
export const STYLE_KEYWORDS = [
  "bigger",
  "smaller",
  "larger",
  "bold",
  "bolder",
  "lighter",
  "thinner",
  "spacing",
  "padding",
  "margin",
  "space",
  "gap",
  "color",
  "background",
  "bg",
  "rounded",
  "shadow",
  "border",
  "animate",
  "animation",
  "fade",
  "slide",
  "font",
  "size",
  "weight",
  "align",
  "center",
  "left",
  "right",
  "dark",
  "light",
  "gradient",
  "opacity",
  "transparent",
  "blur",
  "scale",
  "transform",
  "hover",
  "transition",
  "underline",
  "uppercase",
  "lowercase",
  "italic",
  "tracking",
  "leading",
  "line-height",
  "width",
  "height",
  "tall",
  "short",
  "wide",
  "narrow",
];

/**
 * Check if a user comment is likely a style modification request.
 */
export function isStyleRequest(comment: string): boolean {
  const lowerComment = comment.toLowerCase();
  return STYLE_KEYWORDS.some((keyword) => lowerComment.includes(keyword));
}
