import Link from "next/link";
import { BrandWordmark } from "@/components/marketing/BrandWordmark";
import { primaryNav, utilityNav } from "@/lib/marketing/content";

const studioLinks = [...utilityNav, { label: "About", href: "/about" }];

export function SiteFooter() {
  return (
    <footer className="border-t border-fl-charcoal/10 bg-fl-paper text-[#403d38]">
      <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-20 sm:px-10 lg:px-16 lg:pb-[90px] lg:pt-24">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-16">
          <div>
            <BrandWordmark />
            <p className="mt-6 font-display text-[15px] leading-6">Imagined Luxury. Actualized.</p>
          </div>

          <FooterColumn title="Explore" links={primaryNav} />
          <FooterColumn title="Studio" links={studioLinks} />

          <div>
            <h2 className="font-flsans text-[10px] font-medium uppercase tracking-[0.2em] text-[#8b8276]">
              Correspondence
            </h2>
            <div className="mt-6 space-y-2.5 font-flsans text-[13.5px] leading-[22px]">
              <a href="mailto:studio@finelinestudio.com" className="transition-colors hover:text-fl-charcoal">
                studio@finelinestudio.com
              </a>
              <p className="text-[#8b8276]">By appointment</p>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-fl-charcoal/10 pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-[86px]">
          <p className="font-flsans text-[11.5px] text-[#8b8276]">
            © {new Date().getFullYear()} Fine Ligne Studio. Every idea begins with a line.
          </p>
          <p className="font-flsans text-[10px] font-medium uppercase tracking-[0.16em] text-[#8b8276]">
            Privacy&nbsp;&nbsp;&nbsp;&nbsp; Terms
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: ReadonlyArray<{ label: string; href: string }> }) {
  return (
    <div>
      <h2 className="font-flsans text-[10px] font-medium uppercase tracking-[0.2em] text-[#8b8276]">{title}</h2>
      <ul className="mt-6 space-y-2.5">
        {links.map((item) => (
          <li key={`${title}-${item.href}-${item.label}`}>
            <Link
              href={item.href}
              className="font-flsans text-[13.5px] leading-[22px] transition-colors hover:text-fl-charcoal"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
