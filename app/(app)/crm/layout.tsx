import Link from "next/link";

const TABS = [
  { label: "Studio Home", href: "/crm" },
  { label: "Accounts", href: "/crm/accounts" },
  { label: "Programs", href: "/crm/programs" },
  { label: "Opportunities", href: "/crm/opportunities" },
];

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex gap-1 border-b border-border -mt-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="text-sm px-3 py-2 text-ink-muted hover:text-ink border-b-2 border-transparent hover:border-border-strong transition-colors"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
