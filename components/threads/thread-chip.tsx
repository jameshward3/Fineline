import { cn } from "@/lib/utils";

export interface ThreadChipData {
  hex: string;
  companyName: string;
  manufacturerName: string;
  manufacturerCode: string;
  slotNumber?: number | null;
  active?: boolean;
}

/**
 * Professional thread color chip. Always shows manufacturer + color number
 * prominently — screen color is only an approximation of physical thread,
 * so the number is the source of truth.
 */
export function ThreadChip({
  thread,
  size = "md",
}: {
  thread: ThreadChipData;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      title={`${thread.companyName} — ${thread.manufacturerName} ${thread.manufacturerCode} (${thread.hex})`}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md border border-border bg-surface pr-3 transition-colors hover:border-border-strong",
        size === "sm" && "py-1 pl-1",
        size === "md" && "py-1.5 pl-1.5",
        size === "lg" && "py-2 pl-2",
        thread.active === false && "opacity-45"
      )}
    >
      <div
        className={cn(
          "flex-none rounded border border-black/20 flex items-end justify-center overflow-hidden",
          size === "sm" && "w-7 h-7",
          size === "md" && "w-9 h-9",
          size === "lg" && "w-11 h-11"
        )}
        style={{ background: thread.hex }}
      >
        {thread.slotNumber != null && (
          <span className="text-[9px] font-mono font-bold bg-black/40 text-white w-full text-center leading-tight">
            {String(thread.slotNumber).padStart(2, "0")}
          </span>
        )}
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-xs font-medium text-ink truncate">{thread.companyName}</p>
        <p className="text-[11px] text-ink-muted truncate font-mono">
          {thread.manufacturerName} {thread.manufacturerCode}
        </p>
      </div>
    </div>
  );
}
