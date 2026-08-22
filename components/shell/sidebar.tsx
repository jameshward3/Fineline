"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { brand } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-surface">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="relative h-[52px] w-[146px] overflow-hidden">
          <Image
            src={brand.logoDark}
            alt={brand.companyName}
            fill
            sizes="146px"
            className="object-contain"
            priority
          />
          <span className="pointer-events-none absolute left-0 top-0 h-3 w-[52px] bg-gradient-to-r from-surface via-surface to-transparent" />
        </div>
      </div>

      <div className="p-3">
        <Link
          href="/designs/new"
          className="flex items-center justify-center gap-1.5 w-full rounded-md bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-medium py-2 transition-colors"
        >
          <PlusCircle size={16} />
          New Design
        </Link>
      </div>

      <nav className="flex-1 px-2 pb-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-surface-raised text-ink font-medium"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised/60"
              )}
            >
              <Icon size={17} strokeWidth={2} className={active ? "text-accent" : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <p className="text-[11px] text-ink-faint leading-relaxed">
          {brand.companyName} · {brand.productSubtitle}
        </p>
      </div>
    </aside>
  );
}
