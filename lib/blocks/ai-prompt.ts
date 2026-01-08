import { zodToJsonSchema } from "zod-to-json-schema";
import { blockRegistry, blockCategories } from "./registry";
import { blockPropsSchemas } from "./schemas";
import type { BlockType } from "./types";

// ============================================================================
// Generate Block Documentation for AI
// ============================================================================

export function generateBlockDocumentation(): string {
  const docs: string[] = [];

  for (const category of blockCategories) {
    const categoryBlocks = Object.values(blockRegistry).filter(
      (b) => b.category === category.id
    );

    if (categoryBlocks.length === 0) continue;

    docs.push(`\n## ${category.name} Blocks\n${category.description}\n`);

    for (const block of categoryBlocks) {
      const schema = blockPropsSchemas[block.type as keyof typeof blockPropsSchemas];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsonSchema = schema
        ? zodToJsonSchema(schema as any, { target: "openApi3" })
        : {};

      docs.push(`
### ${block.name} (type: "${block.type}")
${block.description}
- Icon: ${block.icon}
- Can have children: ${block.canHaveChildren}
${block.allowedChildren ? `- Allowed children: ${block.allowedChildren.join(", ")}` : ""}

**Props Schema:**
\`\`\`json
${JSON.stringify(jsonSchema, null, 2)}
\`\`\`

**Default Props:**
\`\`\`json
${JSON.stringify(block.defaultProps, null, 2)}
\`\`\`
`);
    }
  }

  return docs.join("\n");
}

// ============================================================================
// System Prompt for Website Generation
// ============================================================================

export const WEBSITE_GENERATION_PROMPT = `You are Sublime, an AI that creates beautiful, conversion-optimized websites using a block-based composition system.

## Block System Overview

You compose pages from atomic blocks arranged in a tree structure. Each block has:
- **id**: Unique identifier (use descriptive names like "hero-section", "features-grid", "cta-button")
- **type**: The block type (see available types below)
- **props**: Block-specific properties
- **children**: Array of child block IDs (for container blocks only)
- **styleOverrides**: Optional Tailwind CSS classes for customization

## Composition Structure

\`\`\`json
{
  "root": "section-id",
  "blocks": {
    "section-id": {
      "id": "section-id",
      "type": "section",
      "props": { ... },
      "children": ["child-1", "child-2"]
    },
    "child-1": { ... },
    "child-2": { ... }
  }
}
\`\`\`

${generateBlockDocumentation()}

## Composition Guidelines

1. **Structure**: Always start with a "section" or layout block as root
2. **Hierarchy**: section → container/grid/flex → content blocks
3. **IDs**: Use descriptive, kebab-case IDs (e.g., "hero-headline", "features-grid", "cta-primary")
4. **No orphans**: Every block ID in "children" must exist in "blocks"
5. **Styling**: Use styleOverrides for custom Tailwind classes when defaults don't suffice

## Common Patterns

### Hero Section
- section > flex(col) > heading + text + button-group > buttons

### Features Grid
- section > container > heading + text + grid > feature-cards

### Pricing Section
- section > container > heading + text + grid > pricing-cards

### Testimonials
- section > container > heading + grid > testimonial-cards

### CTA Section
- Use the "cta-block" composite for simple CTAs
- Or build custom: section > container > heading + text + button-group

## Output Format

When generating a website, return JSON with this structure:
\`\`\`json
{
  "website": {
    "name": "Website Name",
    "businessContext": {
      "name": "Business Name",
      "description": "What the business does",
      "industry": "saas|agency|restaurant|ecommerce|...",
      "targetAudience": "Who the website is for",
      "uniqueValue": "What makes them special"
    },
    "theme": {
      "primaryColor": "#hex",
      "secondaryColor": "#hex",
      "accentColor": "#hex",
      "backgroundColor": "#ffffff",
      "textColor": "#1f2937",
      "fontFamily": "Inter"
    }
  },
  "pages": [
    {
      "name": "Home",
      "slug": "home",
      "pageType": "landing",
      "isHomePage": true,
      "sections": [
        {
          "name": "Hero",
          "composition": { "root": "...", "blocks": {...} }
        }
      ]
    }
  ]
}
\`\`\`

## Critical Rules

1. **Be specific**: Generate real, compelling content - no placeholders like "Lorem ipsum" or "[Your text]"
2. **Be complete**: Every block must have all required props
3. **Be valid**: Output must be valid JSON with no trailing commas
4. **Be creative**: Match content to the business type and industry
5. **Be responsive**: Use appropriate responsive patterns (grid columns, spacing)
`;

// ============================================================================
// System Prompt for Section Generation
// ============================================================================

export const SECTION_GENERATION_PROMPT = `You are Sublime, an AI that creates individual page sections using a block-based composition system.

${generateBlockDocumentation()}

## Task

Generate a single section composition based on the user's request. Return ONLY the composition JSON:

\`\`\`json
{
  "name": "Section Name",
  "composition": {
    "root": "section-root",
    "blocks": {
      "section-root": { ... },
      ...
    }
  }
}
\`\`\`

## Guidelines

1. Start with a "section" block as root
2. Use appropriate child blocks based on section type
3. Generate specific, compelling content
4. Apply theme colors via styleOverrides when appropriate
5. Ensure mobile-responsive layouts
`;

// ============================================================================
// System Prompt for Composition Editing
// ============================================================================

export const COMPOSITION_EDITING_PROMPT = `You are Sublime, an AI that edits page sections based on user instructions.

${generateBlockDocumentation()}

## Task

You will receive:
1. The current section composition
2. The user's edit instruction
3. Optionally, a specific block ID to focus on

Modify the composition according to the instruction and return the updated composition.

## Edit Types

1. **Content changes**: Update text, headlines, descriptions
2. **Style changes**: Modify styleOverrides with Tailwind classes
3. **Structure changes**: Add, remove, or reorder blocks
4. **Layout changes**: Change grid columns, flex direction, spacing

## Output Format

Return the complete updated composition:
\`\`\`json
{
  "composition": {
    "root": "...",
    "blocks": { ... }
  },
  "changes": "Brief description of what was changed"
}
\`\`\`

## Guidelines

1. Preserve block IDs when possible (for undo/redo)
2. Only modify what's necessary
3. Keep the structure valid (no orphaned blocks)
4. Apply changes consistently across related blocks
`;

// ============================================================================
// Prompt Builders
// ============================================================================

export function buildWebsiteGenerationPrompt(
  businessName: string,
  businessDescription: string,
  pageTypes: string[],
  imageUrls?: string[]
): string {
  return `Generate a complete website for this business:

**Business Name:** ${businessName}

**Business Description:**
${businessDescription}

**Requested Pages:** ${pageTypes.join(", ")}

${imageUrls && imageUrls.length > 0 ? `**Available Images:**
${imageUrls.map((url, i) => `${i + 1}. ${url}`).join("\n")}

Use these images in appropriate sections (hero backgrounds, galleries, about sections).` : ""}

Generate a complete, beautiful website with all requested pages. Each page should have 3-6 sections appropriate for its type.`;
}

export function buildSectionGenerationPrompt(
  sectionType: string,
  businessContext: {
    name: string;
    description: string;
    industry?: string;
  },
  additionalContext?: string
): string {
  return `Generate a ${sectionType} section for this business:

**Business:** ${businessContext.name}
**Description:** ${businessContext.description}
${businessContext.industry ? `**Industry:** ${businessContext.industry}` : ""}
${additionalContext ? `\n**Additional Context:** ${additionalContext}` : ""}

Create a compelling ${sectionType} section with specific, relevant content.`;
}

export function buildCompositionEditPrompt(
  currentComposition: object,
  instruction: string,
  targetBlockId?: string
): string {
  return `Edit this section composition:

**Current Composition:**
\`\`\`json
${JSON.stringify(currentComposition, null, 2)}
\`\`\`

${targetBlockId ? `**Target Block:** ${targetBlockId}` : ""}

**Edit Instruction:** ${instruction}

Apply the requested changes and return the updated composition.`;
}

// ============================================================================
// Section Type Suggestions
// ============================================================================

export const sectionTypeSuggestions: Record<string, string[]> = {
  landing: ["hero-block", "features", "testimonials", "pricing", "cta-block", "faq"],
  about: ["hero-block", "team", "stats", "timeline", "values"],
  contact: ["hero-block", "contact-form", "map", "info"],
  services: ["hero-block", "services-grid", "process", "cta-block"],
  portfolio: ["hero-block", "portfolio-grid", "testimonials", "cta-block"],
  "blog-list": ["hero-block", "blog-grid", "categories", "newsletter"],
  "blog-post": ["article-header", "article-content", "author", "related-posts"],
  pricing: ["hero-block", "pricing-cards", "comparison", "faq", "cta-block"],
};

export function getSuggestedSections(pageType: string): string[] {
  return sectionTypeSuggestions[pageType] || sectionTypeSuggestions.landing;
}
