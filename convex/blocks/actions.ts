import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import {
  WEBSITE_GENERATION_PROMPT,
  SECTION_GENERATION_PROMPT,
  COMPOSITION_EDITING_PROMPT,
  buildWebsiteGenerationPrompt,
  buildSectionGenerationPrompt,
  buildCompositionEditPrompt,
} from "../../lib/blocks/ai-prompt";
import { getOpenRouterModelId } from "../../lib/models";

// ============================================================================
// Generate Website
// ============================================================================

export const generateWebsite = action({
  args: {
    businessName: v.string(),
    businessDescription: v.string(),
    pageTypes: v.array(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<{ websiteId: string }> => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getByEmail, {
      email: identity.email!,
    });
    if (!user) {
      throw new Error("User not found");
    }

    // Check AI call limits
    const usageCheck = await ctx.runMutation(api.usage.checkAndIncrementAiCalls, {});
    if (!usageCheck.allowed) {
      throw new Error("AI call limit reached. Please upgrade to Pro.");
    }

    // Create OpenRouter provider
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const modelId = getOpenRouterModelId(args.model);

    // Build the prompt
    const userPrompt = buildWebsiteGenerationPrompt(
      args.businessName,
      args.businessDescription,
      args.pageTypes,
      args.imageUrls
    );

    console.log("Starting website generation with model:", modelId);

    try {
      const result = await generateText({
        model: openrouter(modelId),
        system: WEBSITE_GENERATION_PROMPT,
        prompt: userPrompt,
      });

      console.log("AI response length:", result.text?.length || 0);

      // Parse the response
      let parsed;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found in AI response");
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.error("Raw response:", result.text?.substring(0, 1000));
        throw new Error("Failed to parse AI response. Please try again.");
      }

      // Validate response structure
      if (!parsed.website || !parsed.pages) {
        throw new Error("Invalid AI response structure");
      }

      // Create the website
      const websiteId = await ctx.runMutation(api.websites.create, {
        name: parsed.website.name || args.businessName,
        businessContext: {
          name: parsed.website.businessContext?.name || args.businessName,
          description: parsed.website.businessContext?.description || args.businessDescription,
          industry: parsed.website.businessContext?.industry,
          targetAudience: parsed.website.businessContext?.targetAudience,
          uniqueValue: parsed.website.businessContext?.uniqueValue,
        },
        theme: {
          primaryColor: parsed.website.theme?.primaryColor || "#6366f1",
          secondaryColor: parsed.website.theme?.secondaryColor || "#8b5cf6",
          accentColor: parsed.website.theme?.accentColor || "#f59e0b",
          backgroundColor: parsed.website.theme?.backgroundColor || "#ffffff",
          textColor: parsed.website.theme?.textColor || "#1f2937",
          fontFamily: parsed.website.theme?.fontFamily || "Inter",
        },
      });

      // Create pages and sections
      for (const pageData of parsed.pages) {
        const pageId = await ctx.runMutation(api.pages.create, {
          websiteId,
          name: pageData.name,
          slug: pageData.slug,
          pageType: pageData.pageType || "landing",
          isHomePage: pageData.isHomePage || false,
          meta: pageData.meta,
        });

        // Create sections for this page
        if (pageData.sections) {
          for (let i = 0; i < pageData.sections.length; i++) {
            const sectionData = pageData.sections[i];

            // Validate composition
            if (!sectionData.composition?.root || !sectionData.composition?.blocks) {
              console.warn("Invalid section composition, skipping:", sectionData.name);
              continue;
            }

            await ctx.runMutation(api.pageSections.create, {
              pageId,
              name: sectionData.name,
              composition: sectionData.composition,
              order: i,
              isVisible: true,
            });
          }
        }
      }

      return { websiteId };
    } catch (error: any) {
      console.error("Website generation error:", error);

      if (error.message?.includes("rate limit")) {
        throw new Error("AI service is busy. Please try again in a moment.");
      }
      if (error.message?.includes("API key")) {
        throw new Error("AI service configuration error. Please contact support.");
      }

      throw new Error(`Failed to generate website: ${error.message || "Unknown error"}`);
    }
  },
});

// ============================================================================
// Generate Section
// ============================================================================

export const generateSection = action({
  args: {
    pageId: v.id("pages"),
    sectionType: v.string(),
    additionalContext: v.optional(v.string()),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<{ sectionId: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get page and website for context
    const page = await ctx.runQuery(api.pages.get, { id: args.pageId });
    if (!page) {
      throw new Error("Page not found");
    }

    const website = await ctx.runQuery(api.websites.get, { id: page.websiteId });
    if (!website) {
      throw new Error("Website not found");
    }

    // Check AI call limits
    const usageCheck = await ctx.runMutation(api.usage.checkAndIncrementAiCalls, {});
    if (!usageCheck.allowed) {
      throw new Error("AI call limit reached. Please upgrade to Pro.");
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const modelId = getOpenRouterModelId(args.model);

    const userPrompt = buildSectionGenerationPrompt(
      args.sectionType,
      website.businessContext,
      args.additionalContext
    );

    try {
      const result = await generateText({
        model: openrouter(modelId),
        system: SECTION_GENERATION_PROMPT,
        prompt: userPrompt,
      });

      // Parse the response
      let parsed;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found");
        }
      } catch {
        throw new Error("Failed to parse AI response");
      }

      if (!parsed.composition?.root || !parsed.composition?.blocks) {
        throw new Error("Invalid composition in AI response");
      }

      // Create the section
      const sectionId = await ctx.runMutation(api.pageSections.create, {
        pageId: args.pageId,
        name: parsed.name || args.sectionType,
        composition: parsed.composition,
        isVisible: true,
      });

      return { sectionId };
    } catch (error: any) {
      console.error("Section generation error:", error);
      throw new Error(`Failed to generate section: ${error.message}`);
    }
  },
});

// ============================================================================
// Edit Composition
// ============================================================================

export const editComposition = action({
  args: {
    sectionId: v.id("pageSections"),
    instruction: v.string(),
    targetBlockId: v.optional(v.string()),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; changes?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the section
    const section = await ctx.runQuery(api.pageSections.get, { id: args.sectionId });
    if (!section) {
      throw new Error("Section not found");
    }

    // Check AI call limits
    const usageCheck = await ctx.runMutation(api.usage.checkAndIncrementAiCalls, {});
    if (!usageCheck.allowed) {
      throw new Error("AI call limit reached. Please upgrade to Pro.");
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const modelId = getOpenRouterModelId(args.model);

    const userPrompt = buildCompositionEditPrompt(
      section.composition,
      args.instruction,
      args.targetBlockId
    );

    try {
      const result = await generateText({
        model: openrouter(modelId),
        system: COMPOSITION_EDITING_PROMPT,
        prompt: userPrompt,
      });

      // Parse the response
      let parsed;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found");
        }
      } catch {
        throw new Error("Failed to parse AI response");
      }

      if (!parsed.composition?.root || !parsed.composition?.blocks) {
        throw new Error("Invalid composition in AI response");
      }

      // Update the section
      await ctx.runMutation(api.pageSections.updateComposition, {
        id: args.sectionId,
        composition: parsed.composition,
      });

      return {
        success: true,
        changes: parsed.changes || "Composition updated successfully",
      };
    } catch (error: any) {
      console.error("Composition edit error:", error);
      throw new Error(`Failed to edit composition: ${error.message}`);
    }
  },
});

// ============================================================================
// Edit Block (Quick edits without full AI regeneration)
// ============================================================================

export const editBlockWithAI = action({
  args: {
    sectionId: v.id("pageSections"),
    blockId: v.string(),
    instruction: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; updatedProps?: any }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const section = await ctx.runQuery(api.pageSections.get, { id: args.sectionId });
    if (!section) {
      throw new Error("Section not found");
    }

    const block = section.composition.blocks[args.blockId];
    if (!block) {
      throw new Error("Block not found");
    }

    // Check AI call limits
    const usageCheck = await ctx.runMutation(api.usage.checkAndIncrementAiCalls, {});
    if (!usageCheck.allowed) {
      throw new Error("AI call limit reached. Please upgrade to Pro.");
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const modelId = getOpenRouterModelId(args.model);

    const prompt = `You are editing a single block. Here's the current block:

Block Type: ${block.type}
Current Props:
\`\`\`json
${JSON.stringify(block.props, null, 2)}
\`\`\`
Current Style Overrides: ${block.styleOverrides || "none"}

User Instruction: ${args.instruction}

Return the updated block in this format:
\`\`\`json
{
  "props": { /* updated props */ },
  "styleOverrides": "updated tailwind classes or null"
}
\`\`\`

Only include the fields that need to change. Keep the same structure, just update values.`;

    try {
      const result = await generateText({
        model: openrouter(modelId),
        prompt,
      });

      let parsed;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found");
        }
      } catch {
        throw new Error("Failed to parse AI response");
      }

      // Update the block
      await ctx.runMutation(api.pageSections.updateBlock, {
        id: args.sectionId,
        blockId: args.blockId,
        updates: {
          props: parsed.props ? { ...block.props, ...parsed.props } : undefined,
          styleOverrides: parsed.styleOverrides,
        },
      });

      return {
        success: true,
        updatedProps: parsed.props,
      };
    } catch (error: any) {
      console.error("Block edit error:", error);
      throw new Error(`Failed to edit block: ${error.message}`);
    }
  },
});

// ============================================================================
// Regenerate Section Content
// ============================================================================

export const regenerateSection = action({
  args: {
    sectionId: v.id("pageSections"),
    instruction: v.optional(v.string()),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const section = await ctx.runQuery(api.pageSections.get, { id: args.sectionId });
    if (!section) {
      throw new Error("Section not found");
    }

    const page = await ctx.runQuery(api.pages.get, { id: section.pageId });
    if (!page) {
      throw new Error("Page not found");
    }

    const website = await ctx.runQuery(api.websites.get, { id: page.websiteId });
    if (!website) {
      throw new Error("Website not found");
    }

    // Check AI call limits
    const usageCheck = await ctx.runMutation(api.usage.checkAndIncrementAiCalls, {});
    if (!usageCheck.allowed) {
      throw new Error("AI call limit reached. Please upgrade to Pro.");
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const modelId = getOpenRouterModelId(args.model);

    // Determine section type from root block or name
    const rootBlock = section.composition.blocks[section.composition.root];
    const sectionType = section.name || rootBlock?.type || "section";

    const userPrompt = buildSectionGenerationPrompt(
      sectionType,
      website.businessContext,
      args.instruction
    );

    try {
      const result = await generateText({
        model: openrouter(modelId),
        system: SECTION_GENERATION_PROMPT,
        prompt: userPrompt,
      });

      let parsed;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found");
        }
      } catch {
        throw new Error("Failed to parse AI response");
      }

      if (!parsed.composition?.root || !parsed.composition?.blocks) {
        throw new Error("Invalid composition in AI response");
      }

      // Update the section with new composition
      await ctx.runMutation(api.pageSections.update, {
        id: args.sectionId,
        name: parsed.name || section.name,
        composition: parsed.composition,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Section regeneration error:", error);
      throw new Error(`Failed to regenerate section: ${error.message}`);
    }
  },
});
