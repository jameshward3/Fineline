import Link from "next/link";
import { primaryNav, utilityNav } from "@/lib/marketing/content";
import { LogoLockup } from "@/components/story/marks";

export function SiteFooter() {
  return (
    <footer className="border-t border-fl-line bg-fl-charcoal text-fl-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <svg viewBox="-100 -110 200 230" className="h-12 w-12" aria-hidden>
            <LogoLockup id="footer-mark" className="text-fl-cream" />
          </svg>
          <p className="mt-5 max-w-xs font-serif italic text-sm text-fl-champagne">
            Imagined Luxury. Actualized.
          </p>
        </div>

        <div>
          <h3 className="font-sans text-[11px] uppercase tracking-[0.24em] text-fl-ink-faint">Explore</h3>
          <ul className="mt-4 space-y-2.5">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="font-sans text-sm text-fl-cream/85 hover:text-fl-champagne">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-sans text-[11px] uppercase tracking-[0.24em] text-fl-ink-faint">Studio</h3>
          <ul className="mt-4 space-y-2.5">
            {utilityNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="font-sans text-sm text-fl-cream/85 hover:text-fl-champagne">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/about" className="font-sans text-sm text-fl-cream/85 hover:text-fl-champagne">
                About
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-sans text-[11px] uppercase tracking-[0.24em] text-fl-ink-faint">Correspondence</h3>
          <ul className="mt-4 space-y-2.5 font-sans text-sm text-fl-cream/85">
            <li>studio@finelinestudio.com</li>
            <li>By appointment</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-fl-cream/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-center sm:flex-row sm:px-8 sm:text-left">
          <p className="font-sans text-[11px] tracking-[0.08em] text-fl-ink-faint">
            © {new Date().getFullYear()} Fine Line Studio. Every idea begins with a line.
          </p>
          <p className="font-sans text-[11px] tracking-[0.08em] text-fl-ink-faint">
            Institutional · Corporate · Monogram Atelier
          </p>
        </div>
      </div>
    </footer>
  );
}
