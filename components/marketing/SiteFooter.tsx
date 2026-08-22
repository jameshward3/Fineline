import Link from "next/link";
import { primaryNav, utilityNav } from "@/lib/marketing/content";
import { LogoLockup } from "@/components/story/marks";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1a1a1a]/10 bg-[#f6f2ec] text-[#403d38]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <svg viewBox="-100 -110 200 230" className="h-12 w-12 text-[#1a1a1a]" aria-hidden>
            <LogoLockup id="footer-mark" className="text-[#1a1a1a]" />
          </svg>
          <p className="mt-5 max-w-xs font-serif text-sm">Imagined Luxury. Actualized.</p>
        </div>

        <div>
          <h3 className="font-sans text-[11px] uppercase tracking-[0.24em] text-[#8b8276]">Explore</h3>
          <ul className="mt-4 space-y-2.5">
            {primaryNav.map((item) => (
              <li key={item.href}><Link href={item.href} className="font-sans text-sm hover:text-[#1a1a1a]">{item.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-sans text-[11px] uppercase tracking-[0.24em] text-[#8b8276]">Studio</h3>
          <ul className="mt-4 space-y-2.5">
            {utilityNav.map((item) => (
              <li key={item.href}><Link href={item.href} className="font-sans text-sm hover:text-[#1a1a1a]">{item.label}</Link></li>
            ))}
            <li><Link href="/about" className="font-sans text-sm hover:text-[#1a1a1a]">About</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-sans text-[11px] uppercase tracking-[0.24em] text-[#8b8276]">Correspondence</h3>
          <ul className="mt-4 space-y-2.5 font-sans text-sm">
            <li>studio@finelinestudio.com</li>
            <li>By appointment</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#1a1a1a]/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-center sm:flex-row sm:px-8 sm:text-left">
          <p className="font-sans text-[11px] tracking-[0.08em] text-[#8b8276]">© {new Date().getFullYear()} Fine Ligne Studio. Every idea begins with a line.</p>
          <p className="font-sans text-[11px] tracking-[0.08em] text-[#8b8276]">Institutional · Corporate · Monogram Atelier</p>
        </div>
      </div>
    </footer>
  );
}
