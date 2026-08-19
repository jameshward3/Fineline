import Link from "next/link";
import { requireSession } from "@/lib/current-user";
import { getPrograms } from "@/lib/queries/crm";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { PROGRAM_STATUS_LABELS } from "@/lib/crm-labels";

export default async function ProgramsPage() {
  const session = await requireSession();
  const programs = await getPrograms(session.user.organizationId);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Programs</h1>
          <p className="text-sm text-ink-muted mt-0.5">Approved, repeatable embroidery relationships across accounts.</p>
        </div>
        <Link href="/crm/programs/new" className="text-xs px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium">
          New Program
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {programs.map((p) => (
          <Link key={p.id} href={`/crm/programs/${p.id}`}>
            <Panel className="h-full hover:border-border-strong transition-colors">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-medium text-ink">{p.name}</p>
                <Badge tone={p.status === "ACTIVE" ? "success" : "neutral"}>{PROGRAM_STATUS_LABELS[p.status]}</Badge>
              </div>
              <p className="text-xs text-ink-muted">{p.client.name}</p>
              <p className="text-xs text-ink-faint mt-2">
                {p._count.approvedItems} approved item{p._count.approvedItems === 1 ? "" : "s"}
              </p>
            </Panel>
          </Link>
        ))}
        {programs.length === 0 && (
          <Panel className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-ink-faint text-center py-8">No programs yet.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
