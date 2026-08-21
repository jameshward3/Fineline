import Image from "next/image";
import Link from "next/link";
import { categories, processSteps } from "@/lib/marketing/content";

const collectionImages = ["/marketing/uniform.png", "/marketing/corporate.png", "/marketing/monogram.png", "/marketing/linens.png", "/marketing/carried.png", "/marketing/wardrobe.png"];

export function Homepage({ id = "home" }: { id?: string }) {
  return (
    <div id={id} className="bg-[#f6f2ec] text-[#1a1a1a]">
      <section className="relative min-h-[620px] overflow-hidden lg:min-h-[672px]">
        <Image src="/marketing/hero.png" alt="Fine Line Studio embroidery detail" fill priority className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f6f2ec]/95 via-[#f6f2ec]/55 to-transparent lg:w-[62%]" />
        <div className="relative mx-auto max-w-[1440px] px-6 pb-16 pt-20 sm:px-10 lg:px-16 lg:pt-[116px]">
          <h1 className="max-w-[580px] font-serif text-[64px] font-light leading-[.96] tracking-[-.02em] sm:text-[82px] lg:text-[104px]">Made<br />personal.</h1>
          <div className="ml-0.5 mt-8 h-0.5 w-12 bg-[#b28d6b]" />
          <p className="mt-7 max-w-[440px] text-[16px] leading-7 text-[#3a3833]">Every piece begins as an idea — a monogram, a crest, a mark that belongs to you. We translate it into thread, and hand it back as something you can hold.</p>
          <div className="mt-8 flex flex-wrap gap-3.5"><Link href="/collections" className="bg-[#1a1a1a] px-7 py-4 text-[11px] font-medium tracking-[.16em] text-[#f6f2ec] transition hover:bg-[#403d38]">EXPLORE COLLECTIONS&nbsp;&nbsp;→</Link><Link href="/start" className="border border-[#1a1a1a]/15 px-7 py-4 text-[11px] font-medium tracking-[.16em] transition hover:border-[#1a1a1a]">START AN ORDER</Link></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-24 sm:px-10 lg:px-16 lg:py-[120px]">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end"><div><p className="text-[10px] font-medium tracking-[.22em] text-[#8b8276]">COLLECTIONS</p><h2 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-[56px]">Six ways to begin.</h2></div><p className="max-w-[560px] text-base leading-7 text-[#3a3833]">From a single monogram to a full institutional program — every collection starts with your idea, not our catalog.</p></div>
        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => <Link href={category.href} key={category.slug} className="group text-center"><div className="relative aspect-[416/333] overflow-hidden bg-[#d8cdbe]"><Image src={collectionImages[index]} alt={category.kicker} fill className="object-cover transition duration-700 group-hover:scale-[1.025]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" /></div><h3 className="mt-6 font-serif text-xl">{category.kicker}</h3><p className="mt-2 text-[9px] font-medium tracking-[.2em] text-[#8b8276]">{category.name.toUpperCase()}</p><p className="mt-4 text-[10px] font-medium tracking-[.18em]">VIEW COLLECTION&nbsp;&nbsp;→</p></Link>)}
        </div>
      </section>

      <section className="relative h-[400px] overflow-hidden text-[#f6f2ec]"><Image src="/marketing/dark-band.png" alt="Embroidery machine detail" fill className="object-cover" sizes="100vw" /><div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" /><div className="relative mx-auto max-w-[1440px] px-6 py-[70px] sm:px-10 lg:px-16"><p className="text-[10px] font-medium tracking-[.22em]">IT BEGINS WITH A LINE</p><h2 className="mt-5 max-w-[300px] font-serif text-5xl font-light leading-[1.05]">It begins<br />with a line.</h2><p className="mt-7 max-w-[190px] font-serif text-lg leading-7">Translated into thread. Made tangible.</p></div></section>

      <section className="relative flex min-h-[520px] items-end overflow-hidden text-[#f6f2ec] lg:min-h-[600px]"><Image src="/marketing/divider.png" alt="A continuous embroidered line" fill className="object-cover" sizes="100vw" /><div className="absolute inset-0 bg-[#2d261f]/30" /><div className="relative mx-auto flex w-full max-w-[1440px] justify-end px-6 pb-20 sm:px-10 lg:px-16 lg:pb-28"><div className="max-w-[400px]"><h2 className="font-serif text-5xl font-light leading-tight">Imagined luxury.<br />Actualized.</h2><p className="mt-4 text-sm">Your idea. Made permanent in thread.</p><Link href="/start" className="mt-6 inline-block border border-white/40 bg-[#1a1a1a] px-7 py-4 text-[11px] font-medium tracking-[.16em]">START YOUR JOURNEY&nbsp;&nbsp;→</Link></div></div></section>

      <section className="mx-auto max-w-[1440px] px-6 py-24 sm:px-10 lg:px-16 lg:py-[120px]"><p className="text-[10px] font-medium tracking-[.22em] text-[#8b8276]">OUR PROCESS</p><h2 className="mt-4 font-serif text-5xl font-light tracking-tight sm:text-[56px]">From idea to object.</h2><p className="mt-4 font-serif text-xl text-[#3a3833]">A considered process. A personal experience.</p><ol className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">{processSteps.map((step) => <li key={step.number} className="border-t border-[#1a1a1a]/15 pt-6"><p className="font-serif text-4xl font-light">{step.number}</p><h3 className="mt-3 font-serif text-xl">{step.title}</h3><p className="mt-2 text-sm leading-6 text-[#3a3833]">{step.body}</p></li>)}</ol></section>

      <div className="relative h-[200px] overflow-hidden"><Image src="/marketing/divider.png" alt="Fine Line thread motif" fill className="object-cover" sizes="100vw" /></div>
      <section className="mx-auto grid max-w-[1440px] gap-8 px-6 py-24 sm:px-10 lg:grid-cols-2 lg:px-16 lg:py-[120px]"><div><p className="text-[10px] font-medium tracking-[.22em] text-[#8b8276]">START A COMMISSION</p><h2 className="mt-4 max-w-[620px] font-serif text-6xl font-light leading-[1.02] sm:text-7xl">See your mark<br />in thread.</h2></div><div className="flex items-end"><div><p className="max-w-md text-base leading-7 text-[#3a3833]">Upload an idea and begin a considered, studio-led embroidery process.</p><Link href="/start" className="mt-7 inline-block bg-[#1a1a1a] px-8 py-4 text-[11px] font-medium tracking-[.18em] text-[#f6f2ec]">CONFIGURE YOUR EMBROIDERY&nbsp;&nbsp;→</Link></div></div></section>
    </div>
  );
}
