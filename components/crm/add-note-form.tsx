"use client";

import { useRef, useTransition } from "react";
import { addAccountNote } from "@/lib/actions/crm";

export function AddNoteForm({ clientId }: { clientId: string }) {
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <form
      action={() => {
        const body = ref.current?.value.trim();
        if (!body) return;
        startTransition(async () => {
          await addAccountNote(clientId, body);
          if (ref.current) ref.current.value = "";
        });
      }}
      className="flex gap-2"
    >
      <textarea
        ref={ref}
        rows={2}
        placeholder="Log a call, email, or note…"
        className="flex-1 rounded-md bg-surface-inset border border-border px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/50"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs px-3 py-1.5 rounded-md bg-accent text-accent-foreground font-medium disabled:opacity-50 self-start"
      >
        {pending ? "Saving…" : "Log"}
      </button>
    </form>
  );
}
