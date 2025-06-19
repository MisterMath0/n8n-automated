import { AIModel } from "@/types/api";
import { Message } from "./types";

export const welcomeMessage: Message = {
  id: '1',
  content: "Hi! Describe any automation you want to create and I'll generate a complete n8n workflow for you.",
  sender: 'ai',
  type: 'text'
};

// Map backend model names to frontend enums
export const MODEL_NAME_TO_ENUM: Record<string, AIModel> = {
  "Claude 4 Sonnet": AIModel.CLAUDE_4_SONNET,
  "Claude 4 Opus": AIModel.CLAUDE_4_OPUS,
  "GPT-4o": AIModel.GPT_4O,
  "OpenAI o3": AIModel.O3,
  "Llama 3.3 70B": AIModel.LLAMA_3_3_70B,
  "Llama 3.1 8B": AIModel.LLAMA_3_1_8B,
};