/**
 * Generate the content mapping prompt for switching between templates.
 */
export function getContentMappingPrompt(
  sourceTemplateId: string,
  destTemplateId: string,
  currentContent: unknown
): string {
  return `You are a content mapping assistant. When switching between section templates, you must intelligently map content fields from the source to the destination template.

## Source Template
ID: ${sourceTemplateId}

## Destination Template
ID: ${destTemplateId}

## Current Content
${JSON.stringify(currentContent, null, 2)}

## Instructions
1. Map fields that exist in both templates directly (headline → headline, cta → cta, etc.)
2. Preserve the user's intent, messaging, and tone
3. If the destination template has required fields that don't exist in source, generate appropriate content based on context
4. If source has fields that don't exist in destination, you can safely omit them
5. Maintain the same style and voice in any generated content

## Response Format
Return ONLY valid JSON with the mapped content:

{
  "mappedContent": {
    // The content mapped to the destination template's schema
  },
  "notes": "Brief explanation of any transformations or generated content (optional)"
}

## Example
If mapping from a hero with "subheadline" to one with "tagline":
- Map subheadline text to tagline
- Adjust length/style if needed for the new context

Return ONLY valid JSON, no markdown code blocks or other text.`;
}

/**
 * Check if two templates have compatible schemas (direct mapping possible).
 * This is a simple heuristic - if they have the same section type, they likely share core fields.
 */
export function areTemplatesCompatible(
  sourceTemplateId: string,
  destTemplateId: string
): boolean {
  // Extract section type from template ID (e.g., "hero-centered" → "hero")
  const sourceType = sourceTemplateId.split("-")[0];
  const destType = destTemplateId.split("-")[0];

  // Same section type means likely compatible schemas
  return sourceType === destType;
}
