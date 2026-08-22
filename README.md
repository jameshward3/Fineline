# STITCH OS

Artwork-to-Embroidery Production System for Fine Line Studio — converts AI-generated
or source artwork into cleaned, color-controlled, embroidery-prepared production
packages, and manages the studio's client relationships (accounts, programs,
opportunities, samples, monogram profiles) end to end.

## Stack

Next.js (App Router) · TypeScript · Tailwind · PostgreSQL + Prisma 7 · NextAuth ·
client-side Canvas image processing · imagetracerjs (vectorization) ·
@react-pdf/renderer (production sheets) · JSZip (InStitch export packages)

## Setup

```bash
npm install                 # also runs `prisma generate` via postinstall
cp .env.example .env        # point DATABASE_URL at a local PostgreSQL instance
npm run db:migrate          # apply schema
npm run db:seed             # sample org, threads, machine, products, CRM demo data
npm run dev
```

Seeded demo login: `admin@stitchos.dev` / `stitchos-dev` (also `designer@`,
`operator@`, `viewer@` with the same password, for each role).

## Architecture notes

- **Image processing / vectorization / stitch-engine / AI assistant / export**
  live behind interfaces in `lib/services/*` so each engine can be swapped or
  upgraded independently. `lib/services/stitch-engine` generates real Tajima
  DST stitch files directly from a design's VectorObjects and their assigned
  stitch types (running/satin/tatami), sequenced and color-change-separated
  in sewing order — an original TypeScript implementation of the public DST
  format, not a port of any existing embroidery library. It's a
  first-generation automatic digitizer for clean, simple artwork, not a
  replacement for expert hand-digitizing of complex designs — generation is
  blocked (not silently skipped) if any object still needs its stitch type
  assigned. PES/EXP/JEF/XXX are defined on the interface but not yet
  implemented. STITCH OS still also prepares separated, annotated artwork
  for a human digitizer in InStitch for anything that needs one.
- **Object/blob storage** is behind `lib/services/storage`, with a local
  filesystem implementation for development.
- **Branding** is centralized in `lib/branding.ts` — nothing else hard-codes
  company name, logo, or brand colors.
