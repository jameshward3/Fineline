import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/marketing/PageShell";
import { MonogramGlyph } from "@/components/story/marks";

export const metadata: Metadata = {
  title: "Client Portal — Fine Line Studio",
  description: "Manage artwork, monograms, and orders with Fine Line Studio.",
};

export default function PortalPage() {
  return (
    <PageShell>
      <section className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
        <svg viewBox="-48 -35 64 64" className="h-16 w-16 text-fl-gold">
          <MonogramGlyph id="portal-monogram" className="fill-current stroke-current" />
        </svg>
        <p className="mt-8 font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">Client Portal</p>
        <h1 className="mt-4 font-serif text-3xl text-fl-charcoal sm:text-4xl">
          Your account is being prepared.
        </h1>
        <p className="mt-6 font-sans text-base leading-relaxed text-fl-ink-muted">
          Saved artwork, monogram profiles, institutional catalogs, order history, and production
          status will live here. The portal is opening to existing accounts first — if you have an
          active program with Fine Line Studio, your account team can grant early access.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/configure"
            className="border border-fl-charcoal bg-fl-charcoal px-7 py-3.5 font-sans text-xs uppercase tracking-[0.22em] text-fl-paper transition-colors hover:bg-transparent hover:text-fl-charcoal"
          >
            Start an Order
          </Link>
          <Link
            href="/about"
            className="px-2 py-3.5 font-sans text-xs uppercase tracking-[0.22em] text-fl-charcoal underline decoration-fl-ink-faint underline-offset-8 hover:decoration-fl-charcoal"
          >
            About the Studio
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
