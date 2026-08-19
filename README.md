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
  upgraded independently. `lib/services/stitch-engine` is an explicit
  boundary for a future DST/PES/EXP/JEF stitch-generation engine — it is not
  implemented; STITCH OS currently prepares artwork for a human digitizer in
  InStitch, not raw stitch files.
- **Object/blob storage** is behind `lib/services/storage`, with a local
  filesystem implementation for development.
- **Branding** is centralized in `lib/branding.ts` — nothing else hard-codes
  company name, logo, or brand colors.
