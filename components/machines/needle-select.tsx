"use client";

import { useTransition } from "react";
import { setMachineNeedle } from "@/lib/actions/threads";

interface ThreadOption {
  id: string;
  hex: string;
  companyName: string;
}

export function NeedleSelect({
  machineId,
  needleNumber,
  currentThreadId,
  threads,
}: {
  machineId: string;
  needleNumber: number;
  currentThreadId: string | null;
  threads: ThreadOption[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={currentThreadId ?? ""}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value || null;
        startTransition(() => {
          setMachineNeedle(machineId, needleNumber, value);
        });
      }}
      className="w-full text-xs bg-surface-inset border border-border rounded-md px-2 py-1.5 text-ink disabled:opacity-50"
    >
      <option value="">Empty</option>
      {threads.map((t) => (
        <option key={t.id} value={t.id}>
          {t.companyName}
        </option>
      ))}
    </select>
  );
}
