import { RuleBasedAiAssistant } from "./rule-based";
import type { AiAssistantService } from "./types";

export type { AiAssistantService, AssistantContext, AssistantSuggestion } from "./types";

let instance: AiAssistantService | undefined;

export function getAiAssistantService(): AiAssistantService {
  if (!instance) instance = new RuleBasedAiAssistant();
  return instance;
}
