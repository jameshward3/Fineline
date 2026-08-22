import type { Metadata } from "next";
import { categories } from "@/lib/marketing/content";
import { CategoryDetail } from "@/components/marketing/CategoryDetail";
import { MonogramGlyph } from "@/components/story/marks";

export const metadata: Metadata = {
  title: "Monogram Atelier — Fine Line Studio",
  description: "A single set of initials, placed with the same care as a full identity program.",
};

export default function MonogramAtelierPage() {
  const category = categories.find((c) => c.slug === "monogram-atelier")!;
  return (
    <CategoryDetail
      category={category}
      intro="Three initials. One family crest. A robe for someone who has everything. The atelier is where Fine Line Studio slows down for a single, personal commission."
      visual={
        <svg viewBox="-48 -35 64 64" className="h-40 w-40 text-fl-gold sm:h-52 sm:w-52">
          <MonogramGlyph id="atelier-monogram" className="fill-current stroke-current" />
        </svg>
      }
    />
  );
}
