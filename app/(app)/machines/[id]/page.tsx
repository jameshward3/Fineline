import { notFound } from "next/navigation";
import { requireSession } from "@/lib/current-user";
import { getMachine } from "@/lib/queries/machines";
import { getThreadColors } from "@/lib/queries/threads";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { NeedleSelect } from "@/components/machines/needle-select";

export default async function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const [machine, threads] = await Promise.all([
    getMachine(id),
    getThreadColors(session.user.organizationId),
  ]);

  if (!machine) notFound();

  const activeThreads = threads.filter((t) => t.active);
  const needleMap = new Map(machine.needles.map((n) => [n.needleNumber, n]));

  return (
    <div className="space-y-6 max-w-[900px]">
      <div>
        <h1 className="text-lg font-semibold text-ink">{machine.name}</h1>
        <p className="text-sm text-ink-muted mt-0.5">{machine.location}</p>
      </div>

      <Panel>
        <PanelHeader
          title="Needle Assignments"
          subtitle="Set which thread is currently loaded on each needle"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: machine.needleCount }, (_, i) => i + 1).map((needleNumber) => {
            const needle = needleMap.get(needleNumber);
            return (
              <div
                key={needleNumber}
                className="flex items-center gap-2.5 rounded-md border border-border bg-surface p-2.5"
              >
                <div
                  className="w-9 h-9 rounded flex-none border border-black/20 flex items-end justify-center overflow-hidden"
                  style={{ background: needle?.threadColor?.hex ?? "transparent" }}
                >
                  <span
                    className={`text-[9px] font-mono font-bold w-full text-center ${
                      needle?.threadColor ? "bg-black/40 text-white" : "text-ink-faint"
                    }`}
                  >
                    {String(needleNumber).padStart(2, "0")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <NeedleSelect
                    machineId={machine.id}
                    needleNumber={needleNumber}
                    currentThreadId={needle?.threadColorId ?? null}
                    threads={activeThreads.map((t) => ({ id: t.id, hex: t.hex, companyName: t.companyName }))}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
