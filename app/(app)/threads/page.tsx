import { Star } from "lucide-react";
import { requireSession } from "@/lib/current-user";
import { getThreadColors, getThreadManufacturers, getCompanyPalette } from "@/lib/queries/threads";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ThreadChip } from "@/components/threads/thread-chip";
import { AddThreadForm } from "@/components/threads/add-thread-form";
import { PaletteSlotSelect } from "@/components/threads/palette-slot-select";
import { toggleThreadActive, toggleThreadFavorite } from "@/lib/actions/threads";

export default async function ThreadsPage() {
  const session = await requireSession();
  const orgId = session.user.organizationId;
  const [threads, manufacturers, palette] = await Promise.all([
    getThreadColors(orgId),
    getThreadManufacturers(orgId),
    getCompanyPalette(orgId),
  ]);

  const activeThreads = threads.filter((t) => t.active);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-semibold text-ink">Thread Library</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          The company&apos;s physical thread inventory. Every artwork color should resolve to one of
          these stocked spools.
        </p>
      </div>

      <Panel>
        <PanelHeader
          title="Persistent Company Palette"
          subtitle="15-slot standard palette used to auto-map new artwork"
        />
        {palette ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {palette.slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center gap-2 rounded-md border border-border bg-surface-inset px-2 py-2"
              >
                <div
                  className="w-8 h-8 rounded flex-none border border-black/20"
                  style={{ background: slot.threadColor.hex }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-mono text-ink-muted">
                    {String(slot.slotNumber).padStart(2, "0")}
                  </p>
                  <PaletteSlotSelect
                    paletteId={palette.id}
                    slotNumber={slot.slotNumber}
                    currentThreadId={slot.threadColorId}
                    threads={activeThreads.map((t) => ({
                      id: t.id,
                      hex: t.hex,
                      companyName: t.companyName,
                      manufacturerName: t.manufacturerName,
                      manufacturerCode: t.manufacturerCode,
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-faint">No company palette configured yet.</p>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="All Thread Colors"
          subtitle={`${threads.length} colors · ${activeThreads.length} active`}
          action={<AddThreadForm manufacturers={manufacturers} />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {threads.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2">
              <ThreadChip
                thread={{
                  hex: t.hex,
                  companyName: t.companyName,
                  manufacturerName: t.manufacturerName,
                  manufacturerCode: t.manufacturerCode,
                  active: t.active,
                }}
              />
              <div className="flex items-center gap-1 flex-none">
                <form action={toggleThreadFavorite.bind(null, t.id)}>
                  <button
                    type="submit"
                    title={t.favorite ? "Unfavorite" : "Mark favorite"}
                    className="p-1.5 rounded-md hover:bg-surface-raised"
                  >
                    <Star
                      size={14}
                      className={t.favorite ? "fill-status-warning text-status-warning" : "text-ink-faint"}
                    />
                  </button>
                </form>
                <form action={toggleThreadActive.bind(null, t.id)}>
                  <button type="submit">
                    <Badge tone={t.active ? "success" : "neutral"} className="cursor-pointer">
                      {t.active ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
