import { notFound } from "next/navigation";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { getProgram } from "@/lib/queries/crm";
import { prisma } from "@/lib/prisma";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { PROGRAM_STATUS_LABELS } from "@/lib/crm-labels";
import { AddProgramProductForm } from "@/components/crm/add-program-product-form";

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await getProgram(id);
  if (!program) notFound();

  const [products, designs, setups] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId: program.client.organizationId },
      include: { locations: true },
      orderBy: { name: "asc" },
    }),
    prisma.design.findMany({
      where: { organizationId: program.client.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.productionSetup.findMany({
      where: { organizationId: program.client.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-[1100px]">
      <div>
        <Link href={`/crm/accounts/${program.client.id}`} className="text-xs text-ink-muted hover:text-ink">
          {program.client.name}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-lg font-semibold text-ink">{program.name}</h1>
          <Badge tone={program.status === "ACTIVE" ? "success" : "neutral"}>{PROGRAM_STATUS_LABELS[program.status]}</Badge>
        </div>
        {program.description && <p className="text-sm text-ink-muted mt-1">{program.description}</p>}
      </div>

      <Panel>
        <PanelHeader
          title="Approved Products"
          subtitle="Reorder replays product, artwork, placement, and setup exactly"
          action={<AddProgramProductForm programId={program.id} products={products} designs={designs} setups={setups} />}
        />
        <div className="space-y-2">
          {program.approvedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-border bg-surface-inset p-3">
              <div>
                <p className="text-sm text-ink font-medium">{item.product.name}</p>
                <p className="text-xs text-ink-muted">
                  {item.location?.name ?? "No placement set"}
                  {item.design ? ` · ${item.design.name}` : ""}
                  {item.setup ? ` · ${item.setup.name}` : ""}
                </p>
              </div>
              <Link
                href={`/jobs/new?clientId=${program.client.id}&productId=${item.productId}${
                  item.locationId ? `&locationId=${item.locationId}` : ""
                }${item.setupId ? `&setupId=${item.setupId}` : ""}${
                  item.designId ? `&designId=${item.designId}` : ""
                }`}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-accent text-accent-foreground font-medium"
              >
                <RotateCcw size={12} />
                Reorder
              </Link>
            </div>
          ))}
          {program.approvedItems.length === 0 && (
            <p className="text-sm text-ink-faint py-6 text-center">No approved products yet.</p>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Thread Palette" />
        <div className="flex flex-wrap gap-2">
          {program.threadPalette.map((tp) => (
            <div key={tp.id} className="flex items-center gap-2 rounded-md border border-border bg-surface-inset px-2.5 py-1.5">
              <div className="w-5 h-5 rounded border border-black/20" style={{ background: tp.threadColor.hex }} />
              <div className="text-xs">
                <p className="text-ink">{tp.threadColor.companyName}</p>
                <p className="text-ink-faint">
                  {tp.roleLabel} · {tp.threadColor.manufacturer.name} {tp.threadColor.manufacturerCode}
                </p>
              </div>
            </div>
          ))}
          {program.threadPalette.length === 0 && <p className="text-sm text-ink-faint">No thread palette set.</p>}
        </div>
      </Panel>
    </div>
  );
}
