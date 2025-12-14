import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { generationAgent } from "./generationAgent";
import { api, internal } from "../_generated/api";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { DIRECT_GENERATION_PROMPT } from "../../lib/sections/ai-prompt";
import { getOpenRouterModelId } from "../../lib/models";

// Set to false for real AI generation, true for testing with mock data
const MOCK_MODE = false;

// Static mock data for testing
const MOCK_SECTIONS = [
  {
    type: "hero",
    order: 0,
    content: {
      headline: "Build Something Amazing",
      subheadline: "Transform your ideas into reality with our powerful platform. Start creating beautiful experiences today.",
      cta: {
        text: "Get Started",
        url: "#",
      },
      secondaryCta: {
        text: "Learn More",
        url: "#",
      },
      layout: "centered",
    },
  },
  {
    type: "features",
    order: 1,
    content: {
      headline: "Everything You Need",
      subheadline: "Powerful features to help you build faster and smarter.",
      features: [
        {
          icon: "Rocket01Icon",
          title: "Lightning Fast",
          description: "Optimized for speed with instant page loads and smooth interactions.",
        },
        {
          icon: "PaintBrush01Icon",
          title: "Beautiful Design",
          description: "Professionally crafted templates that look great on any device.",
        },
        {
          icon: "Settings02Icon",
          title: "Easy to Customize",
          description: "Drag and drop editor makes it simple to make it your own.",
        },
        {
          icon: "Shield01Icon",
          title: "Secure & Reliable",
          description: "Enterprise-grade security with 99.9% uptime guarantee.",
        },
      ],
      layout: "grid",
    },
  },
  {
    type: "testimonials",
    order: 2,
    content: {
      headline: "Loved by Thousands",
      testimonials: [
        {
          quote: "This platform completely transformed how we build landing pages. What used to take weeks now takes hours.",
          author: "Sarah Chen",
          role: "Head of Marketing",
          company: "TechCorp",
        },
        {
          quote: "The AI-powered generation is incredible. It understood our brand perfectly and created something amazing.",
          author: "Marcus Johnson",
          role: "Founder",
          company: "StartupXYZ",
        },
        {
          quote: "Best investment we've made this year. Our conversion rates have doubled since switching.",
          author: "Emily Rodriguez",
          role: "Growth Lead",
          company: "ScaleUp Inc",
        },
      ],
      layout: "grid",
    },
  },
  {
    type: "pricing",
    order: 3,
    content: {
      headline: "Simple, Transparent Pricing",
      subheadline: "Choose the plan that works best for you.",
      tiers: [
        {
          name: "Starter",
          price: "$0/mo",
          description: "Perfect for trying things out",
          features: ["3 landing pages", "Basic templates", "Community support"],
          cta: { text: "Get Started", url: "#" },
          highlighted: false,
        },
        {
          name: "Pro",
          price: "$29/mo",
          description: "For growing businesses",
          features: ["Unlimited pages", "Premium templates", "Priority support", "Custom domains", "Analytics"],
          cta: { text: "Start Free Trial", url: "#" },
          highlighted: true,
        },
        {
          name: "Enterprise",
          price: "Custom",
          description: "For large organizations",
          features: ["Everything in Pro", "SSO & SAML", "Dedicated support", "SLA guarantee", "Custom integrations"],
          cta: { text: "Contact Sales", url: "#" },
          highlighted: false,
        },
      ],
    },
  },
  {
    type: "cta",
    order: 4,
    content: {
      headline: "Ready to Get Started?",
      subheadline: "Join thousands of businesses already using our platform to create stunning landing pages.",
      cta: {
        text: "Start Building Free",
        url: "#",
      },
      style: "gradient",
    },
  },
];

const MOCK_THEME = {
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  fontFamily: "Inter",
};

const MOCK_BUSINESS_CONTEXT = {
  name: "Test Landing Page",
  description: "A test landing page for development",
  industry: "technology",
  targetAudience: "Developers and creators",
  uniqueValue: "Fast and easy landing page creation",
};

// Start a new generation conversation
export const startGenerationThread = action({
  args: {},
  handler: async (ctx): Promise<{ threadId: string; welcomeMessage: string }> => {
    // Get the authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by email
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

    // Create a new thread for the generation agent
    const { threadId } = await generationAgent.createThread(ctx, {
      userId: user._id,
    });

    // Save the thread to our database
    await ctx.runMutation(internal.agents.threadMutations.createThread, {
      threadId,
      userId: user._id,
      purpose: "generation",
    });

    const welcomeMessage = `Hi! I'm Sublime, and I'll help you create a beautiful landing page for your business.

Let's start with the basics - what's the name of your business, and what do you do?`;

    return { threadId, welcomeMessage };
  },
});

// Send a message to the generation agent
export const sendMessage = action({
  args: {
    threadId: v.string(),
    message: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ response: string; pageId?: string; done?: boolean }> => {
    // Get the authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by email
    const user = await ctx.runQuery(api.users.getByEmail, {
      email: identity.email!,
    });
    if (!user) {
      throw new Error("User not found");
    }

    // MOCK MODE: Skip AI and create a static page immediately
    if (MOCK_MODE) {
      // Create the page with mock data
      const pageId = await ctx.runMutation(
        internal.agents.mutations.createPageWithSections,
        {
          userId: user._id,
          name: MOCK_BUSINESS_CONTEXT.name,
          businessContext: MOCK_BUSINESS_CONTEXT,
          theme: MOCK_THEME,
          sections: MOCK_SECTIONS,
        }
      );

      return {
        response: `I've created your landing page with ${MOCK_SECTIONS.length} sections! You can now view and edit it in the editor.`,
        pageId,
        done: true,
      };
    }

    // Check AI call limits
    const usageCheck = await ctx.runMutation(api.usage.checkAndIncrementAiCalls, {});
    if (!usageCheck.allowed) {
      throw new Error("AI call limit reached. Please upgrade to Pro.");
    }

    // Send message to agent and get response
    // Pass userId as custom context for tools to access
    const ctxWithUser = Object.assign({}, ctx, { userId: user._id });
    const result = await generationAgent.generateText(
      ctxWithUser,
      { threadId: args.threadId as any },
      { prompt: args.message }
    );

    // Check if a page was generated (tool was called)
    let pageId: string | undefined;
    let done = false;

    if (result.steps) {
      for (const step of result.steps) {
        if (step.toolResults) {
          for (const toolResult of step.toolResults) {
            const tr = toolResult as any;
            if (
              tr.toolName === "generateLandingPage" &&
              tr.result?.pageId
            ) {
              pageId = tr.result.pageId;
              done = true;
            }
          }
        }
      }
    }

    return {
      response: result.text || "I'm working on generating your landing page...",
      pageId,
      done,
    };
  },
});

// Get thread history
export const getThreadMessages = action({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get messages from the agent thread
    const result = await generationAgent.listMessages(ctx, {
      threadId: args.threadId as any,
      paginationOpts: { numItems: 100, cursor: null },
    });

    return result.page.map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
      createdAt: msg.createdAt,
    }));
  },
});

// Continue generation for an existing page (editing mode)
export const startEditingThread = action({
  args: {
    landingPageId: v.id("landingPages"),
  },
  handler: async (ctx, args): Promise<{ threadId: string }> => {
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

    // Verify page ownership
    const page = await ctx.runQuery(api.landingPages.get, {
      id: args.landingPageId,
    });
    if (!page) {
      throw new Error("Page not found");
    }

    // Create a new thread for editing
    const { threadId } = await generationAgent.createThread(ctx, {
      userId: user._id,
    });

    // Save thread reference
    await ctx.runMutation(internal.agents.threadMutations.createThread, {
      threadId,
      userId: user._id,
      purpose: "editing",
      landingPageId: args.landingPageId,
    });

    // Update the page with the thread ID
    await ctx.runMutation(api.landingPages.update, {
      id: args.landingPageId,
      generationThreadId: threadId as any,
    });

    return { threadId };
  },
});

// Process a comment on a section element using AI
export const processComment = action({
  args: {
    sectionId: v.id("sections"),
    comment: v.string(),
    elementInfo: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<{ response: string; updatedContent?: any }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the section
    const section = await ctx.runQuery(api.sections.get, { id: args.sectionId });
    if (!section) {
      throw new Error("Section not found");
    }

    // Create OpenRouter provider
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Get OpenRouter model ID from lib/models.ts
    const modelId = getOpenRouterModelId(args.model);

    // Build the prompt for the AI
    const prompt = `You are editing a landing page section. The user has selected an element and wants to make a change.

Section Type: ${section.type}
Current Section Content:
${JSON.stringify(section.content, null, 2)}

Selected Element: ${args.elementInfo}

User's Request: ${args.comment}

Please analyze the user's request and provide:
1. A brief explanation of what you understand they want to change
2. The updated section content that incorporates their requested change

Return your response in the following JSON format:
{
  "explanation": "Brief explanation of the change",
  "updatedContent": { /* the complete updated section content */ }
}

Important: Return ONLY valid JSON, no markdown code blocks or other text.`;

    try {
      const result = await generateText({
        model: openrouter(modelId),
        prompt,
      });

      console.log("AI Response:", result.text);

      // Parse the response
      let parsedResponse;
      try {
        // Try to extract JSON from the response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = { explanation: result.text, updatedContent: null };
        }
      } catch {
        parsedResponse = { explanation: result.text, updatedContent: null };
      }

      return {
        response: parsedResponse.explanation || result.text,
        updatedContent: parsedResponse.updatedContent,
      };
    } catch (error) {
      console.error("AI processing error:", error);
      throw new Error(`Failed to process comment: ${error}`);
    }
  },
});

// Process a page-level chat message using AI
export const processPageChat = action({
  args: {
    landingPageId: v.id("landingPages"),
    message: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<{
    response: string;
    updatedSections?: Array<{ sectionId: string; updatedContent: any }>;
    updatedTheme?: any;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the page
    const page = await ctx.runQuery(api.landingPages.get, { id: args.landingPageId });
    if (!page) {
      throw new Error("Page not found");
    }

    // Get all sections for this page
    const sections = await ctx.runQuery(api.sections.listByPage, {
      landingPageId: args.landingPageId,
    });

    // Create OpenRouter provider
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Get OpenRouter model ID from lib/models.ts
    const modelId = getOpenRouterModelId(args.model);

    // Build the prompt for the AI
    const sectionsContext = sections.map((s: any) => ({
      id: s._id,
      type: s.type,
      content: s.content,
    }));

    const prompt = `You are editing a landing page. The user wants to make changes to the page.

Page Theme:
${JSON.stringify(page.theme, null, 2)}

Page Sections:
${JSON.stringify(sectionsContext, null, 2)}

User's Request: ${args.message}

Please analyze the user's request and determine what changes need to be made to the page.
You can:
1. Modify one or more section contents
2. Modify the theme (colors, font family)
3. Both

Return your response in the following JSON format:
{
  "explanation": "Brief explanation of what you changed",
  "updatedSections": [
    { "sectionId": "id_of_section", "updatedContent": { /* new content */ } }
  ],
  "updatedTheme": { /* optional: new theme object if theme changes are needed */ }
}

Important:
- Only include updatedSections if you're changing section content
- Only include updatedTheme if you're changing the theme
- Return ONLY valid JSON, no markdown code blocks or other text.`;

    try {
      const result = await generateText({
        model: openrouter(modelId),
        prompt,
      });

      console.log("AI Page Chat Response:", result.text);

      // Parse the response
      let parsedResponse;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = { explanation: result.text };
        }
      } catch {
        parsedResponse = { explanation: result.text };
      }

      return {
        response: parsedResponse.explanation || result.text,
        updatedSections: parsedResponse.updatedSections,
        updatedTheme: parsedResponse.updatedTheme,
      };
    } catch (error) {
      console.error("AI page chat processing error:", error);
      throw new Error(`Failed to process chat: ${error}`);
    }
  },
});

// Direct single-step landing page generation from form input
export const generateLandingPageDirect = action({
  args: {
    businessName: v.string(),
    businessDescription: v.string(),
    imageUrls: v.array(v.string()),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<{ pageId: string }> => {
    // Get the authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by email
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

    // Check page creation limits
    const pageCheck = await ctx.runQuery(api.usage.canCreatePage, {});
    if (!pageCheck.canCreate) {
      throw new Error("Page limit reached. Please upgrade to Pro.");
    }

    // Create OpenRouter provider
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Get OpenRouter model ID from lib/models.ts
    const modelId = getOpenRouterModelId(args.model);

    // Build the user prompt with business info
    const userPrompt = `Generate a landing page for this business:

**Business Name:** ${args.businessName}

**Business Description:**
${args.businessDescription}

${args.imageUrls.length > 0 ? `**Available Images:**
${args.imageUrls.map((url, i) => `${i + 1}. ${url}`).join("\n")}

Use these images in the generated sections as described in the instructions.` : "No images provided."}

Generate a complete, beautiful landing page with appropriate sections for this business.`;

    try {
      console.log("Starting AI generation with model:", modelId);

      const result = await generateText({
        model: openrouter(modelId),
        system: DIRECT_GENERATION_PROMPT,
        prompt: userPrompt,
      });

      console.log("AI Direct Generation Response length:", result.text?.length || 0);

      // Parse the response
      let parsedResponse;
      try {
        // Try to extract JSON from the response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          console.error("No JSON found in response:", result.text?.substring(0, 500));
          throw new Error("No valid JSON found in AI response");
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.error("Raw response:", result.text?.substring(0, 1000));
        throw new Error("Failed to parse AI response. Please try again.");
      }

      // Validate the response structure
      if (!parsedResponse.businessContext || !parsedResponse.theme || !parsedResponse.sections) {
        console.error("Invalid response structure:", JSON.stringify(parsedResponse).substring(0, 500));
        throw new Error("Invalid AI response structure. Please try again.");
      }

      // Validate and fix sections
      const sectionsWithOrder = parsedResponse.sections.map((section: any, index: number) => {
        // Ensure each section has required fields
        const content = section.content || {};

        // Add default CTA for hero sections if missing
        if (section.type === "hero" && !content.cta) {
          content.cta = { text: "Get Started", url: "#" };
        }

        return {
          type: section.type,
          order: index,
          content,
        };
      });

      // Validate theme has required fields
      const theme = {
        primaryColor: parsedResponse.theme.primaryColor || "#6366f1",
        secondaryColor: parsedResponse.theme.secondaryColor || "#8b5cf6",
        accentColor: parsedResponse.theme.accentColor || "#f59e0b",
        backgroundColor: parsedResponse.theme.backgroundColor || "#ffffff",
        textColor: parsedResponse.theme.textColor || "#1f2937",
        fontFamily: parsedResponse.theme.fontFamily || "Inter",
      };

      // Create the page with sections
      const pageId = await ctx.runMutation(
        internal.agents.mutations.createPageWithSections,
        {
          userId: user._id,
          name: parsedResponse.businessContext.name || args.businessName,
          businessContext: {
            name: parsedResponse.businessContext.name || args.businessName,
            description: parsedResponse.businessContext.description || args.businessDescription,
            industry: parsedResponse.businessContext.industry || "other",
            targetAudience: parsedResponse.businessContext.targetAudience || "General audience",
            uniqueValue: parsedResponse.businessContext.uniqueValue || "Quality service",
          },
          theme,
          sections: sectionsWithOrder,
        }
      );

      return { pageId };
    } catch (error: any) {
      console.error("AI direct generation error:", error);

      // Provide more specific error messages
      if (error.message?.includes("rate limit")) {
        throw new Error("AI service is busy. Please try again in a moment.");
      }
      if (error.message?.includes("API key")) {
        throw new Error("AI service configuration error. Please contact support.");
      }
      if (error.message?.includes("RetryError")) {
        throw new Error("AI service temporarily unavailable. Please try again.");
      }

      throw new Error(`Failed to generate landing page: ${error.message || "Unknown error"}`);
    }
  },
});
