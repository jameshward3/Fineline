import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { getJob } from "@/lib/queries/jobs";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { StatusStepper } from "@/components/jobs/status-stepper";
import { NeedleStrip } from "@/components/machines/needle-strip";
import { optimizeNeedleAssignment } from "@/lib/services/needle-optimizer";
import { JOB_STATUS_META, PRODUCTION_RESULT_META } from "@/lib/status";
import { formatRelativeTime } from "@/lib/utils";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const requiredColors = job.items.flatMap((item) =>
    item.designVersion.colorMappings
      .filter((m) => m.threadColorId)
      .map((m) => ({
        sequence: m.sequence,
        threadColorId: m.threadColorId!,
        hex: m.threadColor!.hex,
        companyName: m.threadColor!.companyName,
      }))
  );

  const optimization = job.machine
    ? optimizeNeedleAssignment(
        requiredColors,
        job.machine.needles.map((n) => ({
          needleNumber: n.needleNumber,
          threadColorId: n.threadColorId,
          hex: n.threadColor?.hex ?? null,
          companyName: n.threadColor?.companyName ?? null,
        }))
      )
    : null;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">
            JOB {job.jobNumber} {job.client ? `— ${job.client.name}` : ""}
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Created by {job.createdBy.name} · {formatRelativeTime(job.createdAt)}
          </p>
        </div>
        <Link
          href={`/designs/${job.items[0]?.designId}/export`}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border text-ink hover:bg-surface-raised"
        >
          <Download size={14} />
          Export Package
        </Link>
      </div>

      <Panel>
        <PanelHeader title="Status" subtitle={JOB_STATUS_META[job.status].label} />
        <StatusStepper jobId={job.id} status={job.status} />
      </Panel>

      <Panel>
        <PanelHeader title="Job Items" />
        <div className="space-y-2">
          {job.items.map((item) => (
            <div key={item.id} className="rounded-md border border-border bg-surface-inset p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">
                  {item.design.name} <span className="text-ink-faint font-normal">on</span> {item.product.name}
                </p>
                <Badge>Qty {item.quantity}</Badge>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                {item.garmentColor && `${item.garmentColor} · `}
                {item.location?.name && `${item.location.name} · `}
                {item.setup?.name}
              </p>
              <p className="text-xs text-ink-faint mt-1">{item.designVersion.colorMappings.length} colors</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Machine Needle Assignment" subtitle={job.machine?.name ?? "No machine assigned"} />
        {job.machine ? (
          <div className="space-y-4">
            <NeedleStrip
              needles={job.machine.needles.map((n) => ({
                needleNumber: n.needleNumber,
                threadHex: n.threadColor?.hex,
                threadLabel: n.threadColor?.companyName,
              }))}
            />
            {optimization && (
              <div>
                <p className="text-sm text-ink mb-2">
                  <span className="font-semibold text-accent">
                    {optimization.loadedCount} of {optimization.totalRequired}
                  </span>{" "}
                  colors already loaded.{" "}
                  {optimization.changeCount > 0 && (
                    <span className="text-status-warning">Needle change required for {optimization.changeCount}.</span>
                  )}
                </p>
                <div className="space-y-1">
                  {optimization.assignments
                    .filter((a) => a.needsChange)
                    .map((a) => (
                      <p key={a.sequence} className="text-xs text-status-warning">
                        Needle {a.suggestedNeedle}: {a.suggestedNeedleCurrentColorName} → {a.requiredName}
                      </p>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-faint">Assign a machine to compare required vs. loaded colors.</p>
        )}
      </Panel>

      {job.productionRuns.length > 0 && (
        <Panel>
          <PanelHeader title="Production Results" />
          <div className="space-y-1.5">
            {job.productionRuns.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs rounded-md border border-border bg-surface-inset px-2.5 py-1.5">
                <Badge tone={PRODUCTION_RESULT_META[r.result].tone}>{PRODUCTION_RESULT_META[r.result].label}</Badge>
                <span className="text-ink-muted">{r.notes}</span>
                <span className="text-ink-faint">{formatRelativeTime(r.recordedAt)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
