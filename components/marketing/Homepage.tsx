import Link from "next/link";
import { categories, processSteps } from "@/lib/marketing/content";
import {
  MonogramGlyph,
  TowelStackShape,
  ShirtShape,
  ToteShape,
} from "@/components/story/marks";

export function Homepage({ id = "home" }: { id?: string }) {
  return (
    <div id={id} className="bg-fl-paper">
      <HeroSection />
      <CollectionsSection />
      <ProcessSection />
      <ClosingCta />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
      <div>
        <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">Fine Line Studio</p>
        <h1 className="mt-5 font-serif text-4xl leading-[1.08] text-fl-charcoal sm:text-5xl lg:text-6xl">
          Made personal.
        </h1>
        <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-fl-ink-muted">
          Every piece begins as an idea — a monogram, a crest, a mark that belongs to you. We
          translate it into thread, and hand it back as something you can hold.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/collections"
            className="border border-fl-charcoal bg-fl-charcoal px-7 py-3.5 font-sans text-xs uppercase tracking-[0.22em] text-fl-paper transition-colors hover:bg-transparent hover:text-fl-charcoal"
          >
            Explore Collections
          </Link>
          <Link
            href="/start"
            className="px-2 py-3.5 font-sans text-xs uppercase tracking-[0.22em] text-fl-charcoal underline decoration-fl-ink-faint underline-offset-8 hover:decoration-fl-charcoal"
          >
            Start an Order
          </Link>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="aspect-[4/5] w-full max-w-md border border-fl-line bg-fl-ivory p-10 shadow-[0_30px_80px_-40px_rgba(24,22,19,0.35)]">
          <svg viewBox="-220 -240 440 480" className="h-full w-full text-fl-charcoal">
            <g transform="translate(30,-30) scale(0.95)">
              <TowelStackShape id="hero-towel" />
            </g>
            <g transform="translate(-6,44) scale(0.42)" className="text-fl-gold">
              <MonogramGlyph id="hero-monogram" className="fill-current stroke-current" />
            </g>
          </svg>
        </div>
        <p className="absolute -bottom-4 left-1/2 w-max -translate-x-1/2 bg-fl-paper px-4 font-serif italic text-sm text-fl-ink-muted">
          Monogrammed, corner to corner.
        </p>
      </div>
    </section>
  );
}

function CollectionsSection() {
  return (
    <section className="border-t border-fl-line bg-fl-ivory">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">Collections</p>
            <h2 className="mt-3 font-serif text-3xl text-fl-charcoal sm:text-4xl">
              Six ways to begin.
            </h2>
          </div>
          <p className="max-w-sm font-sans text-sm text-fl-ink-muted">
            From a single monogram to a full institutional program — every collection starts with
            your idea, not our catalog.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden border border-fl-line bg-fl-line sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group flex flex-col justify-between gap-8 bg-fl-ivory p-8 transition-colors hover:bg-fl-paper"
            >
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-fl-brass">{cat.kicker}</p>
                <h3 className="mt-3 font-serif text-2xl text-fl-charcoal">{cat.name}</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-fl-ink-muted">{cat.description}</p>
              </div>
              <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-fl-charcoal underline decoration-fl-ink-faint underline-offset-4 group-hover:decoration-fl-charcoal">
                View collection
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="border-t border-fl-line bg-fl-paper">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">Our Process</p>
            <h2 className="mt-3 font-serif text-3xl text-fl-charcoal sm:text-4xl">
              From idea to object.
            </h2>
          </div>
          <Link
            href="/process"
            className="font-sans text-xs uppercase tracking-[0.2em] text-fl-charcoal underline decoration-fl-ink-faint underline-offset-8 hover:decoration-fl-charcoal"
          >
            The full process
          </Link>
        </div>

        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {processSteps.map((step) => (
            <li key={step.number}>
              <span className="font-serif text-3xl text-fl-gold">{step.number}</span>
              <h3 className="mt-3 font-serif text-lg text-fl-charcoal">{step.title}</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-fl-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="border-t border-fl-line bg-fl-charcoal">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-5 py-20 text-center sm:px-8 sm:py-28">
        <svg viewBox="-260 -180 520 360" className="h-24 w-40 text-fl-champagne">
          <g transform="translate(-140,20) scale(0.5)">
            <ShirtShape id="cta-shirt" />
          </g>
          <g transform="translate(30,40) scale(0.42)">
            <TowelStackShape id="cta-towel" />
          </g>
          <g transform="translate(170,60) scale(0.4)">
            <ToteShape id="cta-tote" />
          </g>
        </svg>
        <h2 className="font-serif text-3xl leading-tight text-fl-paper sm:text-5xl">
          Imagined Luxury.
          <br />
          Actualized.
        </h2>
        <p className="max-w-md font-sans text-sm text-fl-cream/80 sm:text-base">
          Bring us an idea. We&rsquo;ll help make it real.
        </p>
        <Link
          href="/start"
          className="border border-fl-champagne px-8 py-3.5 font-sans text-xs uppercase tracking-[0.24em] text-fl-champagne transition-colors hover:bg-fl-champagne hover:text-fl-charcoal"
        >
          Start Your Journey
        </Link>
      </div>
    </section>
  );
}
