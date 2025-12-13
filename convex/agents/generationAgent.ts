import { Agent, createTool, type ToolCtx } from "@convex-dev/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { components, internal } from "../_generated/api";
import { z } from "zod";
import { Id } from "../_generated/dataModel";
import {
  sectionSchemas,
  themeSchema,
  businessContextSchema,
  SectionType,
} from "../../lib/sections/definitions";
import { GENERATION_AGENT_PROMPT } from "../../lib/sections/ai-prompt";

// Custom context type for our agent tools
type CustomCtx = {
  userId: Id<"users">;
};

// Create OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Schema for generated sections
const generatedSectionSchema = z.object({
  type: z.string().describe("Section type from available types"),
  content: z.any().describe("Section content matching the type's schema"),
  variants: z
    .array(z.any())
    .optional()
    .describe("Alternative content variants for A/B testing"),
});

// Tool to generate a complete landing page
const generateLandingPageTool = createTool({
  description:
    "Generate a complete landing page with sections based on the business context gathered from conversation",
  args: z.object({
    businessContext: businessContextSchema.describe(
      "Information about the business gathered from conversation"
    ),
    sections: z
      .array(generatedSectionSchema)
      .describe("Array of sections to create for the landing page"),
    theme: themeSchema.describe(
      "Color theme and typography for the landing page"
    ),
  }),
  handler: async (
    ctx: ToolCtx,
    args: {
      businessContext: z.infer<typeof businessContextSchema>;
      sections: z.infer<typeof generatedSectionSchema>[];
      theme: z.infer<typeof themeSchema>;
    }
  ): Promise<{ pageId: string; message: string }> => {
    // Get userId from custom context (passed via generateText ctx extension)
    const customCtx = ctx as ToolCtx & CustomCtx;
    const userId = customCtx.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Create the landing page via internal mutation
    const pageId = await ctx.runMutation(
      internal.agents.mutations.createPageWithSections,
      {
        userId,
        name: args.businessContext.name,
        businessContext: args.businessContext,
        theme: args.theme,
        sections: args.sections.map((s: any, i: number) => ({
          type: s.type,
          order: i,
          content: s.content,
          variants: s.variants,
        })),
      }
    );

    return {
      pageId,
      message: `I've created your landing page "${args.businessContext.name}" with ${args.sections.length} sections. You can now view and edit it in the editor!`,
    };
  },
});

// Tool to suggest sections based on industry
const suggestSectionsTool = createTool({
  description:
    "Suggest appropriate sections for a landing page based on the business industry",
  args: z.object({
    industry: z.string().describe("The business industry (e.g., saas, restaurant, agency)"),
  }),
  handler: async (
    _ctx: ToolCtx,
    args: { industry: string }
  ): Promise<{ suggestions: string[]; explanation: string }> => {
    // Import at runtime to avoid bundling issues
    const { getSectionsForIndustry } = await import(
      "../../lib/sections/metadata"
    );

    const suggestions = getSectionsForIndustry(args.industry);

    return {
      suggestions,
      explanation: `Based on ${args.industry} industry best practices, I recommend these sections: ${suggestions.join(", ")}. Would you like me to proceed with this structure, or would you like to customize it?`,
    };
  },
});

// The generation agent with custom context type
export const generationAgent = new Agent<CustomCtx>(components.agent, {
  name: "generation",
  // languageModel: openrouter("anthropic/claude-sonnet-4"),
  languageModel: openrouter("google/gemini-2.0-flash-exp:free"),
  textEmbeddingModel: openrouter.textEmbeddingModel("openai/text-embedding-3-small"),
  instructions: GENERATION_AGENT_PROMPT,
  tools: {
    generateLandingPage: generateLandingPageTool,
    suggestSections: suggestSectionsTool,
  },
});

// Export available section types for reference
export const availableSectionTypes = Object.keys(sectionSchemas) as SectionType[];
