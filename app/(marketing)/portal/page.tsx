import type { Metadata } from "next";
import { PageShell } from "@/components/marketing/PageShell";
import { PortalLoginForm } from "@/components/marketing/PortalLoginForm";
import { PortalNoteForm } from "@/components/marketing/PortalNoteForm";
import { getPortalSession, clearPortalSession } from "@/lib/portal-session";
import { getPortalClient, getPortalJobNotes } from "@/lib/queries/portal";
import { portalStageFor, PORTAL_STAGES } from "@/lib/portal-status";
import { portalLogout } from "@/lib/actions/portal";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Client Portal — Fine Line Studio",
  description: "Track production progress and message your account team.",
};

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await getPortalSession();
  const client = session ? await getPortalClient(session.clientId) : null;

  if (!session || !client) {
    if (session && !client) await clearPortalSession();
    return (
      <PageShell>
        <section className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
          <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">Client Portal</p>
          <h1 className="mt-4 font-serif text-3xl text-fl-charcoal sm:text-4xl">Check on your order.</h1>
          <p className="mt-6 font-sans text-base leading-relaxed text-fl-ink-muted">
            Enter the phone number on file with Fine Line Studio to see production status and message
            your account team about any active order.
          </p>
          <PortalLoginForm />
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">Client Portal</p>
            <h1 className="mt-2 font-serif text-3xl text-fl-charcoal">{client.name}</h1>
          </div>
          <form action={portalLogout}>
            <button
              type="submit"
              className="font-sans text-xs uppercase tracking-[0.18em] text-fl-ink-muted underline decoration-fl-ink-faint underline-offset-4 hover:text-fl-charcoal"
            >
              Sign Out
            </button>
          </form>
        </div>

        <div className="mt-12 space-y-10">
          {client.jobs.length === 0 && (
            <p className="font-sans text-sm text-fl-ink-faint">No active orders on file right now.</p>
          )}
          {await Promise.all(
            client.jobs.map(async (job) => {
              const { stage, stepIndex } = portalStageFor(job.status);
              const notes = (await getPortalJobNotes(job.id, client.id)) ?? [];
              return (
                <div key={job.id} className="border border-fl-line bg-fl-paper p-6 sm:p-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-serif text-xl text-fl-charcoal">Order {job.jobNumber}</h2>
                    <span className="font-sans text-xs uppercase tracking-[0.18em] text-fl-brass">{stage}</span>
                  </div>
                  <p className="mt-1 font-sans text-sm text-fl-ink-muted">
                    {job.items.map((i) => `${i.design.name} on ${i.product.name} (x${i.quantity})`).join(" · ")}
                  </p>

                  <div className="mt-6 flex items-center gap-1">
                    {PORTAL_STAGES.map((s, i) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 ${i <= stepIndex ? "bg-fl-gold" : "bg-fl-line"}`}
                        title={s}
                      />
                    ))}
                  </div>
                  <p className="mt-2 font-sans text-xs text-fl-ink-faint">
                    Order placed {formatRelativeTime(job.createdAt)}
                  </p>

                  {notes.length > 0 && (
                    <div className="mt-6 space-y-3 border-t border-fl-line pt-5">
                      {notes.map((n) => (
                        <div key={n.id} className="font-sans text-sm">
                          <p className="text-xs uppercase tracking-[0.14em] text-fl-brass">
                            {n.authorClient ? n.authorClient.name : (n.author?.name ?? "Fine Line Studio")}
                            <span className="ml-2 normal-case tracking-normal text-fl-ink-faint">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </p>
                          <p className="mt-1 text-fl-ink">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <PortalNoteForm jobId={job.id} resetKey={notes.length} />
                </div>
              );
            })
          )}
        </div>

        {client.programs.length > 0 && (
          <div className="mt-14 border-t border-fl-line pt-8">
            <h2 className="font-serif text-xl text-fl-charcoal">Programs</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {client.programs.map((p) => (
                <span
                  key={p.id}
                  className="border border-fl-line px-3 py-1.5 font-sans text-xs text-fl-ink-muted"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
