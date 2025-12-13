import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { generationAgent } from "./generationAgent";
import { api, internal } from "../_generated/api";

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
