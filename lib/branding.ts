/**
 * Central branding configuration.
 *
 * Nothing else in the app should hard-code the company name, product name,
 * tagline, logo, or brand colors — import `brand` instead. When the real
 * company identity is finalized, update this file only.
 */

export const brand = {
  companyName: "Fine Ligne Studio",
  productName: "STITCH OS",
  productSubtitle: "Artwork-to-Embroidery Production System",
  tagline: "Imagined luxury, actualized.",

  // Supplied Fine Ligne identity system. Keep these paths centralized so
  // public, portal, and internal surfaces always use the same approved art.
  logo: "/branding/fine-ligne-logo-dark.png",
  logoDark: "/branding/fine-ligne-logo-dark.png",
  logoMark: "/branding/fine-ligne-brand-mark.png",
  logoBadge: "/branding/fine-ligne-secondary-stacked.png",
  wordmark: "/branding/fine-ligne-wordmark.png",
  embroideredLogo: "/branding/fine-ligne-embroidered-logo.png",
  favicon: "/branding/fine-ligne-favicon.png",

  colors: {
    primary: "#C9A227",
    secondary: "#F2EDE1",
    accent: "#22C55E",
    ink: "#1A1A1A",
    paper: "#F7F3EC",
  },

  loginScreen: {
    heading: "Fine Ligne Studio",
    subheading: "STITCH OS — Artwork-to-Embroidery Production System",
    footer: "Internal production platform — authorized personnel only.",
  },

  export: {
    productionSheetFooter: "Prepared by Fine Ligne Studio with STITCH OS — Artwork-to-Embroidery Production System",
    watermark: null as string | null,
  },
} as const;

export type Brand = typeof brand;
