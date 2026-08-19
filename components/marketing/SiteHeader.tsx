"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { primaryNav, utilityNav } from "@/lib/marketing/content";
import { LogoLockup } from "@/components/story/marks";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-fl-gold/60 bg-fl-ivory/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-fl-charcoal" onClick={() => setOpen(false)}>
          <svg viewBox="-100 -110 200 230" className="h-9 w-9" aria-hidden>
            <LogoLockup id="header-mark" showThread className="text-fl-charcoal" />
          </svg>
          <span className="font-serif text-sm tracking-[0.08em]">Fine Line Studio</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {primaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-sans text-[11px] uppercase tracking-[0.18em] text-fl-ink-muted transition-colors hover:text-fl-charcoal",
                  active && "text-fl-charcoal",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href={utilityNav[0].href}
            className="font-sans text-[11px] uppercase tracking-[0.18em] text-fl-ink-muted transition-colors hover:text-fl-charcoal"
          >
            {utilityNav[0].label}
          </Link>
          <Link
            href={utilityNav[1].href}
            className="border border-fl-charcoal px-5 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-fl-charcoal transition-colors hover:bg-fl-charcoal hover:text-fl-paper"
          >
            {utilityNav[1].label}
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 lg:hidden"
        >
          <span className={cn("h-px w-5 bg-fl-charcoal transition-transform", open && "translate-y-[3.5px] rotate-45")} />
          <span className={cn("h-px w-5 bg-fl-charcoal transition-opacity", open && "opacity-0")} />
          <span className={cn("h-px w-5 bg-fl-charcoal transition-transform", open && "-translate-y-[3.5px] -rotate-45")} />
        </button>
      </div>

      {open && (
        <nav className="border-t border-fl-line bg-fl-ivory px-5 pb-6 pt-2 lg:hidden">
          <ul className="flex flex-col divide-y divide-fl-line">
            {[...primaryNav, ...utilityNav].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 font-sans text-xs uppercase tracking-[0.2em] text-fl-ink-muted hover:text-fl-charcoal"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
