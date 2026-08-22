"use client";

import { useActionState } from "react";
import { addJobNote } from "@/lib/actions/jobs";

export function JobNoteForm({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(addJobNote, { error: null });

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="jobId" value={jobId} />
      <textarea
        name="body"
        required
        rows={2}
        maxLength={2000}
        placeholder="Add a note…"
        className="w-full rounded-md bg-surface-inset border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs text-ink-muted">
          <input type="checkbox" name="visibleToClient" className="accent-accent" />
          Share with client in their portal
        </label>
        <button
          type="submit"
          disabled={pending}
          className="text-xs px-3 py-1.5 rounded-md bg-accent text-accent-foreground font-medium disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post Note"}
        </button>
      </div>
      {state.error && <p className="text-xs text-status-danger">{state.error}</p>}
    </form>
  );
}
