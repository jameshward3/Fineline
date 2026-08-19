"use client";

import { useEffect, useState } from "react";
import { CloudCheck } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export function AutosaveIndicator({ lastSavedAt }: { lastSavedAt: Date | null }) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  if (!lastSavedAt) return null;

  return (
    <p className="flex items-center gap-1.5 text-[11px] text-ink-faint px-1">
      <CloudCheck size={12} />
      Saved {formatRelativeTime(lastSavedAt)}
    </p>
  );
}
