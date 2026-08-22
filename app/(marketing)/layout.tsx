import { SiteFooter } from "@/components/marketing/SiteFooter";

/**
 * Shared chrome for the public marketing site: warm-neutral background,
 * shared footer. The header is deliberately NOT included here — the
 * homepage places it itself, right after the cinematic intro, so the
 * intro plays full-bleed with no site chrome above it (per the brief:
 * "No large navigation... let the logo breathe"). Every other marketing
 * page renders <SiteHeader/> at the top of its own content instead.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-fl-paper font-sans text-fl-ink">
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
