import Link from "next/link";
import { requireSession } from "@/lib/current-user";
import { getCrmDashboardData } from "@/lib/queries/crm";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_TYPE_LABELS, OPPORTUNITY_STAGE_LABELS, SAMPLE_STATUS_LABELS } from "@/lib/crm-labels";
import { formatRelativeTime } from "@/lib/utils";

export default async function CrmDashboardPage() {
  const session = await requireSession();
  const data = await getCrmDashboardData(session.user.organizationId);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-semibold text-ink">Studio Relationships</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          The studio&apos;s memory of every account, program, and standard.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Accounts" value={data.accountCount} />
        <StatCard label="Active Programs" value={data.activeProgramCount} />
        <StatCard label="Open Opportunities" value={data.openOpportunities.length} />
        <StatCard label="Samples Awaiting Response" value={data.recentSamples.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Needs Attention" subtitle="Opportunities with follow-up due soon" />
          <div className="divide-y divide-border">
            {data.upcomingFollowUps.map((o) => (
              <Link
                key={o.id}
                href={`/crm/accounts/${o.clientId}`}
                className="flex items-center justify-between py-2.5 hover:bg-surface-raised/40 -mx-2 px-2 rounded-md"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">{o.name}</p>
                  <p className="text-xs text-ink-muted">
                    {o.client.name} · {o.nextAction ?? "Follow up"}
                  </p>
                </div>
                <Badge tone="warning">{OPPORTUNITY_STAGE_LABELS[o.stage]}</Badge>
              </Link>
            ))}
            {data.upcomingFollowUps.length === 0 && (
              <p className="text-sm text-ink-faint text-center py-8">Nothing needs attention right now.</p>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Top Relationships" />
          <div className="divide-y divide-border">
            {data.topAccounts.map((a) => (
              <Link
                key={a.id}
                href={`/crm/accounts/${a.id}`}
                className="flex items-center justify-between py-2.5 hover:bg-surface-raised/40 -mx-2 px-2 rounded-md"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">{a.name}</p>
                  <p className="text-xs text-ink-muted">{ACCOUNT_TYPE_LABELS[a.accountType]}</p>
                </div>
                <span className="text-xs text-ink-faint">{a._count.jobs} orders</span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader
            title="Open Opportunities"
            action={
              <Link href="/crm/opportunities" className="text-xs text-accent hover:underline">
                View pipeline
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {data.openOpportunities.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">{o.name}</p>
                  <p className="text-xs text-ink-muted">{o.client.name}</p>
                </div>
                <Badge>{OPPORTUNITY_STAGE_LABELS[o.stage]}</Badge>
              </div>
            ))}
            {data.openOpportunities.length === 0 && (
              <p className="text-sm text-ink-faint text-center py-6">No open opportunities.</p>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Samples in the Field" subtitle="Delivered, awaiting client response" />
          <div className="divide-y divide-border">
            {data.recentSamples.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">{s.name}</p>
                  <p className="text-xs text-ink-muted">
                    {s.client.name} · {formatRelativeTime(s.createdAt)}
                  </p>
                </div>
                <Badge tone="info">{SAMPLE_STATUS_LABELS[s.status]}</Badge>
              </div>
            ))}
            {data.recentSamples.length === 0 && (
              <p className="text-sm text-ink-faint text-center py-6">No samples currently out.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Panel padded className="!p-4">
      <p className="text-2xl font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-ink-muted mt-1">{label}</p>
    </Panel>
  );
}
