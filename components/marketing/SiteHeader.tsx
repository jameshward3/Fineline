"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoLockup } from "@/components/story/marks";
import { primaryNav, utilityNav } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

const mobileNav = [...primaryNav, ...utilityNav];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#f6f2ec]/95 backdrop-blur">
      <div className="mx-auto flex h-[88px] max-w-[1440px] items-center justify-between px-6 sm:px-10 lg:px-16">
        <Link href="/" className="flex items-center gap-2 text-fl-charcoal" onClick={() => setOpen(false)}>
          <svg viewBox="-100 -110 200 230" className="h-12 w-12" aria-hidden>
            <LogoLockup id="header-mark" showThread showWordmark={false} className="text-fl-charcoal" />
          </svg>
          <span className="flex flex-col items-center font-serif text-sm tracking-[0.16em]">
            <span>FINE LIGNE</span>
            <span className="text-[7px] tracking-[.45em]">STUDIO</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-[38px] lg:flex" aria-label="Primary navigation">
          {primaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b border-transparent pb-1 font-flsans text-[10px] font-medium uppercase tracking-[0.18em] text-[#403d38] transition-colors hover:border-fl-charcoal/50 hover:text-fl-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4",
                  active && "border-fl-charcoal text-fl-charcoal",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 text-fl-charcoal focus-visible:outline focus-visible:outline-2 lg:hidden"
        >
          <span className={cn("h-px w-6 bg-current transition-transform", open && "translate-y-[3.5px] rotate-45")} />
          <span className={cn("h-px w-6 bg-current transition-opacity", open && "opacity-0")} />
          <span className={cn("h-px w-6 bg-current transition-transform", open && "-translate-y-[3.5px] -rotate-45")} />
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-navigation"
          className="border-t border-fl-charcoal/10 bg-fl-paper px-6 pb-7 sm:px-10 lg:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="divide-y divide-fl-charcoal/10">
            {mobileNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-4 font-flsans text-xs font-medium uppercase tracking-[0.18em] text-[#403d38] hover:text-fl-charcoal"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
