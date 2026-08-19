import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-lg shadow-panel",
        padded && "p-4 md:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
