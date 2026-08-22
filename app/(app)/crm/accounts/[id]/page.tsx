import { notFound } from "next/navigation";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { getAccount, getAccountNotes } from "@/lib/queries/crm";
import { prisma } from "@/lib/prisma";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import {
  ACCOUNT_TYPE_LABELS,
  CONTACT_ROLE_LABELS,
  OPPORTUNITY_STAGE_LABELS,
  SAMPLE_STATUS_LABELS,
  PROGRAM_STATUS_LABELS,
} from "@/lib/crm-labels";
import { formatRelativeTime } from "@/lib/utils";
import { AddContactForm } from "@/components/crm/add-contact-form";
import { AddSampleForm } from "@/components/crm/add-sample-form";
import { AddMonogramForm } from "@/components/crm/add-monogram-form";
import { AddNoteForm } from "@/components/crm/add-note-form";
import { buildStudioInsights } from "@/lib/services/crm-insights";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [account, notes] = await Promise.all([getAccount(id), getAccountNotes(id)]);
  if (!account) notFound();

  const threadColors = await prisma.threadColor.findMany({
    where: { organizationId: account.organizationId, active: true },
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });

  const insights = buildStudioInsights(account);

  const timeline = [
    ...notes.map((n) => ({ date: n.createdAt, label: `${n.author?.name ?? "Fine Line Studio"}: ${n.body}` })),
    ...account.jobs.map((j) => ({ date: j.createdAt, label: `Job ${j.jobNumber} created` })),
    ...account.samples.map((s) => ({ date: s.createdAt, label: `Sample "${s.name}" ${SAMPLE_STATUS_LABELS[s.status].toLowerCase()}` })),
    ...account.opportunities.map((o) => ({ date: o.createdAt, label: `Opportunity "${o.name}" opened` })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const outstandingApprovals = account.samples.filter((s) => s.status === "DELIVERED").length;
  const openOpportunityCount = account.opportunities.filter((o) => o.stage !== "ORDER").length;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-ink">{account.name}</h1>
            <Badge>{ACCOUNT_TYPE_LABELS[account.accountType]}</Badge>
            <Badge tone={account.active ? "success" : "neutral"}>{account.active ? "Active Client" : "Inactive"}</Badge>
          </div>
          <p className="text-sm text-ink-muted mt-0.5">
            Client since {account.createdAt.getFullYear()}
            {account.relationshipOwner ? ` · Owned by ${account.relationshipOwner.name}` : ""}
          </p>
        </div>
        <Link
          href={`/jobs/new?clientId=${account.id}`}
          className="text-xs px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium"
        >
          New Order
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Orders" value={account.jobs.length} />
        <StatCard label="Active Programs" value={account.programs.filter((p) => p.status === "ACTIVE").length} />
        <StatCard label="Open Opportunities" value={openOpportunityCount} />
        <StatCard label="Samples Awaiting Approval" value={outstandingApprovals} />
      </div>

      {insights.length > 0 && (
        <Panel className="border-accent/30 bg-accent/5">
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-2 text-sm text-ink">
                <Lightbulb size={15} className="text-accent flex-none mt-0.5" />
                <p>
                  <span className="font-medium text-accent">Studio Insight — </span>
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel>
          <PanelHeader title="Relationship" action={<AddContactForm clientId={account.id} />} />
          <div className="space-y-2">
            {account.contacts.map((c) => (
              <div key={c.id} className="rounded-md border border-border bg-surface-inset p-2.5 text-xs">
                <p className="text-ink font-medium">{c.name}</p>
                <p className="text-ink-muted">
                  {c.title || CONTACT_ROLE_LABELS[c.role]}
                  {c.title ? ` · ${CONTACT_ROLE_LABELS[c.role]}` : ""}
                </p>
                {c.email && <p className="text-ink-faint">{c.email}</p>}
              </div>
            ))}
            {account.contacts.length === 0 && <p className="text-xs text-ink-faint py-4 text-center">No contacts yet.</p>}
          </div>
          {account.leadSource && (
            <p className="text-xs text-ink-faint mt-3">
              Lead source: {account.leadSource}
              {account.referralSource ? ` (${account.referralSource})` : ""}
            </p>
          )}
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Programs"
            subtitle="Approved products, artwork, and thread palette for repeatable orders"
            action={
              <Link href={`/crm/programs/new?clientId=${account.id}`} className="text-xs text-accent hover:underline">
                + New program
              </Link>
            }
          />
          <div className="space-y-2">
            {account.programs.map((p) => (
              <Link
                key={p.id}
                href={`/crm/programs/${p.id}`}
                className="block rounded-md border border-border bg-surface-inset p-3 hover:border-border-strong"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink font-medium">{p.name}</p>
                  <Badge tone={p.status === "ACTIVE" ? "success" : "neutral"}>{PROGRAM_STATUS_LABELS[p.status]}</Badge>
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  {p.approvedItems.length} approved item{p.approvedItems.length === 1 ? "" : "s"} ·{" "}
                  {p.threadPalette.length} thread color{p.threadPalette.length === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
            {account.programs.length === 0 && <p className="text-sm text-ink-faint py-6 text-center">No programs yet.</p>}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel>
          <PanelHeader title="Opportunities" />
          <div className="space-y-1.5">
            {account.opportunities.map((o) => (
              <div key={o.id} className="text-xs rounded-md border border-border bg-surface-inset p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-ink">{o.name}</span>
                  <Badge>{OPPORTUNITY_STAGE_LABELS[o.stage]}</Badge>
                </div>
                {o.nextAction && <p className="text-ink-faint mt-1">{o.nextAction}</p>}
              </div>
            ))}
            {account.opportunities.length === 0 && <p className="text-xs text-ink-faint py-4 text-center">None yet.</p>}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Samples" action={<AddSampleForm clientId={account.id} programs={account.programs} />} />
          <div className="space-y-1.5">
            {account.samples.map((s) => (
              <div key={s.id} className="text-xs rounded-md border border-border bg-surface-inset p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-ink">{s.name}</span>
                  <Badge tone={s.status === "APPROVED" ? "success" : s.status === "REJECTED" ? "danger" : "info"}>
                    {SAMPLE_STATUS_LABELS[s.status]}
                  </Badge>
                </div>
                {s.notes && <p className="text-ink-faint mt-1">{s.notes}</p>}
              </div>
            ))}
            {account.samples.length === 0 && <p className="text-xs text-ink-faint py-4 text-center">None yet.</p>}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Monogram Profiles" action={<AddMonogramForm clientId={account.id} threadColors={threadColors} />} />
          <div className="space-y-1.5">
            {account.monogramProfiles.map((m) => (
              <div key={m.id} className="text-xs rounded-md border border-border bg-surface-inset p-2.5">
                <p className="text-ink font-medium">
                  {m.personName} — <span className="font-mono">{m.monogramText}</span>
                </p>
                <p className="text-ink-muted mt-0.5">
                  {m.style}
                  {m.arrangement ? ` · ${m.arrangement}` : ""}
                </p>
                {m.savedApplications.length > 0 && (
                  <p className="text-ink-faint mt-1">{m.savedApplications.join(", ")}</p>
                )}
              </div>
            ))}
            {account.monogramProfiles.length === 0 && <p className="text-xs text-ink-faint py-4 text-center">None yet.</p>}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Timeline" />
        <AddNoteForm clientId={account.id} />
        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
          {timeline.map((t, i) => (
            <div key={i} className="flex gap-3 text-xs">
              <span className="text-ink-faint w-20 flex-none">{formatRelativeTime(t.date)}</span>
              <span className="text-ink-muted">{t.label}</span>
            </div>
          ))}
          {timeline.length === 0 && <p className="text-sm text-ink-faint text-center py-6">No activity yet.</p>}
        </div>
      </Panel>
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
