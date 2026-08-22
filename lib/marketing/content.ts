/**
 * Content + navigation for the public Fine Ligne Studio marketing site.
 * Kept separate from `lib/branding.ts`, which governs the internal
 * STITCH OS production tool's identity.
 */

export type NavItem = {
  label: string;
  href: string;
};

export const primaryNav: NavItem[] = [
  { label: "Collections", href: "/collections" },
  { label: "Institutional", href: "/institutional" },
  { label: "Corporate", href: "/corporate" },
  { label: "Monogram Atelier", href: "/monogram-atelier" },
  { label: "Our Process", href: "/process" },
  { label: "About", href: "/about" },
];

export const utilityNav: NavItem[] = [
  { label: "Client Portal", href: "/orders/sign-in" },
  { label: "Start an Order", href: "/configure" },
];

export type Category = {
  slug: string;
  name: string;
  shortName: string;
  href: string;
  kicker: string;
  description: string;
  items: string[];
};

export const categories: Category[] = [
  {
    slug: "institutional",
    name: "Institutional & School",
    shortName: "Institutional",
    href: "/institutional",
    kicker: "Uniform & Program Embroidery",
    description:
      "Crest-approved uniform programs for schools and institutions, embroidered to a standard that survives a decade of Mondays.",
    items: [
      "Uniforms",
      "Oxford shirts",
      "Polos",
      "Sweaters",
      "Blazers & jackets",
      "Backpacks",
      "Athletics",
      "Faculty & staff",
      "Approved crest programs",
      "Parent ordering",
    ],
  },
  {
    slug: "corporate",
    name: "Corporate Gifting",
    shortName: "Corporate",
    href: "/corporate",
    kicker: "Executive & Employee Programs",
    description:
      "Recipient-personalized gifting at scale, for teams who want the scale to be invisible and the object to feel considered.",
    items: [
      "Executive gifts",
      "Employee gifting",
      "Event gifts",
      "Personalized bags",
      "Premium apparel",
      "Client gifts",
      "Recipient personalization",
      "Bulk programs",
    ],
  },
  {
    slug: "monogram-atelier",
    name: "Monogram Atelier",
    shortName: "Monogram Atelier",
    href: "/monogram-atelier",
    kicker: "Personal & Family Monogramming",
    description:
      "A single set of initials, placed with the same care as a full identity program. Our atelier for the personal commission.",
    items: [
      "Shirts",
      "Robes",
      "Towels",
      "Personal linens",
      "Handkerchiefs",
      "Gifts",
      "Initials",
      "Family monograms",
    ],
  },
  {
    slug: "home",
    name: "Home & Table",
    shortName: "Home & Table",
    href: "/collections#home",
    kicker: "Linens & Table",
    description:
      "The pieces that sit closest to daily life — bedding, bath, and table linens, marked quietly as your own.",
    items: [
      "Bed linens",
      "Sheets",
      "Pillowcases",
      "Towels",
      "Napkins",
      "Tea towels",
      "Table linens",
    ],
  },
  {
    slug: "bags",
    name: "Bags & Accessories",
    shortName: "Bags & Accessories",
    href: "/collections#bags",
    kicker: "Carried Daily",
    description:
      "Totes, travel, and everyday carry, built to hold a mark that only gets better with wear.",
    items: ["Totes", "Travel bags", "Backpacks", "Garment bags", "Pouches"],
  },
  {
    slug: "apparel",
    name: "Apparel",
    shortName: "Apparel",
    href: "/collections#apparel",
    kicker: "Wardrobe",
    description:
      "A secondary category, not the brand — button-downs and outerwear first, tees and hats when the occasion calls for it.",
    items: ["Button-downs", "Polos", "Outerwear", "Sweatshirts", "T-shirts", "Hats"],
  },
];

export const configuratorPaths = [
  {
    label: "School & Institutional",
    href: "/institutional",
    description: "A uniform program, a crest, an approved supplier list.",
  },
  {
    label: "Corporate Gifting",
    href: "/corporate",
    description: "Executive gifts, employee programs, an event on the calendar.",
  },
  {
    label: "Monogram Something",
    href: "/monogram-atelier",
    description: "One idea. One initial, or three. Something to hold.",
  },
  {
    label: "Home & Linens",
    href: "/collections#home",
    description: "Bedding, bath, and table, marked as your own.",
  },
  {
    label: "Apparel",
    href: "/collections#apparel",
    description: "Shirts and outerwear built to carry an identity well.",
  },
  {
    label: "Bags & Accessories",
    href: "/collections#bags",
    description: "Totes, travel, and everyday carry.",
  },
];

export const processSteps = [
  {
    number: "01",
    title: "The Idea",
    body: "A drawing, a monogram, a crest, a logo — sent as-is.",
  },
  {
    number: "02",
    title: "The Translation",
    body: "We convert the idea into stitch path, density and direction.",
  },
  {
    number: "03",
    title: "The Proof",
    body: "A sewn sample on the actual material before production.",
  },
  {
    number: "04",
    title: "The Production",
    body: "Precision embroidery on 15-needle heads, inspected by hand.",
  },
  {
    number: "05",
    title: "The Object",
    body: "Delivered as something you can hold — permanent in thread.",
  },
];
