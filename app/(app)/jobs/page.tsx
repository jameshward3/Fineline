import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireSession } from "@/lib/current-user";
import { getJobs } from "@/lib/queries/jobs";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_META, JOB_STATUS_ORDER } from "@/lib/status";
import { formatRelativeTime } from "@/lib/utils";

export default async function JobsPage() {
  const session = await requireSession();
  const jobs = await getJobs(session.user.organizationId);

  const active = jobs.filter((j) => j.status !== "COMPLETE" && j.status !== "ARCHIVED");
  const finished = jobs.filter((j) => j.status === "COMPLETE" || j.status === "ARCHIVED");

  return (
    <div className="space-y-6 max-w-[1300px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Production Queue</h1>
          <p className="text-sm text-ink-muted mt-0.5">Every embroidery job, in production workflow order.</p>
        </div>
        <Link
          href="/jobs/new"
          className="flex items-center gap-1.5 rounded-md bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-medium px-3 py-2"
        >
          <PlusCircle size={14} />
          New Job
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {JOB_STATUS_ORDER.map((status) => {
          const count = active.filter((j) => j.status === status).length;
          if (count === 0) return null;
          return (
            <Badge key={status} tone={JOB_STATUS_META[status].tone}>
              {JOB_STATUS_META[status].label}: {count}
            </Badge>
          );
        })}
      </div>

      <div className="space-y-2">
        {active.map((j) => (
          <JobRow key={j.id} job={j} />
        ))}
        {active.length === 0 && (
          <Panel>
            <p className="text-sm text-ink-faint text-center py-8">No active jobs.</p>
          </Panel>
        )}
      </div>

      {finished.length > 0 && (
        <div>
          <p className="text-xs text-ink-faint mb-2 uppercase tracking-wide">Completed / Archived</p>
          <div className="space-y-2 opacity-70">
            {finished.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JobRow({
  job,
}: {
  job: Awaited<ReturnType<typeof getJobs>>[number];
}) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Panel className="hover:border-border-strong transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              JOB {job.jobNumber} {job.client ? `— ${job.client.name}` : ""}
            </p>
            <p className="text-xs text-ink-muted mt-0.5 truncate">
              {job.items
                .map((i) => `${i.design.name} on ${i.product.name}${i.location ? ` (${i.location.name})` : ""} × ${i.quantity}`)
                .join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-none">
            <span className="text-xs text-ink-faint">{formatRelativeTime(job.updatedAt)}</span>
            <Badge tone={JOB_STATUS_META[job.status].tone}>{JOB_STATUS_META[job.status].label}</Badge>
          </div>
        </div>
      </Panel>
    </Link>
  );
}
