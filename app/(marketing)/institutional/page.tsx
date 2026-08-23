import type { Metadata } from "next";
import { categories } from "@/lib/marketing/content";
import { CategoryDetail } from "@/components/marketing/CategoryDetail";
import { ShirtShape } from "@/components/story/marks";

export const metadata: Metadata = {
  title: "Institutional & School — Fine Line Studio",
  description: "Crest-approved uniform programs for schools and institutions, embroidered to last.",
};

export default function InstitutionalPage() {
  const category = categories.find((c) => c.slug === "institutional")!;
  return (
    <CategoryDetail
      category={category}
      intro="A uniform program is a promise made a thousand times a day. We build approved crest libraries, hold your specification, and deliver consistent embroidery from the first order to the thousandth."
      visual={
        <svg viewBox="-160 -200 320 420" className="h-64 w-64 text-fl-charcoal sm:h-80 sm:w-80">
          <ShirtShape id="institutional-shirt" />
        </svg>
      }
    />
  );
}
