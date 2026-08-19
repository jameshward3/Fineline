import Link from "next/link";
import { PlusCircle, Shirt, ClipboardList, Palette, Factory, ArrowRight } from "lucide-react";
import { requireSession } from "@/lib/current-user";
import { getDashboardData } from "@/lib/queries/dashboard";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { NeedleStrip } from "@/components/machines/needle-strip";
import { JOB_STATUS_META, DESIGN_VERSION_STATUS_META } from "@/lib/status";
import { formatRelativeTime, formatInches } from "@/lib/utils";

const QUICK_ACTIONS = [
  { label: "New Design", href: "/designs/new", icon: PlusCircle },
  { label: "New Product", href: "/products/new", icon: Shirt },
  { label: "New Setup", href: "/setups/new", icon: ClipboardList },
  { label: "Thread Library", href: "/threads", icon: Palette },
  { label: "Production Queue", href: "/jobs", icon: Factory },
];

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session.user.organizationId);

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink">Production Dashboard</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Welcome back, {session.user.name.split(" ")[0]}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-1.5 rounded-md border border-border bg-surface hover:bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink transition-colors"
              >
                <Icon size={14} className="text-accent" />
                {a.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Jobs" value={data.stats.activeJobs} />
        <StatCard label="Designs in Library" value={data.stats.totalDesigns} />
        <StatCard label="Active Thread Colors" value={data.stats.activeThreadColors} />
        <StatCard label="Machines Online" value={data.stats.activeMachines} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Recent Designs"
            subtitle="Latest design versions across the catalog"
            action={
              <Link href="/designs" className="text-xs text-accent flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {data.recentDesignVersions.length === 0 && <EmptyRow text="No designs yet." />}
            {data.recentDesignVersions.map((v) => (
              <Link
                key={v.id}
                href={`/designs/${v.design.id}`}
                className="flex items-center justify-between py-2.5 hover:bg-surface-raised/40 -mx-2 px-2 rounded-md transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">{v.design.name}</p>
                  <p className="text-xs text-ink-muted">
                    V{v.versionNumber} · {formatInches(v.widthInches)} × {formatInches(v.heightInches)} ·{" "}
                    {formatRelativeTime(v.updatedAt)}
                  </p>
                </div>
                <Badge tone={DESIGN_VERSION_STATUS_META[v.status].tone}>
                  {DESIGN_VERSION_STATUS_META[v.status].label}
                </Badge>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Machine Needle Status"
            subtitle={data.primaryMachine?.name ?? "No machine configured"}
            action={
              <Link href="/machines" className="text-xs text-accent flex items-center gap-1 hover:underline">
                Manage <ArrowRight size={12} />
              </Link>
            }
          />
          {data.primaryMachine ? (
            <NeedleStrip
              dense
              needles={data.primaryMachine.needles.map((n) => ({
                needleNumber: n.needleNumber,
                threadHex: n.threadColor?.hex,
                threadLabel: n.threadColor
                  ? `${n.needleNumber}. ${n.threadColor.companyName} — ${n.threadColor.manufacturerName} ${n.threadColor.manufacturerCode}`
                  : "Empty",
              }))}
            />
          ) : (
            <EmptyRow text="No machines configured." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel>
          <PanelHeader title="Awaiting Digitization" subtitle="In color review or production prep" />
          <div className="divide-y divide-border">
            {data.awaitingDigitization.length === 0 && <EmptyRow text="Nothing awaiting digitization." />}
            {data.awaitingDigitization.map((v) => (
              <Link
                key={v.id}
                href={`/designs/${v.design.id}`}
                className="flex items-center justify-between py-2.5 hover:bg-surface-raised/40 -mx-2 px-2 rounded-md"
              >
                <p className="text-sm text-ink truncate">{v.design.name}</p>
                <Badge tone={DESIGN_VERSION_STATUS_META[v.status].tone}>
                  {DESIGN_VERSION_STATUS_META[v.status].label}
                </Badge>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Ready for Production" subtitle="Cleared for InStitch export" />
          <div className="divide-y divide-border">
            {data.readyForProduction.length === 0 && <EmptyRow text="Nothing ready yet." />}
            {data.readyForProduction.map((v) => (
              <Link
                key={v.id}
                href={`/designs/${v.design.id}`}
                className="flex items-center justify-between py-2.5 hover:bg-surface-raised/40 -mx-2 px-2 rounded-md"
              >
                <p className="text-sm text-ink truncate">{v.design.name}</p>
                <Badge tone="accent">V{v.versionNumber}</Badge>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Favorite Setups" subtitle="Proven production presets" />
          <div className="divide-y divide-border">
            {data.favoriteSetups.length === 0 && <EmptyRow text="No favorite setups saved." />}
            {data.favoriteSetups.map((s) => (
              <Link
                key={s.id}
                href={`/setups/${s.id}`}
                className="block py-2.5 hover:bg-surface-raised/40 -mx-2 px-2 rounded-md"
              >
                <p className="text-sm text-ink truncate">{s.name}</p>
                <p className="text-xs text-ink-muted">
                  {s.product?.name}
                  {s.location ? ` · ${s.location.name}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader
            title="Recent Production Jobs"
            action={
              <Link href="/jobs" className="text-xs text-accent flex items-center gap-1 hover:underline">
                Production queue <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {data.recentJobs.length === 0 && <EmptyRow text="No jobs yet." />}
            {data.recentJobs.map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="flex items-center justify-between py-2.5 hover:bg-surface-raised/40 -mx-2 px-2 rounded-md"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">
                    JOB {j.jobNumber} {j.client ? `· ${j.client.name}` : ""}
                  </p>
                  <p className="text-xs text-ink-muted truncate">
                    {j.items.map((i) => i.product.name).join(", ") || "No items"}
                  </p>
                </div>
                <Badge tone={JOB_STATUS_META[j.status].tone}>{JOB_STATUS_META[j.status].label}</Badge>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Recently Used Products" />
          <div className="divide-y divide-border">
            {data.recentProducts.length === 0 && <EmptyRow text="No products yet." />}
            {data.recentProducts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="flex items-center justify-between py-2.5 hover:bg-surface-raised/40 -mx-2 px-2 rounded-md"
              >
                <div>
                  <p className="text-sm text-ink">{p.name}</p>
                  <p className="text-xs text-ink-muted">{p.category}</p>
                </div>
                {p.brand && <Badge>{p.brand}</Badge>}
              </Link>
            ))}
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

function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-ink-faint py-6 text-center">{text}</p>;
}
