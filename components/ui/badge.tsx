import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-raised text-ink-muted border-border-strong",
  success: "bg-status-success/10 text-status-success border-status-success/30",
  warning: "bg-status-warning/10 text-status-warning border-status-warning/30",
  danger: "bg-status-danger/10 text-status-danger border-status-danger/30",
  info: "bg-status-info/10 text-status-info border-status-info/30",
  accent: "bg-accent/10 text-accent border-accent/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
