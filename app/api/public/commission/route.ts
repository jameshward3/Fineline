import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const intakeSchema = z.object({
  idempotencyKey: z.string().min(8).max(200),
  project: z.string().min(1).max(120),
  idea: z.string().max(12000).optional().default(""),
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(80).optional().default(""),
  organization: z.string().max(240).optional().default(""),
  artwork: z
    .object({
      url: z.string().url().max(2000),
      pathname: z.string().min(1).max(1000),
      fileName: z.string().min(1).max(500),
      fileFormat: z.string().max(50).optional().default("unknown"),
      fileSizeBytes: z.number().int().min(0).max(20 * 1024 * 1024),
    })
    .nullable()
    .optional(),
});

function accountType(projectType: string) {
  if (projectType === "Institutional Program") return "SCHOOL_EDUCATION" as const;
  if (projectType === "Corporate Gifting") return "CORPORATE" as const;
  if (projectType === "Home and Table") return "LUXURY_RESIDENTIAL" as const;
  return "INDIVIDUAL" as const;
}

function jobNumberFor(idempotencyKey: string) {
  return `WEB-${crypto
    .createHash("sha256")
    .update(idempotencyKey)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase()}`;
}

function authorized(request: NextRequest) {
  const expected = process.env.STITCHOS_INTAKE_SECRET;
  if (!expected) return false;
  const supplied = request.headers.get("x-stitchos-intake-secret") ?? "";
  if (supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = intakeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid commission submission.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const email = data.email.trim().toLowerCase();
  const jobNumber = jobNumberFor(data.idempotencyKey);

  try {
    const existing = await prisma.job.findUnique({
      where: { jobNumber },
      select: { id: true, jobNumber: true, clientId: true },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        orderId: existing.id,
        orderReference: existing.jobNumber,
        clientId: existing.clientId,
        duplicate: true,
      });
    }

    const organization = await prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!organization) throw new Error("No StitchOS organization is configured");

    const owner = await prisma.user.findFirst({
      where: { organizationId: organization.id, active: true },
      orderBy: [{ createdAt: "asc" }],
      select: { id: true },
    });
    if (!owner) throw new Error("No active StitchOS user is configured");

    const result = await prisma.$transaction(async (tx) => {
      const existingClient = await tx.client.findFirst({
        where: {
          organizationId: organization.id,
          email: { equals: email, mode: "insensitive" },
          active: true,
        },
        orderBy: { updatedAt: "desc" },
      });

      const client = existingClient
        ? await tx.client.update({
            where: { id: existingClient.id },
            data: {
              contactName: data.name,
              phone: data.phone || existingClient.phone,
              name: data.organization || existingClient.name,
              leadSource: "fineligne.co",
            },
          })
        : await tx.client.create({
            data: {
              organizationId: organization.id,
              name: data.organization || data.name,
              contactName: data.name,
              email,
              phone: data.phone || null,
              notes: data.idea || null,
              accountType: accountType(data.project),
              leadSource: "fineligne.co",
              relationshipOwnerId: owner.id,
            },
          });

      const contact = await tx.contact.findFirst({
        where: { clientId: client.id, email: { equals: email, mode: "insensitive" } },
      });
      if (!contact) {
        await tx.contact.create({
          data: {
            clientId: client.id,
            name: data.name,
            role: "PRIMARY",
            email,
            phone: data.phone || null,
          },
        });
      }

      const opportunity = await tx.opportunity.create({
        data: {
          organizationId: organization.id,
          clientId: client.id,
          name: `${data.project} — ${data.name}`,
          stage: "INQUIRY",
          nextAction:
            "Review web commission intake and confirm scope, artwork, placement, quantity, and timeline.",
        },
      });

      const design = await tx.design.create({
        data: {
          organizationId: organization.id,
          clientId: client.id,
          collection: data.project,
          name: `${data.name} — ${data.project}`,
        },
      });

      const version = await tx.designVersion.create({
        data: {
          designId: design.id,
          versionNumber: 1,
          status: "DRAFT",
          changeNotes: data.idea || "Created from fineligne.co commission intake.",
          createdById: owner.id,
        },
      });

      if (data.artwork) {
        await tx.artworkAsset.create({
          data: {
            designVersionId: version.id,
            stage: "SOURCE",
            storageKey: data.artwork.pathname,
            url: data.artwork.url,
            fileName: data.artwork.fileName,
            fileFormat: data.artwork.fileFormat,
            fileSizeBytes: data.artwork.fileSizeBytes,
          },
        });
      }

      const job = await tx.job.create({
        data: {
          organizationId: organization.id,
          jobNumber,
          clientId: client.id,
          status: "ARTWORK_RECEIVED",
          createdById: owner.id,
        },
      });

      const noteBody = [
        "Public commission intake from fineligne.co",
        `Project type: ${data.project}`,
        data.organization ? `Organization: ${data.organization}` : "",
        data.phone ? `Phone: ${data.phone}` : "",
        data.idea ? `Idea: ${data.idea}` : "",
        data.artwork?.url ? `Inspiration: ${data.artwork.url}` : "",
        `Opportunity: ${opportunity.id}`,
        `Design: ${design.id}`,
      ]
        .filter(Boolean)
        .join("\n");

      await tx.note.createMany({
        data: [
          { entityType: "CLIENT", entityId: client.id, authorId: owner.id, body: noteBody },
          { entityType: "JOB", entityId: job.id, authorId: owner.id, body: noteBody },
        ],
      });

      return { client, opportunity, design, job };
    });

    return NextResponse.json(
      {
        ok: true,
        orderId: result.job.id,
        orderReference: result.job.jobNumber,
        clientId: result.client.id,
        opportunityId: result.opportunity.id,
        designId: result.design.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Public commission intake failed", error);
    return NextResponse.json(
      { error: "The studio order system is temporarily unavailable." },
      { status: 502 },
    );
  }
}
