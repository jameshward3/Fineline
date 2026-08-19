import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-[11px] text-ink-muted mb-1">
        {label}
        {required && <span className="text-status-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}

const fieldClass =
  "w-full rounded-md bg-surface-inset border border-border px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldClass, props.className)} />;
}

export function SubmitButton({
  children,
  pending,
  className,
}: {
  children: React.ReactNode;
  pending?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "rounded-md bg-accent hover:bg-accent/90 disabled:opacity-60 text-accent-foreground text-sm font-medium px-4 py-2 transition-colors",
        className
      )}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
