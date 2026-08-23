import type { Metadata } from "next";
import Link from "next/link";
import { processSteps } from "@/lib/marketing/content";
import { PageShell } from "@/components/marketing/PageShell";
import { NeedleShape, ThreadSwirl } from "@/components/story/marks";

export const metadata: Metadata = {
  title: "Our Process — Fine Line Studio",
  description: "From idea to object: how Fine Line Studio translates a mark into thread.",
};

export default function ProcessPage() {
  return (
    <PageShell>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">Our Process</p>
          <h1 className="mt-5 font-serif text-4xl leading-[1.08] text-fl-charcoal sm:text-5xl">
            From idea to object.
          </h1>
          <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-fl-ink-muted">
            Embroidery is a translation, not a print. Every stitch is a decision — direction,
            density, thread weight. This is how we make that decision well, every time.
          </p>
        </div>
        <div className="flex items-center justify-center border border-fl-line bg-fl-ivory p-10">
          <svg viewBox="-90 -80 180 240" className="h-64 w-64 text-fl-charcoal">
            <g transform="translate(0,-60) scale(0.62)" style={{ strokeWidth: 2.4 }}>
              <NeedleShape id="process-needle" className="fill-current" />
              <ThreadSwirl id="process-thread" className="stroke-fl-gold" style={{ strokeWidth: 2.6 }} />
            </g>
          </svg>
        </div>
      </section>

      <section className="border-t border-fl-line bg-fl-ivory">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
          <ol className="space-y-12">
            {processSteps.map((step) => (
              <li key={step.number} className="flex gap-6 border-b border-fl-line pb-12 last:border-b-0 last:pb-0">
                <span className="font-serif text-4xl text-fl-gold">{step.number}</span>
                <div>
                  <h2 className="font-serif text-2xl text-fl-charcoal">{step.title}</h2>
                  <p className="mt-2 max-w-lg font-sans text-sm leading-relaxed text-fl-ink-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-fl-line bg-fl-charcoal">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-5 py-16 text-center sm:px-8">
          <h2 className="font-serif text-2xl text-fl-paper sm:text-3xl">Ready to begin?</h2>
          <Link
            href="/configure"
            className="border border-fl-champagne px-8 py-3.5 font-sans text-xs uppercase tracking-[0.24em] text-fl-champagne transition-colors hover:bg-fl-champagne hover:text-fl-charcoal"
          >
            Start Your Journey
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
