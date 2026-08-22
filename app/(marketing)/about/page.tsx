import type { Metadata } from "next";
import { PageShell } from "@/components/marketing/PageShell";
import { LogoLockup } from "@/components/story/marks";

export const metadata: Metadata = {
  title: "About — Fine Ligne Studio",
  description: "Fine Ligne Studio is a premium embroidery and personalization atelier.",
};

export default function AboutPage() {
  return (
    <PageShell>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-5 py-20 text-center sm:px-8 sm:py-28">
        <svg viewBox="-100 -110 200 230" className="h-24 w-24 text-fl-charcoal">
          <LogoLockup id="about-mark" />
        </svg>
        <p className="mt-8 font-sans text-[11px] uppercase tracking-[0.28em] text-fl-brass">About</p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.1] text-fl-charcoal sm:text-5xl">Imagined Luxury. Actualized.</h1>
        <p className="mt-8 font-sans text-base leading-relaxed text-fl-ink-muted">
          Fine Ligne Studio exists to close the distance between an idea and an object. A crest
          sketched on a napkin. A family monogram passed down and never quite formalized. A
          company mark that deserves better than a heat-transfer vinyl. We take the idea as it
          arrives — rough, half-finished, entirely unspecified — and translate it into a stitch
          path, a thread palette, and finally, a piece you can hold.
        </p>
        <p className="mt-6 font-sans text-base leading-relaxed text-fl-ink-muted">
          We work in embroidery because embroidery does not fade, crack, or peel. It is a mark
          made permanent. That permanence is why schools trust us with a uniform program that has
          to look right for a decade, why companies trust us with an identity that has to look
          right on every recipient&rsquo;s desk, and why a single set of initials, embroidered
          well, can outlast the towel it&rsquo;s stitched to.
        </p>
      </section>

      <section className="border-t border-fl-line bg-fl-ivory">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 text-center sm:grid-cols-3 sm:px-8 sm:py-20 sm:text-left">
          <div>
            <h2 className="font-serif text-xl text-fl-charcoal">Precision</h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-fl-ink-muted">15-needle heads, hand-inspected, run against an approved production standard on every order.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl text-fl-charcoal">Restraint</h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-fl-ink-muted">We would rather place one mark well than cover a garment. Quiet is a design choice.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl text-fl-charcoal">Partnership</h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-fl-ink-muted">Institutional programs, corporate accounts, and personal commissions are each held to the same standard, at the scale each one needs.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
