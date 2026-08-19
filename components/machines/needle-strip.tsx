import { cn } from "@/lib/utils";

export interface NeedleStripItem {
  needleNumber: number;
  threadHex?: string | null;
  threadLabel?: string | null;
}

export function NeedleStrip({ needles, dense = false }: { needles: NeedleStripItem[]; dense?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {needles.map((n) => (
        <div
          key={n.needleNumber}
          title={n.threadLabel ?? "Empty"}
          className={cn(
            "flex flex-col items-center justify-center rounded-md border border-border-strong text-center",
            dense ? "w-9 h-9" : "w-12 h-12"
          )}
          style={{
            background: n.threadHex ?? "transparent",
          }}
        >
          <span
            className={cn(
              "text-[10px] font-mono font-semibold px-1 rounded",
              n.threadHex ? "bg-black/40 text-white" : "text-ink-faint"
            )}
          >
            {String(n.needleNumber).padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
}
