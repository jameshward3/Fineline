import type { Metadata } from "next";
import Link from "next/link";
import { configuratorPaths } from "@/lib/marketing/content";
import { PageShell } from "@/components/marketing/PageShell";

export const metadata: Metadata = {
  title: "Start an Order — Fine Line Studio",
  description: "What would you like to create? Begin your Fine Line Studio order.",
};

export default function StartPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">Start an Order</p>
        <h1 className="mt-5 font-serif text-4xl text-fl-charcoal sm:text-5xl">
          What would you like to create?
        </h1>
        <p className="mx-auto mt-6 max-w-lg font-sans text-base leading-relaxed text-fl-ink-muted">
          Choose the closest starting point. A member of the atelier will follow up to review
          artwork, thread, placement, and quantity before anything goes to production.
        </p>
      </section>

      <section className="border-t border-fl-line bg-fl-ivory">
        <div className="mx-auto grid max-w-5xl gap-px overflow-hidden border border-fl-line bg-fl-line px-0 py-0 sm:grid-cols-2 lg:grid-cols-3">
          {configuratorPaths.map((path) => (
            <Link
              key={path.label}
              href={path.href}
              className="group flex flex-col justify-between gap-10 bg-fl-ivory p-8 transition-colors hover:bg-fl-paper"
            >
              <div>
                <h2 className="font-serif text-xl text-fl-charcoal">{path.label}</h2>
                <p className="mt-3 font-sans text-sm leading-relaxed text-fl-ink-muted">{path.description}</p>
              </div>
              <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-fl-charcoal underline decoration-fl-ink-faint underline-offset-4 group-hover:decoration-fl-charcoal">
                Begin
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-fl-line bg-fl-paper">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-5 py-14 text-center sm:px-8">
          <p className="font-serif italic text-lg text-fl-ink-muted">
            Bring us an idea. We&rsquo;ll help make it real.
          </p>
          <p className="font-sans text-xs text-fl-ink-faint">
            Already have an account? <Link href="/portal" className="underline decoration-fl-ink-faint underline-offset-4 hover:text-fl-charcoal">Visit the Client Portal</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
