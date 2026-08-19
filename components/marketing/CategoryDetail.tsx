import Link from "next/link";
import type { Category } from "@/lib/marketing/content";
import { PageShell } from "./PageShell";

export function CategoryDetail({
  category,
  intro,
  visual,
}: {
  category: Category;
  intro: string;
  visual: React.ReactNode;
}) {
  return (
    <PageShell>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">{category.kicker}</p>
          <h1 className="mt-5 font-serif text-4xl leading-[1.08] text-fl-charcoal sm:text-5xl">{category.name}</h1>
          <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-fl-ink-muted">{intro}</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/start"
              className="border border-fl-charcoal bg-fl-charcoal px-7 py-3.5 font-sans text-xs uppercase tracking-[0.22em] text-fl-paper transition-colors hover:bg-transparent hover:text-fl-charcoal"
            >
              Start an Order
            </Link>
            <Link
              href="/process"
              className="px-2 py-3.5 font-sans text-xs uppercase tracking-[0.22em] text-fl-charcoal underline decoration-fl-ink-faint underline-offset-8 hover:decoration-fl-charcoal"
            >
              Our Process
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center border border-fl-line bg-fl-ivory p-10">
          {visual}
        </div>
      </section>

      <section className="border-t border-fl-line bg-fl-ivory">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">What we cover</p>
          <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            {category.items.map((item) => (
              <li key={item} className="border-b border-fl-line pb-3 font-sans text-sm text-fl-ink">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-fl-line bg-fl-charcoal">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-5 py-16 text-center sm:px-8">
          <h2 className="font-serif text-2xl text-fl-paper sm:text-3xl">
            Bring us an idea. We&rsquo;ll help make it real.
          </h2>
          <Link
            href="/start"
            className="border border-fl-champagne px-8 py-3.5 font-sans text-xs uppercase tracking-[0.24em] text-fl-champagne transition-colors hover:bg-fl-champagne hover:text-fl-charcoal"
          >
            Start Your Journey
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
