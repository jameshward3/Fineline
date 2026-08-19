import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getProductionSetup } from "@/lib/queries/products";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/current-user";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { PRODUCTION_RESULT_META } from "@/lib/status";
import { formatRelativeTime } from "@/lib/utils";
import { RecordRunForm } from "@/components/setups/record-run-form";
import { toggleSetupFavorite } from "@/lib/actions/products";

export default async function SetupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const [setup, designVersions] = await Promise.all([
    getProductionSetup(id),
    prisma.designVersion.findMany({
      where: { design: { organizationId: session.user.organizationId } },
      include: { design: true },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
  ]);
  if (!setup) notFound();

  const excellentCount = setup.productionRuns.filter((r) => r.result === "EXCELLENT").length;
  const successRate = setup.productionRuns.length
    ? Math.round(
        (setup.productionRuns.filter((r) => r.result === "EXCELLENT" || r.result === "ACCEPTABLE").length /
          setup.productionRuns.length) *
          100
      )
    : null;

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">{setup.name}</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {setup.product?.name}
            {setup.location ? ` · ${setup.location.name}` : ""}
          </p>
        </div>
        <form action={toggleSetupFavorite.bind(null, setup.id)}>
          <button
            type="submit"
            className="p-2 rounded-md border border-border hover:bg-surface-raised"
            title={setup.isFavorite ? "Unfavorite" : "Mark favorite"}
          >
            <Star size={16} className={setup.isFavorite ? "fill-status-warning text-status-warning" : "text-ink-faint"} />
          </button>
        </form>
      </div>

      {setup.productionRuns.length > 0 && (
        <Panel className="bg-status-success/5 border-status-success/30">
          <p className="text-sm text-ink">
            <span className="font-semibold text-status-success">
              {setup.productionRuns.length} production run{setup.productionRuns.length === 1 ? "" : "s"}
            </span>{" "}
            recorded for this setup
            {successRate != null && ` · ${successRate}% success rate`}
            {excellentCount > 0 && ` · ${excellentCount} rated Excellent`}.
          </p>
        </Panel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="Setup Parameters" />
          <dl className="text-sm space-y-2">
            <Row label="Hoop" value={setup.hoop} />
            <Row label="Stabilizer" value={setup.stabilizer} />
            <Row label="Topping" value={setup.topping} />
            <Row label="Needle Size" value={setup.needleSize} />
            <Row label="Thread Weight" value={setup.threadWeight} />
            <Row label="Bobbin" value={setup.bobbin} />
            <Row label="Speed" value={setup.speedSpm ? `${setup.speedSpm} SPM` : null} />
            <Row label="Density" value={setup.densityNotes} />
            <Row label="Notes" value={setup.notes} />
          </dl>
        </Panel>

        <Panel>
          <PanelHeader title="Production History" subtitle="Test sews and production runs" />
          <div className="space-y-2 mb-3">
            {setup.productionRuns.map((r) => (
              <div key={r.id} className="rounded-md border border-border bg-surface-inset p-2.5">
                <div className="flex items-center justify-between">
                  <Badge tone={PRODUCTION_RESULT_META[r.result].tone}>
                    {PRODUCTION_RESULT_META[r.result].label}
                  </Badge>
                  <span className="text-[11px] text-ink-faint">{formatRelativeTime(r.recordedAt)}</span>
                </div>
                {r.issues.length > 0 && (
                  <p className="text-xs text-ink-muted mt-1.5">Issues: {r.issues.join(", ")}</p>
                )}
                {r.notes && <p className="text-xs text-ink-faint mt-1">{r.notes}</p>}
              </div>
            ))}
            {setup.productionRuns.length === 0 && (
              <p className="text-sm text-ink-faint py-4 text-center">No results recorded yet.</p>
            )}
          </div>
          <RecordRunForm
            setupId={setup.id}
            designVersions={designVersions.map((v) => ({
              id: v.id,
              label: `${v.design.name} — V${v.versionNumber}`,
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-ink text-right">{value}</dd>
    </div>
  );
}
