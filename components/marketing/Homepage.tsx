import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ConfiguratorUploadIntent } from "@/lib/configurator/upload-intent";
import { processSteps } from "@/lib/marketing/content";

const EmbroideryConfigurator = dynamic(() =>
  import("@/components/configurator/embroidery-configurator").then(
    (module) => module.EmbroideryConfigurator,
  ),
);

type HomepageProps = {
  id?: string;
  uploadIntent: ConfiguratorUploadIntent;
  blobStorageReady: boolean;
};

const collectionTiles = [
  {
    title: "Uniform & Program Embroidery",
    label: "Institutional & School",
    href: "/institutional",
    image: "/marketing/collection-institutional.png",
    position: "center 56%",
  },
  {
    title: "Executive & Employee Programs",
    label: "Corporate Gifting",
    href: "/corporate",
    image: "/marketing/collection-corporate.png",
    position: "center 52%",
  },
  {
    title: "Personal & Family Monogramming",
    label: "Monogram Atelier",
    href: "/monogram-atelier",
    image: "/marketing/collection-monogram.png",
    position: "center 48%",
  },
  {
    title: "Linens & Table",
    label: "Home & Table",
    href: "/collections#home",
    image: "/marketing/collection-home.png",
    position: "center 65%",
  },
  {
    title: "Carried Daily",
    label: "Bags & Accessories",
    href: "/collections#bags",
    image: "/marketing/collection-bags.png",
    position: "center 52%",
  },
  {
    title: "Wardrobe",
    label: "Apparel",
    href: "/collections#apparel",
    image: "/marketing/collection-apparel.png",
    position: "center 52%",
  },
] as const;

export function Homepage({ id = "home", uploadIntent, blobStorageReady }: HomepageProps) {
  return (
    <div id={id} className="bg-fl-paper text-fl-charcoal">
      <HeroSection />
      <CollectionsSection />
      <AtelierBand />
      <BrandPromise />
      <ProcessSection />
      <ThreadDivider />
      <section id="atelier" className="scroll-mt-24" aria-label="Interactive embroidery atelier">
        <EmbroideryConfigurator
          embedded
          headingLevel="h2"
          uploadIntent={uploadIntent}
          blobStorageReady={blobStorageReady}
        />
      </section>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative h-[672px] overflow-hidden bg-fl-paper" aria-labelledby="home-heading">
      <div className="absolute inset-x-0 top-0 h-[651px] overflow-hidden bg-[#d8cdbe]">
        <Image
          src="/marketing/hero-embroidery.png"
          alt="Fine Line embroidery taking shape beneath a multi-needle embroidery machine"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_76%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,242,236,0.92)_0%,rgba(246,242,236,0.84)_34%,rgba(246,242,236,0.38)_61%,rgba(246,242,236,0)_82%)]" />
      </div>

      <div className="relative mx-auto h-[651px] max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <div className="max-w-[580px] pt-[112px] sm:pt-[118px]">
          <h1
            id="home-heading"
            className="font-display text-[64px] font-normal leading-[0.98] tracking-[-0.02em] text-fl-charcoal sm:text-[82px] lg:text-[104px]"
          >
            Made
            <br />
            personal.
          </h1>
          <div className="ml-0.5 mt-8 h-0.5 w-[46px] bg-[#b28d6b]" />
          <p className="mt-7 max-w-[437px] font-flsans text-[15px] leading-7 text-[#3a3833] sm:text-base">
            Every piece begins as an idea — a monogram, a crest, a mark that belongs to you. We
            translate it into thread, and hand it back as something you can hold.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link
              href="/collections"
              className="inline-flex h-12 items-center gap-3 bg-fl-charcoal px-7 font-flsans text-[11px] font-medium uppercase tracking-[0.16em] text-fl-paper transition-colors hover:bg-[#403d38] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Explore collections <span aria-hidden>→</span>
            </Link>
            <Link
              href="/configure"
              className="inline-flex h-12 items-center border border-fl-charcoal/15 px-7 font-flsans text-[11px] font-medium uppercase tracking-[0.16em] text-fl-charcoal transition-colors hover:border-fl-charcoal hover:bg-fl-paper/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Start an order
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CollectionsSection() {
  return (
    <section id="collections" className="scroll-mt-24 bg-fl-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-[120px]">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="font-flsans text-[10px] font-medium uppercase tracking-[0.22em] text-[#8b8276]">
              Collections
            </p>
            <h2 className="mt-4 font-display text-[42px] font-normal leading-[1.1] tracking-[-0.01em] sm:text-[56px]">
              Six ways to begin.
            </h2>
          </div>
          <p className="max-w-[560px] font-flsans text-[15px] leading-7 text-[#3a3833] lg:justify-self-end sm:text-base">
            From a single monogram to a full institutional program — every collection starts with
            your idea, not our catalog.
          </p>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-12">
          {collectionTiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
              <div className="relative aspect-[416/333] overflow-hidden bg-[#d8cdbe]">
                <Image
                  src={tile.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 29vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover transition duration-700 ease-fl-ease group-hover:scale-[1.025]"
                  style={{ objectPosition: tile.position }}
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="font-display text-[19px] leading-[26px] text-fl-charcoal">{tile.title}</h3>
                <p className="mt-2 font-flsans text-[9px] font-medium uppercase tracking-[0.2em] text-[#8b8276]">
                  {tile.label}
                </p>
                <span className="mt-4 inline-block border-b border-transparent pb-1 font-flsans text-[10px] font-medium uppercase tracking-[0.18em] transition-colors group-hover:border-fl-charcoal">
                  View collection&nbsp; →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AtelierBand() {
  return (
    <section className="relative h-[400px] overflow-hidden bg-fl-charcoal text-fl-paper">
      <Image
        src="/marketing/atelier-machines.png"
        alt="Fine Line Studio embroidery heads aligned for production"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,26,26,1)_0%,rgba(26,26,26,0.86)_30%,rgba(26,26,26,0.25)_64%,rgba(26,26,26,0)_100%)]" />
      <div className="relative mx-auto max-w-[1440px] px-6 pt-[70px] sm:px-10 lg:px-16">
        <p className="font-flsans text-[10px] font-medium uppercase tracking-[0.22em] text-fl-paper/60">
          It begins with a line
        </p>
        <h2 className="mt-5 font-display text-[44px] font-normal leading-[1.08] tracking-[-0.01em] sm:text-[56px]">
          It begins
          <br />
          with a line.
        </h2>
        <p className="mt-5 font-flsans text-sm leading-[26px] text-fl-paper/75">
          Translated into thread.
          <br />
          Made tangible.
        </p>
      </div>
    </section>
  );
}

function BrandPromise() {
  return (
    <section className="relative h-[600px] overflow-hidden bg-[#8a7a62] text-fl-paper">
      <Image
        src="/marketing/brand-thread-source-1.png"
        alt="Fine Line Studio thread-and-needle mark"
        fill
        sizes="100vw"
        className="object-cover object-[center_34%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,26,26,0.02)_25%,rgba(26,26,26,0.12)_58%,rgba(26,26,26,0.5)_100%)]" />
      <div className="relative mx-auto flex h-full max-w-[1440px] items-end justify-end px-6 pb-28 text-right sm:px-10 lg:px-16">
        <div className="max-w-[400px]">
          <h2 className="font-display text-[32px] font-normal leading-[42px] tracking-[0.04em]">
            Imagined luxury.
            <br />
            Actualized.
          </h2>
          <p className="mt-3 font-flsans text-xs text-fl-paper/85">Your idea. Made permanent in thread.</p>
          <Link
            href="/configure"
            className="mt-6 inline-flex h-[52px] items-center gap-3 bg-fl-charcoal px-7 font-flsans text-[11px] font-medium uppercase tracking-[0.16em] text-fl-paper transition-colors hover:bg-[#403d38] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Start your journey <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section id="process" className="scroll-mt-24 bg-fl-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 sm:py-24 lg:min-h-[594px] lg:px-16 lg:py-[120px]">
        <p className="font-flsans text-[10px] font-medium uppercase tracking-[0.22em] text-[#8b8276]">Our process</p>
        <h2 className="mt-4 font-display text-[42px] font-normal leading-[1.1] tracking-[-0.01em] sm:text-[56px]">
          From idea to object.
        </h2>
        <p className="mt-2 font-flsans text-[15px] leading-7 text-[#3a3833] sm:text-base">
          A considered process. A personal experience.
        </p>

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {processSteps.map((step) => (
            <li key={step.number} className="border-t border-fl-charcoal/15 pt-5">
              <span className="font-display text-[34px] leading-none tracking-[0.02em]">{step.number}</span>
              <h3 className="mt-4 font-display text-lg leading-[26px]">{step.title}</h3>
              <p className="mt-1.5 max-w-56 font-flsans text-[13.5px] leading-6 text-[#54514a]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ThreadDivider() {
  return (
    <div className="relative h-[200px] overflow-hidden bg-[#ede6dd]" aria-hidden>
      <Image src="/marketing/thread-divider.png" alt="" fill sizes="100vw" className="object-cover" />
    </div>
  );
}
