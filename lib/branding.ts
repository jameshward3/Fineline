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

  // Horizontal lockup (light ink, transparent) — dark chrome: sidebar, topbar.
  logo: "/branding/logo.svg",
  // Icon-only mark (light ink, transparent) — compact contexts on dark chrome.
  logoMark: "/branding/mark.svg",
  // Full vertical badge lockup (dark ink on cream) — light/print contexts:
  // login screen, PDF production sheets, export document headers.
  logoBadge: "/branding/logo-badge.svg",
  favicon: "/branding/favicon.svg",

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
