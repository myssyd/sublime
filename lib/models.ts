// Shared AI model configuration for frontend and backend
// See https://openrouter.ai/models for available models

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
  description?: string;
}

// Free models from OpenRouter - https://openrouter.ai/models?max_price=0
export const AI_MODELS: AIModel[] = [
  // Google
  { id: "gemini", name: "Gemini 2.0 Flash", provider: "Google", isFree: true, description: "Fast & capable" },
  { id: "gemini-thinking", name: "Gemini 2.0 Flash Thinking", provider: "Google", isFree: true, description: "Reasoning model" },
  { id: "gemma", name: "Gemma 3 27B", provider: "Google", isFree: true, description: "Open weights" },

  // Meta
  { id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", isFree: true, description: "Latest Llama" },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "Meta", isFree: true, description: "Large & powerful" },

  // DeepSeek
  { id: "deepseek-chat", name: "DeepSeek Chat V3", provider: "DeepSeek", isFree: true, description: "Strong all-rounder" },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", isFree: true, description: "Reasoning model" },

  // Qwen
  { id: "qwen", name: "Qwen3 Coder", provider: "Qwen", isFree: true, description: "Code focused" },
  { id: "qwq", name: "QwQ 32B", provider: "Qwen", isFree: true, description: "Reasoning model" },

  // Mistral
  { id: "devstral", name: "Devstral", provider: "Mistral", isFree: true, description: "Developer focused" },
  { id: "mistral-small", name: "Mistral Small 3.1", provider: "Mistral", isFree: true, description: "Efficient & fast" },

  // Paid models
  { id: "claude", name: "Claude 3.5 Sonnet", provider: "Anthropic", isFree: false, description: "Balanced" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", isFree: false, description: "High quality" },
];

// Map UI model IDs to OpenRouter model IDs
export const MODEL_ID_MAP: Record<string, string> = {
  // Google
  "gemini": "google/gemini-2.0-flash-exp:free",
  "gemini-thinking": "google/gemini-2.0-flash-thinking-exp:free",
  "gemma": "google/gemma-3-27b-it:free",

  // Meta
  "llama-4-maverick": "meta-llama/llama-4-maverick:free",
  "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct:free",

  // DeepSeek
  "deepseek-chat": "deepseek/deepseek-chat-v3-0324:free",
  "deepseek-r1": "deepseek/deepseek-r1:free",

  // Qwen
  "qwen": "qwen/qwen3-coder:free",
  "qwq": "qwen/qwq-32b:free",

  // Mistral
  "devstral": "mistralai/devstral-2512:free",
  "mistral-small": "mistralai/mistral-small-3.1-24b-instruct:free",

  // Paid
  "claude": "anthropic/claude-3.5-sonnet",
  "gpt-4o": "openai/gpt-4o",
  "gpt-4": "openai/gpt-4",
};

// Default model ID
export const DEFAULT_MODEL = "gemini";
export const DEFAULT_OPENROUTER_MODEL = MODEL_ID_MAP[DEFAULT_MODEL];

// Get OpenRouter model ID from UI model ID
export function getOpenRouterModelId(modelId: string): string {
  return MODEL_ID_MAP[modelId] || DEFAULT_OPENROUTER_MODEL;
}
