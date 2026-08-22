import type { Metadata } from "next";
import { categories } from "@/lib/marketing/content";
import { CategoryDetail } from "@/components/marketing/CategoryDetail";
import { ToteShape } from "@/components/story/marks";

export const metadata: Metadata = {
  title: "Corporate Gifting — Fine Line Studio",
  description: "Recipient-personalized gifting at scale, for teams who want the scale to be invisible.",
};

export default function CorporatePage() {
  const category = categories.find((c) => c.slug === "corporate")!;
  return (
    <CategoryDetail
      category={category}
      intro="Executive gifts, employee milestones, event welcome bags — each recipient's name or initials, placed with the same care whether the run is twelve pieces or twelve hundred."
      visual={
        <svg viewBox="-140 -200 280 400" className="h-64 w-64 text-fl-charcoal sm:h-80 sm:w-80">
          <ToteShape id="corporate-tote" />
        </svg>
      }
    />
  );
}
