"use client";

import { useTransition } from "react";
import { updateJobStatus } from "@/lib/actions/jobs";
import { JOB_STATUS_META, JOB_STATUS_ORDER } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/app/generated/prisma/enums";

export function StatusStepper({ jobId, status }: { jobId: string; status: JobStatus }) {
  const [pending, startTransition] = useTransition();
  const currentIndex = JOB_STATUS_ORDER.indexOf(status);

  return (
    <div className="flex flex-wrap gap-1.5">
      {JOB_STATUS_ORDER.map((s, i) => {
        const meta = JOB_STATUS_META[s];
        const active = s === status;
        const done = i < currentIndex;
        return (
          <button
            key={s}
            disabled={pending}
            onClick={() => startTransition(() => updateJobStatus(jobId, s))}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50",
              active && "bg-accent text-accent-foreground border-accent font-medium",
              !active && done && "border-status-success/40 text-status-success",
              !active && !done && "border-border text-ink-muted hover:text-ink"
            )}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
