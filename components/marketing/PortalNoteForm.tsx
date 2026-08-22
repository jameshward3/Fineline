"use client";

import { useActionState } from "react";
import { addPortalNote } from "@/lib/actions/portal";

export function PortalNoteForm({ jobId, resetKey }: { jobId: string; resetKey: number }) {
  const [state, formAction, pending] = useActionState(addPortalNote, { error: null });

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="jobId" value={jobId} />
      <div className="flex-1">
        <label htmlFor={`note-${jobId}`} className="sr-only">
          Message about this order
        </label>
        <input
          key={resetKey}
          id={`note-${jobId}`}
          name="body"
          type="text"
          required
          maxLength={2000}
          placeholder="Ask a question or leave a note about this order…"
          className="w-full border border-fl-line bg-fl-paper px-3 py-2.5 font-sans text-sm text-fl-charcoal placeholder:text-fl-ink-faint focus:outline-none focus:border-fl-brass"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="border border-fl-charcoal px-5 py-2.5 font-sans text-xs uppercase tracking-[0.18em] text-fl-charcoal transition-colors hover:bg-fl-charcoal hover:text-fl-paper disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send"}
      </button>
      {state.error && <p className="font-sans text-xs text-red-800 sm:basis-full">{state.error}</p>}
    </form>
  );
}
