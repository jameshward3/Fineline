import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireSession } from "@/lib/current-user";
import { getAccounts } from "@/lib/queries/crm";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_TYPE_LABELS } from "@/lib/crm-labels";
import { formatRelativeTime } from "@/lib/utils";

export default async function AccountsPage() {
  const session = await requireSession();
  const accounts = await getAccounts(session.user.organizationId);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Accounts</h1>
          <p className="text-sm text-ink-muted mt-0.5">Every client relationship the studio maintains.</p>
        </div>
        <Link
          href="/crm/accounts/new"
          className="flex items-center gap-1.5 rounded-md bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-medium px-3 py-2"
        >
          <PlusCircle size={14} />
          New Account
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map((a) => (
          <Link key={a.id} href={`/crm/accounts/${a.id}`}>
            <Panel className="h-full hover:border-border-strong transition-colors">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-medium text-ink">{a.name}</p>
                <Badge tone={a.active ? "success" : "neutral"}>{a.active ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-xs text-ink-muted mb-3">{ACCOUNT_TYPE_LABELS[a.accountType]}</p>
              <div className="flex items-center gap-3 text-xs text-ink-faint">
                <span>{a._count.jobs} orders</span>
                <span>{a.programs.length} active program{a.programs.length === 1 ? "" : "s"}</span>
              </div>
              {a.programs[0] && <p className="text-xs text-ink-muted mt-2">Primary: {a.programs[0].name}</p>}
              {a.jobs[0] && (
                <p className="text-[11px] text-ink-faint mt-2">Last order {formatRelativeTime(a.jobs[0].updatedAt)}</p>
              )}
            </Panel>
          </Link>
        ))}
        {accounts.length === 0 && (
          <Panel className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-ink-faint text-center py-8">No accounts yet.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
