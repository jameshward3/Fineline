"use client";

import { useActionState, useState } from "react";
import { recordProductionRun } from "@/lib/actions/products";
import { Field, Select, Input, SubmitButton } from "@/components/ui/form";

const ISSUES = [
  "puckering",
  "thread breaks",
  "registration",
  "gaps",
  "excessive density",
  "poor lettering",
  "loose fill",
  "distortion",
  "poor color",
  "hooping problem",
  "other",
];

export function RecordRunForm({
  setupId,
  designVersions,
}: {
  setupId: string;
  designVersions: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState(recordProductionRun, { error: null });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-accent hover:underline">
        + Record test sew / production result
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 bg-surface-inset border border-border rounded-md p-4">
      <input type="hidden" name="setupId" value={setupId} />
      <input type="hidden" name="issues" value={issues.join(",")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Design Version" required>
          <Select name="designVersionId" required defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            {designVersions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Result" required>
          <Select name="result" required defaultValue="EXCELLENT">
            <option value="EXCELLENT">Excellent</option>
            <option value="ACCEPTABLE">Acceptable</option>
            <option value="NEEDS_REVISION">Needs Revision</option>
            <option value="FAILED">Failed</option>
          </Select>
        </Field>
      </div>

      <div>
        <span className="block text-[11px] text-ink-muted mb-1.5">Issues observed</span>
        <div className="flex flex-wrap gap-1.5">
          {ISSUES.map((issue) => {
            const active = issues.includes(issue);
            return (
              <button
                type="button"
                key={issue}
                onClick={() =>
                  setIssues((prev) =>
                    prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
                  )
                }
                className={`text-[11px] px-2 py-1 rounded-full border ${
                  active
                    ? "bg-status-danger/10 border-status-danger/40 text-status-danger"
                    : "border-border text-ink-muted hover:text-ink"
                }`}
              >
                {issue}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Notes">
        <Input name="notes" placeholder="Clean registration, no puckering." />
      </Field>

      {state.error && <p className="text-xs text-status-danger">{state.error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs px-3 py-1.5 rounded-md border border-border text-ink-muted hover:text-ink"
        >
          Cancel
        </button>
        <SubmitButton pending={pending} className="!text-xs !py-1.5 !px-3">
          Save Result
        </SubmitButton>
      </div>
    </form>
  );
}
