import { cn } from "@/lib/utils";
import type { StyleOverrides } from "./templates";

/**
 * Apply element-level style overrides to base classes.
 *
 * Uses the cn() utility (clsx + tailwind-merge) to intelligently merge classes,
 * handling deduplication and conflict resolution (e.g., text-sm + text-xl → text-xl).
 *
 * @param baseClasses - The template's default classes for this element
 * @param selector - The element selector path (e.g., "headline", "cta.button", "features[0].title")
 * @param overrides - The StyleOverrides object from the section
 * @returns Merged class string
 *
 * @example
 * applyElementOverrides(
 *   "text-4xl font-bold text-gray-900",
 *   "headline",
 *   { elements: { headline: "text-6xl text-blue-500" } }
 * )
 * // Returns: "font-bold text-6xl text-blue-500"
 */
export function applyElementOverrides(
  baseClasses: string,
  selector: string,
  overrides?: StyleOverrides
): string {
  if (!overrides?.elements) return baseClasses;

  const elementClasses = overrides.elements[selector];
  if (!elementClasses) return baseClasses;

  return cn(baseClasses, elementClasses);
}

/**
 * Apply section-level style overrides to the section container.
 *
 * @param baseClasses - The template's default container classes
 * @param overrides - The StyleOverrides object from the section
 * @returns Merged class string
 *
 * @example
 * applySectionOverrides(
 *   "min-h-[80vh] py-20 px-6",
 *   { section: "py-32 bg-gradient-to-br" }
 * )
 * // Returns: "min-h-[80vh] px-6 py-32 bg-gradient-to-br"
 */
export function applySectionOverrides(
  baseClasses: string,
  overrides?: StyleOverrides
): string {
  if (!overrides?.section) return baseClasses;
  return cn(baseClasses, overrides.section);
}

/**
 * Get element classes directly without merging (for inspection).
 *
 * @param selector - The element selector path
 * @param overrides - The StyleOverrides object
 * @returns The override classes or undefined
 */
export function getElementOverrides(
  selector: string,
  overrides?: StyleOverrides
): string | undefined {
  return overrides?.elements?.[selector];
}

/**
 * Check if an element has style overrides.
 *
 * @param selector - The element selector path
 * @param overrides - The StyleOverrides object
 * @returns Whether the element has custom overrides
 */
export function hasElementOverrides(
  selector: string,
  overrides?: StyleOverrides
): boolean {
  return Boolean(overrides?.elements?.[selector]);
}

/**
 * Merge two StyleOverrides objects together.
 * Useful when combining AI-generated overrides with existing ones.
 *
 * @param existing - Current style overrides
 * @param incoming - New overrides to merge in
 * @returns Combined StyleOverrides
 */
export function mergeStyleOverrides(
  existing: StyleOverrides | undefined,
  incoming: StyleOverrides
): StyleOverrides {
  return {
    section: incoming.section
      ? cn(existing?.section, incoming.section)
      : existing?.section,
    elements: {
      ...existing?.elements,
      ...Object.fromEntries(
        Object.entries(incoming.elements || {}).map(([selector, classes]) => [
          selector,
          cn(existing?.elements?.[selector], classes),
        ])
      ),
    },
  };
}

/**
 * Create an empty StyleOverrides object.
 */
export function createEmptyStyleOverrides(): StyleOverrides {
  return {
    section: undefined,
    elements: {},
  };
}

/**
 * Check if StyleOverrides has any overrides defined.
 */
export function hasAnyOverrides(overrides?: StyleOverrides): boolean {
  if (!overrides) return false;
  if (overrides.section) return true;
  if (overrides.elements && Object.keys(overrides.elements).length > 0)
    return true;
  return false;
}

/**
 * Validation result for styleOverrides.
 */
export interface StyleOverridesValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate that styleOverrides has the correct structure.
 * Checks that section and elements are properly formatted.
 *
 * @param overrides - The object to validate
 * @returns Validation result with any errors found
 *
 * @example
 * validateStyleOverrides({ elements: { headline: "font-bold" } })
 * // Returns: { valid: true, errors: [] }
 *
 * validateStyleOverrides({ elements: { headline: 123 } })
 * // Returns: { valid: false, errors: ["elements.headline must be a string of Tailwind classes"] }
 */
export function validateStyleOverrides(
  overrides: unknown
): StyleOverridesValidationResult {
  const errors: string[] = [];

  // Check if overrides is an object
  if (!overrides || typeof overrides !== "object") {
    return { valid: false, errors: ["styleOverrides must be an object"] };
  }

  const obj = overrides as Record<string, unknown>;

  // Validate section field if present
  if (obj.section !== undefined) {
    if (typeof obj.section !== "string") {
      errors.push("section must be a string of Tailwind classes");
    } else if (obj.section.trim() === "") {
      // Empty string is valid (means no section override)
    }
  }

  // Validate elements field if present
  if (obj.elements !== undefined) {
    if (typeof obj.elements !== "object" || obj.elements === null) {
      errors.push("elements must be an object");
    } else {
      const elements = obj.elements as Record<string, unknown>;
      for (const [selector, classes] of Object.entries(elements)) {
        if (typeof classes !== "string") {
          errors.push(
            `elements.${selector} must be a string of Tailwind classes`
          );
        }
      }
    }
  }

  // Check that at least one override is defined
  const hasSection = typeof obj.section === "string" && obj.section.trim() !== "";
  const hasElements =
    typeof obj.elements === "object" &&
    obj.elements !== null &&
    Object.keys(obj.elements).length > 0;

  if (!hasSection && !hasElements) {
    errors.push("styleOverrides must have at least a section or elements override");
  }

  return { valid: errors.length === 0, errors };
}
