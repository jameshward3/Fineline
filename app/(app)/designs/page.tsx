import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireSession } from "@/lib/current-user";
import { getDesigns } from "@/lib/queries/designs";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { DESIGN_VERSION_STATUS_META } from "@/lib/status";
import { formatInches } from "@/lib/utils";

export default async function DesignsPage() {
  const session = await requireSession();
  const designs = await getDesigns(session.user.organizationId);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Design Catalog</h1>
          <p className="text-sm text-ink-muted mt-0.5">Every design prepared for embroidery production.</p>
        </div>
        <Link
          href="/designs/new"
          className="flex items-center gap-1.5 rounded-md bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-medium px-3 py-2"
        >
          <PlusCircle size={14} />
          New Design
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {designs.map((d) => {
          const latest = d.versions[0];
          const reference = latest?.assets.find((a) => a.stage === "PRODUCTION") ?? latest?.assets[0];
          return (
            <Link key={d.id} href={`/designs/${d.id}`}>
              <Panel padded={false} className="h-full overflow-hidden hover:border-border-strong transition-colors">
                <div className="aspect-square bg-white flex items-center justify-center canvas-checker">
                  {reference ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={reference.url} alt={d.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-ink-faint text-xs">No preview</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-ink truncate">{d.name}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {d.client?.name ?? "No client"} · V{latest?.versionNumber ?? "—"}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-ink-faint">
                      {latest ? `${formatInches(latest.widthInches)} × ${formatInches(latest.heightInches)}` : "—"}
                    </span>
                    {latest && (
                      <Badge tone={DESIGN_VERSION_STATUS_META[latest.status].tone}>
                        {DESIGN_VERSION_STATUS_META[latest.status].label}
                      </Badge>
                    )}
                  </div>
                </div>
              </Panel>
            </Link>
          );
        })}
        {designs.length === 0 && (
          <Panel className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <p className="text-sm text-ink-faint text-center py-8">No designs yet.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
