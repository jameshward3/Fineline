import Link from "next/link";
import { PlusCircle, Star } from "lucide-react";
import { requireSession } from "@/lib/current-user";
import { getProductionSetups } from "@/lib/queries/products";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";

export default async function SetupsPage() {
  const session = await requireSession();
  const setups = await getProductionSetups(session.user.organizationId);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Production Setups</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Reusable presets for how a design has been successfully produced.
          </p>
        </div>
        <Link
          href="/setups/new"
          className="flex items-center gap-1.5 rounded-md bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-medium px-3 py-2"
        >
          <PlusCircle size={14} />
          New Setup
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {setups.map((s) => (
          <Link key={s.id} href={`/setups/${s.id}`}>
            <Panel className="h-full hover:border-border-strong transition-colors">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-ink">{s.name}</p>
                {s.isFavorite && <Star size={14} className="fill-status-warning text-status-warning flex-none" />}
              </div>
              <p className="text-xs text-ink-muted">
                {s.product?.name}
                {s.location ? ` · ${s.location.name}` : ""}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {s.hoop && <Badge>{s.hoop}</Badge>}
                {s.stabilizer && <Badge>{s.stabilizer}</Badge>}
              </div>
              <p className="text-xs text-ink-faint mt-2">
                {s._count.productionRuns} recorded run{s._count.productionRuns === 1 ? "" : "s"}
              </p>
            </Panel>
          </Link>
        ))}
        {setups.length === 0 && (
          <Panel className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-ink-faint text-center py-8">No production setups saved yet.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
