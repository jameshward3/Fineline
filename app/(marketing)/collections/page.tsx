import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/lib/marketing/content";
import { PageShell } from "@/components/marketing/PageShell";
import { TowelStackShape, ToteShape, ShirtShape } from "@/components/story/marks";

export const metadata: Metadata = {
  title: "Collections — Fine Line Studio",
  description: "Six ways to begin — institutional, corporate, monogram, home, bags, and apparel.",
};

const secondary = [
  {
    slug: "home",
    category: categories.find((c) => c.slug === "home")!,
    visual: <TowelStackShape id="collections-home" />,
    viewBox: "-140 -80 280 200",
  },
  {
    slug: "bags",
    category: categories.find((c) => c.slug === "bags")!,
    visual: <ToteShape id="collections-bags" />,
    viewBox: "-140 -190 280 380",
  },
  {
    slug: "apparel",
    category: categories.find((c) => c.slug === "apparel")!,
    visual: <ShirtShape id="collections-apparel" />,
    viewBox: "-160 -200 320 420",
  },
];

export default function CollectionsPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">Collections</p>
        <h1 className="mt-5 font-serif text-4xl text-fl-charcoal sm:text-5xl">Six ways to begin.</h1>
        <p className="mx-auto mt-6 max-w-xl font-sans text-base leading-relaxed text-fl-ink-muted">
          Every collection starts with your idea, not our catalog. Choose the closest starting
          point — the atelier will meet you where you are.
        </p>
      </section>

      <section className="border-t border-fl-line bg-fl-ivory">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden border border-fl-line bg-fl-line px-0 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group flex flex-col justify-between gap-8 bg-fl-ivory p-8 transition-colors hover:bg-fl-paper"
            >
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-fl-brass">{cat.kicker}</p>
                <h2 className="mt-3 font-serif text-2xl text-fl-charcoal">{cat.name}</h2>
                <p className="mt-3 font-sans text-sm leading-relaxed text-fl-ink-muted">{cat.description}</p>
              </div>
              <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-fl-charcoal underline decoration-fl-ink-faint underline-offset-4 group-hover:decoration-fl-charcoal">
                View collection
              </span>
            </Link>
          ))}
        </div>
      </section>

      {secondary.map(({ slug, category, visual, viewBox }, i) => (
        <section
          key={slug}
          id={slug}
          className={`border-t border-fl-line ${i % 2 === 0 ? "bg-fl-paper" : "bg-fl-ivory"}`}
        >
          <div
            className={`mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">{category.kicker}</p>
              <h2 className="mt-4 font-serif text-3xl text-fl-charcoal sm:text-4xl">{category.name}</h2>
              <p className="mt-5 max-w-md font-sans text-sm leading-relaxed text-fl-ink-muted">
                {category.description}
              </p>
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {category.items.map((item) => (
                  <li key={item} className="font-sans text-xs uppercase tracking-[0.12em] text-fl-ink-muted">
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/configure"
                className="mt-8 inline-block border border-fl-charcoal px-7 py-3 font-sans text-xs uppercase tracking-[0.2em] text-fl-charcoal transition-colors hover:bg-fl-charcoal hover:text-fl-paper"
              >
                Start an Order
              </Link>
            </div>
            <div className="flex items-center justify-center border border-fl-line bg-fl-ivory p-8">
              <svg viewBox={viewBox} className="h-56 w-56 text-fl-charcoal sm:h-64 sm:w-64">
                {visual}
              </svg>
            </div>
          </div>
        </section>
      ))}
    </PageShell>
  );
}
