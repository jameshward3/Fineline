import { SiteHeader } from "./SiteHeader";

/** Wraps every non-home marketing page with the standard header. The
 *  homepage places SiteHeader itself, after the cinematic intro. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
