import { notFound } from "next/navigation";
import Link from "next/link";
import { Download, Factory, Copy } from "lucide-react";
import { getDesign } from "@/lib/queries/designs";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { DESIGN_VERSION_STATUS_META } from "@/lib/status";
import { formatInches, formatRelativeTime } from "@/lib/utils";
import { DesignPreview } from "@/components/designs/design-preview";
import { STITCH_TYPE_LABELS } from "@/lib/stitch-labels";
import { duplicateAsNewVersion } from "@/lib/actions/design-versions";

export default async function DesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = await getDesign(id);
  if (!design) notFound();

  const latest = design.versions[0];
  if (!latest) notFound();

  const sourceAsset = latest.assets.find((a) => a.stage === "SOURCE");
  const productionAsset = latest.assets.find((a) => a.stage === "PRODUCTION");

  const artworkHexByThread = new Map(latest.colorMappings.map((m) => [m.threadColorId, m.artworkColorHex]));

  const previewObjects = latest.vectorObjects.map((v) => ({
    key: v.id,
    svgPath: v.svgPath,
    vectorHex: (v.threadColorId && artworkHexByThread.get(v.threadColorId)) || v.threadColor?.hex || "#999999",
    threadHex: v.threadColor?.hex ?? "#999999",
    visible: v.visible,
  }));

  const association = latest.productAssociations[0];

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-ink">{design.name}</h1>
            <Badge tone={DESIGN_VERSION_STATUS_META[latest.status].tone}>
              {DESIGN_VERSION_STATUS_META[latest.status].label}
            </Badge>
          </div>
          <p className="text-xs text-ink-faint mt-1 font-mono">{design.id}</p>
          <p className="text-sm text-ink-muted mt-1">
            {design.client?.name ?? "No client"}
            {design.collection ? ` · ${design.collection}` : ""} · V{latest.versionNumber} · Updated{" "}
            {formatRelativeTime(latest.updatedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={duplicateAsNewVersion.bind(null, latest.id, undefined)}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border text-ink hover:bg-surface-raised"
            >
              <Copy size={14} />
              Duplicate as New Version
            </button>
          </form>
          <Link
            href={`/designs/${design.id}/export`}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border text-ink hover:bg-surface-raised"
          >
            <Download size={14} />
            Export
          </Link>
          <Link
            href={`/jobs/new?designId=${design.id}&designVersionId=${latest.id}`}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium"
          >
            <Factory size={14} />
            Create Job
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <Panel>
          <DesignPreview
            originalUrl={sourceAsset?.url ?? null}
            reducedUrl={productionAsset?.url ?? null}
            objects={previewObjects}
            viewBoxWidth={productionAsset?.widthPx ?? 400}
            viewBoxHeight={productionAsset?.heightPx ?? 400}
            garmentColor="#17375E"
          />
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Production Summary" />
            <dl className="text-sm space-y-2">
              <Row label="Physical Size" value={`${formatInches(latest.widthInches)} × ${formatInches(latest.heightInches)}`} />
              <Row label="Detected Colors" value={String(latest.detectedColorCount ?? "—")} />
              <Row label="Production Colors" value={String(latest.colorMappings.length)} />
              <Row label="Readiness Score" value={latest.readinessScore != null ? `${latest.readinessScore} / 100` : "—"} />
              <Row label="Classification" value={latest.readinessClassification ?? "—"} />
              <Row label="Created By" value={latest.createdBy.name} />
            </dl>
          </Panel>

          {association && (
            <Panel>
              <PanelHeader title="Production Association" />
              <dl className="text-sm space-y-2">
                <Row label="Product" value={association.product.name} />
                <Row label="Location" value={association.location?.name ?? "—"} />
                <Row label="Setup" value={association.setup?.name ?? "—"} />
              </dl>
            </Panel>
          )}

          {design.versions.length > 1 && (
            <Panel>
              <PanelHeader title="Revisions" />
              <div className="space-y-1.5">
                {design.versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs">
                    <span className={v.id === latest.id ? "text-ink font-medium" : "text-ink-muted"}>
                      V{v.versionNumber}
                      {v.id === latest.id ? " (current)" : ""}
                    </span>
                    <Badge tone={DESIGN_VERSION_STATUS_META[v.status].tone}>{DESIGN_VERSION_STATUS_META[v.status].label}</Badge>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="Thread Color Sequence" />
          <div className="space-y-1.5">
            {latest.colorMappings.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5 text-xs rounded-md border border-border bg-surface-inset px-2.5 py-1.5">
                <span className="font-mono text-ink-faint w-5">{String(m.sequence).padStart(2, "0")}</span>
                <div className="w-5 h-5 rounded border border-black/20" style={{ background: m.threadColor?.hex ?? m.artworkColorHex }} />
                <span className="text-ink flex-1">{m.threadColor?.companyName ?? "Unmapped"}</span>
                <span className="text-ink-faint">
                  {m.threadColor?.manufacturer.name} {m.threadColor?.manufacturerCode}
                </span>
                {m.needleNumber && <Badge>Needle {m.needleNumber}</Badge>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Sewing Sequence" />
          <div className="space-y-1.5">
            {latest.vectorObjects.map((v) => (
              <div key={v.id} className="flex items-center gap-2.5 text-xs rounded-md border border-border bg-surface-inset px-2.5 py-1.5">
                <span className="font-mono text-ink-faint w-5">{String(v.sequenceOrder).padStart(2, "0")}</span>
                <div className="w-5 h-5 rounded border border-black/20" style={{ background: v.threadColor?.hex ?? "#999" }} />
                <span className="text-ink flex-1">{v.name}</span>
                <span className="text-ink-faint">{STITCH_TYPE_LABELS[v.stitchType]}</span>
                {v.stitchDirectionDegrees != null && <span className="text-ink-faint">{v.stitchDirectionDegrees}°</span>}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-ink text-right">{value}</dd>
    </div>
  );
}
