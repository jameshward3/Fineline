"use client";

import { useState } from "react";
import { Sparkles, X, Check, XCircle, Eye } from "lucide-react";
import { getAiAssistantService } from "@/lib/services/ai-assistant";
import type { AssistantSuggestion } from "@/lib/services/ai-assistant/types";
import type { WizardState } from "./types";
import type { ThreadColorOption, MachineOption } from "./reference-types";

const EXAMPLE_PROMPTS = [
  'Prepare this for a 3.5-inch polo chest logo.',
  "Reduce this image to eight stocked colors.",
  "Remove details unlikely to embroider cleanly.",
  "Use only colors currently loaded on Machine 01.",
];

interface ChatEntry {
  id: string;
  prompt: string;
  suggestion: AssistantSuggestion | null;
  status: "pending" | "accepted" | "rejected";
  comparing: boolean;
}

export function AiAssistantPanel({
  state,
  patch,
  threadColors,
  machines,
}: {
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
  threadColors: ThreadColorOption[];
  machines: MachineOption[];
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<ChatEntry[]>([]);

  function submit(prompt: string) {
    if (!prompt.trim()) return;
    const service = getAiAssistantService();
    const suggestion = service.interpret(prompt, { state, threadColors, machines });
    setEntries((prev) => [
      ...prev,
      { id: `${Date.now()}`, prompt, suggestion, status: "pending", comparing: false },
    ]);
    setInput("");
  }

  function accept(id: string) {
    const entry = entries.find((e) => e.id === id);
    if (!entry?.suggestion) return;
    patch(entry.suggestion.apply());
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: "accepted" } : e)));
  }

  function reject(id: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: "rejected" } : e)));
  }

  function toggleCompare(id: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, comparing: !e.comparing } : e)));
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-accent text-accent-foreground text-sm font-medium px-4 py-2.5 shadow-lg"
      >
        <Sparkles size={15} />
        Studio Assistant
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[380px] max-h-[70vh] flex flex-col rounded-lg border border-border bg-surface shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-ink flex items-center gap-1.5">
          <Sparkles size={14} className="text-accent" />
          Studio Assistant
        </p>
        <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <p className="text-xs text-ink-faint">
          Suggests production changes — nothing is applied until you accept it.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => submit(p)}
              className="text-[11px] px-2 py-1 rounded-full border border-border text-ink-muted hover:text-ink hover:border-border-strong"
            >
              {p}
            </button>
          ))}
        </div>

        {entries.map((entry) => (
          <div key={entry.id} className="space-y-1.5">
            <p className="text-xs text-ink-muted bg-surface-inset rounded-md px-2.5 py-1.5">{entry.prompt}</p>
            {entry.suggestion ? (
              <div className="rounded-md border border-accent/30 bg-accent/5 p-2.5">
                <p className="text-xs text-ink font-medium mb-1">Suggested Change</p>
                <p className="text-xs text-ink-muted mb-2">{entry.suggestion.summary}</p>
                {entry.comparing && (
                  <ul className="text-[11px] text-ink-faint list-disc list-inside mb-2 space-y-0.5">
                    {entry.suggestion.changeDescriptions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
                {entry.status === "pending" ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => accept(entry.id)}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-accent text-accent-foreground font-medium"
                    >
                      <Check size={11} />
                      Accept
                    </button>
                    <button
                      onClick={() => reject(entry.id)}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-border text-ink-muted"
                    >
                      <XCircle size={11} />
                      Reject
                    </button>
                    <button
                      onClick={() => toggleCompare(entry.id)}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-border text-ink-muted"
                    >
                      <Eye size={11} />
                      Compare
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-ink-faint italic">
                    {entry.status === "accepted" ? "Applied." : "Dismissed."}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-ink-faint italic px-2.5">
                I can help with sizing, color reduction, cleanup, thread mapping, and matching colors already
                loaded on a machine — try one of the prompts above.
              </p>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex gap-2 p-3 border-t border-border"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the studio assistant…"
          className="flex-1 text-xs rounded-md bg-surface-inset border border-border px-2.5 py-1.5 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <button type="submit" className="text-xs px-3 py-1.5 rounded-md bg-accent text-accent-foreground font-medium">
          Send
        </button>
      </form>
    </div>
  );
}
