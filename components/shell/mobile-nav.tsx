"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { navItems } from "./nav-items";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 -ml-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-raised"
        aria-label="Toggle navigation"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="fixed inset-0 top-14 z-40 bg-canvas/95 backdrop-blur">
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink hover:bg-surface-raised"
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
