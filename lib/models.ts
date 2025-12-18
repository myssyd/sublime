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
  // // Google
  // { id: "gemma", name: "Gemma 3 27B", provider: "Google", isFree: true, description: "Open weights" },
  // { id: "gemini", name: "Gemini 2.0 Flash", provider: "Google", isFree: true, description: "Fast & capable" },
  // { id: "gemma-12b", name: "Gemma 3 12B", provider: "Google", isFree: true, description: "Compact & efficient" },

  // Meta
  { id: "llama-4-maverick", name: "Llama 3.3 70B Instruct", provider: "Meta", isFree: true, description: "Large & powerful" },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "Meta", isFree: true, description: "Large & powerful" },

  // DeepSeek
  { id: "deepseek-r1t2-chimera", name: "DeepSeek R1T2 Chimera", provider: "DeepSeek", isFree: true, description: "Enhanced reasoning" },
  { id: "deepseek-r1t-chimera", name: "DeepSeek R1T Chimera", provider: "DeepSeek", isFree: true, description: "Reasoning hybrid" },
  { id: "deepseek-v3.1-nex", name: "DeepSeek V3.1 Nex N1", provider: "DeepSeek", isFree: true, description: "Next-gen model" },

  // Qwen
  { id: "qwen", name: "Qwen3 Coder", provider: "Qwen", isFree: true, description: "Code focused" },
  { id: "qwen3-235b", name: "Qwen3 235B", provider: "Qwen", isFree: true, description: "Large & powerful" },
  { id: "qwen3-4b", name: "Qwen3 4B", provider: "Qwen", isFree: true, description: "Compact & fast" },

  // Mistral
  { id: "devstral", name: "Devstral", provider: "Mistral", isFree: true, description: "Developer focused" },
  { id: "mistral-small", name: "Mistral Small 3.1", provider: "Mistral", isFree: true, description: "Efficient & fast" },

  // Nvidia
  { id: "nemotron-nano", name: "Nemotron 3 Nano 30B", provider: "Nvidia", isFree: true, description: "Compact powerhouse" },

  // Paid models
  { id: "claude", name: "Claude 3.5 Sonnet", provider: "Anthropic", isFree: false, description: "Balanced" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", isFree: false, description: "High quality" },
];

// Map UI model IDs to OpenRouter model IDs
export const MODEL_ID_MAP: Record<string, string> = {
  // // Google
  // "gemma": "google/gemma-3-27b-it:free",
  // "gemini": "google/gemini-2.0-flash-exp:free",
  // "gemma-12b": "google/gemma-3-12b-it:free",

  // Meta
  "llama-4-maverick": "meta-llama/llama-3.3-70b-instruct:free",
  "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct:free",

  // DeepSeek
  "deepseek-r1t2-chimera": "tngtech/deepseek-r1t2-chimera:free",
  "deepseek-r1t-chimera": "tngtech/deepseek-r1t-chimera:free",
  "deepseek-v3.1-nex": "nex-agi/deepseek-v3.1-nex-n1:free",

  // Qwen
  "qwen": "qwen/qwen3-coder:free",
  "qwen3-235b": "qwen/qwen3-235b-a22b:free",
  "qwen3-4b": "qwen/qwen3-4b:free",

  // Mistral
  "devstral": "mistralai/devstral-2512:free",
  "mistral-small": "mistralai/mistral-small-3.1-24b-instruct:free",

  // Nvidia
  "nemotron-nano": "nvidia/nemotron-3-nano-30b-a3b:free",

  // Paid
  "claude": "anthropic/claude-3.5-sonnet",
  "gpt-4o": "openai/gpt-4o",
  "gpt-4": "openai/gpt-4",
};

// Default model ID (first model in the list)
export const DEFAULT_MODEL = AI_MODELS[0]?.id ?? "llama-4-maverick";
export const DEFAULT_OPENROUTER_MODEL = MODEL_ID_MAP[DEFAULT_MODEL];

// Get OpenRouter model ID from UI model ID
export function getOpenRouterModelId(modelId: string): string {
  return MODEL_ID_MAP[modelId] || DEFAULT_OPENROUTER_MODEL;
}
