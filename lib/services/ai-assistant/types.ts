import type { WizardState } from "@/components/wizard/types";

export interface AssistantSuggestion {
  summary: string;
  changeDescriptions: string[];
  /** Computes the actual state patch. Only ever invoked after explicit human
   * Accept — the assistant never mutates wizard state on its own. */
  apply: () => Partial<WizardState>;
}

export interface AssistantContext {
  state: WizardState;
  threadColors: { id: string; hex: string; companyName: string; manufacturerName: string; manufacturerCode: string }[];
  machines: { id: string; name: string; needles: { needleNumber: number; threadColorId: string | null; hex: string | null; companyName: string | null }[] }[];
}

export interface AiAssistantService {
  interpret(prompt: string, context: AssistantContext): AssistantSuggestion | null;
}
