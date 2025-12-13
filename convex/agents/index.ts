// Export agent actions for use from the frontend
export {
  startGenerationThread,
  sendMessage,
  getThreadMessages,
  startEditingThread,
} from "./actions";

// Export agent definitions
export { generationAgent, availableSectionTypes } from "./generationAgent";

// Re-export internal mutations (they're accessed via internal.agents.mutations)
// These are not directly callable from the frontend
