import { AIModel } from "@/types/api";
// Welcome message removed - now served from backend via messagesAPI

// Default model (Gemini 2.5 Flash)
export const DEFAULT_MODEL = AIModel.GEMINI_2_5__FLASH_FAST;

// Local storage key for selected model
export const SELECTED_MODEL_KEY = 'n8n_selected_model';

// Map model IDs to display names
export const MODEL_ENUM_TO_NAME: Record<AIModel, string> = {
  // Gemini Models (Free Tier)
  [AIModel.GEMINI_2_5_FLASH]: "Gemini 2.5 Flash (Reasoning)",
  [AIModel.GEMINI_2_5__FLASH_FAST]: "Gemini 2.5 Flash (Fast)",
  [AIModel.GEMINI_1_5_PRO]: "Gemini 1.5 Pro",
  // Anthropic Models
  [AIModel.CLAUDE_4_SONNET]: "Claude 4 Sonnet",
  [AIModel.CLAUDE_4_OPUS]: "Claude 4 Opus",
  // OpenAI/Groq Models
  [AIModel.GPT_4_1]: "GPT-4.1",
  [AIModel.GPT_4_1_MINI]: "GPT-4.1 Mini",
  [AIModel.GPT_4_1_NANO]: "GPT-4.1 Nano",
  // Llama Models
  //[AIModel.LLAMA_3_3_70B]: "Llama 3.3 70B",
  //[AIModel.LLAMA_3_1_8B]: "Llama 3.1 8B",
};

// Map model names to enums (reverse mapping)
export const MODEL_NAME_TO_ENUM = Object.fromEntries(
  Object.entries(MODEL_ENUM_TO_NAME).map(([enumValue, name]) => [name, enumValue])
) as Record<string, AIModel>;