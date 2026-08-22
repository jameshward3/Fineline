import { notFound } from "next/navigation";
import { FileText, Image as ImageIcon, FileJson, Package, ArrowLeft, Cog, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatRelativeTime } from "@/lib/utils";

const EXPORT_TYPE_LABEL: Record<string, string> = {
  SVG: "SVG",
  PNG: "PNG",
  JPEG: "JPEG",
  PDF_PRODUCTION_SHEET: "PDF Production Sheet",
  JSON: "JSON",
  MASTER_PACKAGE_ZIP: "Master Package (ZIP)",
  STITCH_FILE_DST: "Stitch File (.dst)",
};

export default async function DesignExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const design = await prisma.design.findUnique({
    where: { id },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  if (!design || design.versions.length === 0) notFound();

  const latestVersion = design.versions[0];
  const exports = await prisma.export.findMany({
    where: { designVersionId: latestVersion.id },
    orderBy: { createdAt: "desc" },
    include: { createdBy: true },
    take: 20,
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/designs/${design.id}`} className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 mb-2">
          <ArrowLeft size={12} />
          Back to {design.name}
        </Link>
        <h1 className="text-lg font-semibold text-ink">Export for InStitch</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Generate clean production files. Original artwork is preserved and never modified.
        </p>
      </div>

      <Panel>
        <PanelHeader title="Master Package" subtitle="Everything InStitch needs, bundled as one ZIP" />
        <ExportButton
          href={`/api/designs/${design.id}/export/zip`}
          icon={Package}
          label="Download InStitch Package (.zip)"
          primary
        />
      </Panel>

      <Panel>
        <PanelHeader title="Individual Files" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <ExportButton href={`/api/designs/${design.id}/export/svg`} icon={ImageIcon} label="Separated Vector (design.svg)" />
          <ExportButton href={`/api/designs/${design.id}/export/pdf`} icon={FileText} label="Production Sheet (.pdf)" />
          <ExportButton href={`/api/designs/${design.id}/export/json`} icon={FileJson} label="Production Metadata (.json)" />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Stitch File"
          subtitle="Machine-ready DST, generated directly from this design's stitch-type assignments"
        />
        <ExportButton href={`/api/designs/${design.id}/export/dst`} icon={Cog} label="Download Stitch File (.dst)" />
        <p className="text-xs text-ink-faint mt-2">
          Automatic first-pass digitizing for clean, simple artwork — not a substitute for expert review on
          detail-dense designs. Generation is blocked if any object still needs a stitch type assigned.
        </p>
      </Panel>

      <Panel>
        <PanelHeader title="Export History" />
        <div className="space-y-1.5">
          {exports.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-xs rounded-md border border-border bg-surface-inset px-2.5 py-1.5">
              <span className="text-ink">{EXPORT_TYPE_LABEL[e.type]}</span>
              <span className="text-ink-muted">{e.createdBy.name}</span>
              <span className="text-ink-faint">{formatRelativeTime(e.createdAt)}</span>
            </div>
          ))}
          {exports.length === 0 && <p className="text-sm text-ink-faint text-center py-6">No exports yet.</p>}
        </div>
      </Panel>
    </div>
  );
}

function ExportButton({
  href,
  icon: Icon,
  label,
  primary,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-md border transition-colors ${
        primary
          ? "bg-accent border-accent text-accent-foreground hover:bg-accent/90"
          : "border-border text-ink hover:bg-surface-raised"
      }`}
    >
      <Icon size={16} />
      {label}
    </a>
  );
}
