import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import { brand } from "@/lib/branding";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const flSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-fl-serif",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${brand.companyName} — Imagined Luxury. Actualized.`,
  description:
    "Fine Ligne Studio transforms an idea, a monogram, a crest, an identity into thread and fabric. Institutional uniforms, corporate gifting, and luxury monogramming, embroidered with precision.",
  icons: { icon: brand.favicon },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${flSerif.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
