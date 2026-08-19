import Link from "next/link";
import { requireSession } from "@/lib/current-user";
import { getMachines } from "@/lib/queries/machines";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { NeedleStrip } from "@/components/machines/needle-strip";
import { Badge } from "@/components/ui/badge";

export default async function MachinesPage() {
  const session = await requireSession();
  const machines = await getMachines(session.user.organizationId);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-lg font-semibold text-ink">Machines</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Configured machine profiles and their currently loaded needle threads.
        </p>
      </div>

      <div className="space-y-4">
        {machines.map((m) => {
          const loaded = m.needles.filter((n) => n.threadColorId).length;
          return (
            <Panel key={m.id}>
              <PanelHeader
                title={m.name}
                subtitle={`${m.location ?? "Unassigned location"} · ${loaded}/${m.needleCount} needles loaded`}
                action={
                  <Link
                    href={`/machines/${m.id}`}
                    className="text-xs text-accent hover:underline"
                  >
                    Manage needles
                  </Link>
                }
              />
              <div className="flex items-center justify-between">
                <NeedleStrip
                  needles={m.needles.map((n) => ({
                    needleNumber: n.needleNumber,
                    threadHex: n.threadColor?.hex,
                    threadLabel: n.threadColor
                      ? `${n.needleNumber}. ${n.threadColor.companyName}`
                      : "Empty",
                  }))}
                />
                <Badge tone={m.active ? "success" : "neutral"}>{m.active ? "Online" : "Offline"}</Badge>
              </div>
            </Panel>
          );
        })}
        {machines.length === 0 && (
          <Panel>
            <p className="text-sm text-ink-faint text-center py-8">No machines configured.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
