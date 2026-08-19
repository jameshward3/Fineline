"use client";

import { useTransition } from "react";
import { setPaletteSlot } from "@/lib/actions/threads";
import type { ThreadChipData } from "./thread-chip";

interface ThreadOption extends ThreadChipData {
  id: string;
}

export function PaletteSlotSelect({
  paletteId,
  slotNumber,
  currentThreadId,
  threads,
}: {
  paletteId: string;
  slotNumber: number;
  currentThreadId: string | null;
  threads: ThreadOption[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={currentThreadId ?? ""}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value;
        if (!value) return;
        startTransition(() => {
          setPaletteSlot(paletteId, slotNumber, value);
        });
      }}
      className="text-[11px] bg-transparent border-none text-ink-muted focus:outline-none disabled:opacity-50 max-w-[110px]"
    >
      {!currentThreadId && <option value="">Unassigned</option>}
      {threads.map((t) => (
        <option key={t.id} value={t.id} className="bg-surface text-ink">
          {t.companyName}
        </option>
      ))}
    </select>
  );
}
