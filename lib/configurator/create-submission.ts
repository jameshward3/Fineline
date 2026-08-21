import crypto from "node:crypto";
import { head } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { calculateConfiguratorQuote } from "./pricing";
import type { ConfiguratorSubmissionInput } from "./schema";
import { getPublicStudioContext } from "./server-context";
import { normalizePhoneNumber, phoneLookupCandidates } from "@/lib/portal/phone";

export class ConfiguratorIntakeError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "ConfiguratorIntakeError";
  }
}

function accountType(projectType: ConfiguratorSubmissionInput["projectType"]) {
  if (projectType === "INSTITUTIONAL") return "SCHOOL_EDUCATION" as const;
  if (projectType === "CORPORATE") return "CORPORATE" as const;
  return "INDIVIDUAL" as const;
}

function jobNumberFor(idempotencyKey: string) {
  return `WEB-${crypto.createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 16).toUpperCase()}`;
}

async function verifyArtwork(input: ConfiguratorSubmissionInput["artwork"]) {
  if (!input.pathname.startsWith("configurator/")) {
    throw new ConfiguratorIntakeError("The artwork upload is not valid.");
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    if (process.env.NODE_ENV === "production") {
      throw new ConfiguratorIntakeError("Artwork storage is not configured.", 503);
    }
    return;
  }

  try {
    const blob = await head(input.url);
    if (blob.pathname !== input.pathname || blob.size !== input.fileSizeBytes) {
      throw new ConfiguratorIntakeError("The artwork upload could not be verified.");
    }
    if (blob.contentType && blob.contentType !== input.contentType) {
      throw new ConfiguratorIntakeError("The artwork file type does not match the upload.");
    }
  } catch (error) {
    if (error instanceof ConfiguratorIntakeError) throw error;
    throw new ConfiguratorIntakeError("The artwork upload could not be verified.");
  }
}

export async function createConfiguratorSubmission(data: ConfiguratorSubmissionInput) {
  const elapsed = Date.now() - data.startedAt;
  if (elapsed < 1_500 || elapsed > 48 * 60 * 60 * 1000) {
    throw new ConfiguratorIntakeError("Please refresh the configurator and try again.");
  }

  await verifyArtwork(data.artwork);

  const quote = calculateConfiguratorQuote({
    widthInches: data.configuration.widthInches,
    heightInches: data.configuration.heightInches,
    quantity: data.configuration.quantity,
    colorCount: data.configuration.colors.length,
    densityMm: data.configuration.densityMm,
    threadWeight: data.configuration.threadWeight,
    borderStyle: data.configuration.border.style,
    borderWidthMm: data.configuration.border.widthMm,
    productCategory: data.configuration.productCategory,
  });

  const existing = await prisma.configuratorSubmission.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    select: { id: true, job: { select: { id: true, jobNumber: true } }, clientId: true, opportunityId: true, designId: true },
  });
  if (existing) {
    return {
      duplicate: true,
      submissionId: existing.id,
      orderId: existing.job.id,
      orderReference: existing.job.jobNumber,
      clientId: existing.clientId,
      opportunityId: existing.opportunityId,
      designId: existing.designId,
      quote,
    };
  }

  const { organizationId, ownerId } = await getPublicStudioContext();
  const email = data.customer.email.toLowerCase();
  const phone = normalizePhoneNumber(data.customer.phone);
  if (!phone) throw new ConfiguratorIntakeError("Enter a valid mobile number.");
  const phoneCandidates = phoneLookupCandidates(phone);
  const jobNumber = jobNumberFor(data.idempotencyKey);

  return prisma.$transaction(async (tx) => {
    const existingClient = await tx.client.findFirst({
      where: {
        organizationId,
        active: true,
        OR: [
          { phone: { in: phoneCandidates } },
          { contacts: { some: { phone: { in: phoneCandidates } } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    const client = existingClient
      ? await tx.client.update({
          where: { id: existingClient.id },
          data: {
            contactName: data.customer.name,
            email,
            phone,
            name: data.customer.organization || existingClient.name,
            leadSource: "fineligne.co/configure",
          },
        })
      : await tx.client.create({
          data: {
            organizationId,
            name: data.customer.organization || data.customer.name,
            contactName: data.customer.name,
            email,
            phone,
            notes: data.configuration.notes || null,
            accountType: accountType(data.projectType),
            leadSource: "fineligne.co/configure",
            relationshipOwnerId: ownerId,
          },
        });

    const contact = await tx.contact.findFirst({
      where: {
        clientId: client.id,
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { phone: { in: phoneCandidates } },
        ],
      },
      select: { id: true },
    });
    if (contact) {
      await tx.contact.update({
        where: { id: contact.id },
        data: { name: data.customer.name, role: "PRIMARY", email, phone },
      });
    } else {
      await tx.contact.create({
        data: {
          clientId: client.id,
          name: data.customer.name,
          role: "PRIMARY",
          email,
          phone,
        },
      });
    }

    const [product, threadColors] = await Promise.all([
      data.configuration.productId
        ? tx.product.findFirst({
            where: { id: data.configuration.productId, organizationId },
            include: { locations: true },
          })
        : Promise.resolve(null),
      tx.threadColor.findMany({
        where: {
          organizationId,
          active: true,
          id: { in: data.configuration.colors.flatMap((color) => color.threadColorId ? [color.threadColorId] : []) },
        },
        select: { id: true },
      }),
    ]);
    const validThreadIds = new Set(threadColors.map((color) => color.id));
    const location = product?.locations.find((item) => item.id === data.configuration.locationId) ?? null;

    const opportunity = await tx.opportunity.create({
      data: {
        organizationId,
        clientId: client.id,
        name: `${data.configuration.designName} — web configuration`,
        stage: "INQUIRY",
        potentialValue: quote.total,
        nextAction: "Review uploaded artwork, production feasibility, placement, and server-calculated estimate.",
      },
    });

    const design = await tx.design.create({
      data: {
        organizationId,
        clientId: client.id,
        collection: data.projectType,
        name: data.configuration.designName,
      },
    });

    const version = await tx.designVersion.create({
      data: {
        designId: design.id,
        versionNumber: 1,
        status: "DRAFT",
        changeNotes: data.configuration.notes || "Created from the Fine Line public embroidery configurator.",
        createdById: ownerId,
        widthInches: data.configuration.widthInches,
        heightInches: data.configuration.heightInches,
        targetColorCount: data.configuration.colors.length,
        readinessClassification: "Client preview — studio review required",
      },
    });

    const artworkUrl = `/api/files/${data.artwork.pathname}`;
    const asset = await tx.artworkAsset.create({
      data: {
        designVersionId: version.id,
        stage: "SOURCE",
        storageKey: data.artwork.pathname,
        url: artworkUrl,
        fileName: data.artwork.fileName,
        fileFormat: data.artwork.contentType,
        fileSizeBytes: data.artwork.fileSizeBytes,
        widthPx: data.artwork.widthPx ?? null,
        heightPx: data.artwork.heightPx ?? null,
      },
    });
    await tx.designVersion.update({ where: { id: version.id }, data: { sourceAssetId: asset.id } });

    await tx.designColorMapping.createMany({
      data: data.configuration.colors.map((color) => ({
        designVersionId: version.id,
        sequence: color.sequence,
        artworkColorHex: color.sourceHex,
        threadColorId: color.threadColorId && validThreadIds.has(color.threadColorId) ? color.threadColorId : null,
      })),
    });

    const job = await tx.job.create({
      data: {
        organizationId,
        jobNumber,
        clientId: client.id,
        status: "ARTWORK_RECEIVED",
        estimatedValue: quote.total,
        createdById: ownerId,
      },
    });

    if (product) {
      await tx.jobItem.create({
        data: {
          jobId: job.id,
          designId: design.id,
          designVersionId: version.id,
          productId: product.id,
          locationId: location?.id ?? null,
          garmentColor: data.configuration.garmentColorHex,
          quantity: data.configuration.quantity,
        },
      });
      await tx.designProductSetup.create({
        data: {
          designId: design.id,
          designVersionId: version.id,
          productId: product.id,
          locationId: location?.id ?? null,
        },
      });
    }

    const noteBody = [
      "Public embroidery configuration from fineligne.co/configure",
      `Product: ${data.configuration.productName}`,
      `Placement: ${data.configuration.placementName}`,
      `Size: ${data.configuration.widthInches.toFixed(2)} × ${data.configuration.heightInches.toFixed(2)} in`,
      `Quantity: ${data.configuration.quantity}`,
      `Thread: ${data.configuration.threadWeight}; ${data.configuration.stitchStyle}; density ${data.configuration.densityMm.toFixed(2)} mm`,
      `Colors: ${data.configuration.colors.map((color) => `${color.threadName} (${color.targetHex})`).join(", ")}`,
      `Border: ${data.configuration.border.style}`,
      `Estimate: $${quote.total.toFixed(2)} (${quote.version}; studio confirmation required)`,
      `Artwork: ${artworkUrl}`,
      data.configuration.notes ? `Client notes: ${data.configuration.notes}` : "",
      `Opportunity: ${opportunity.id}`,
      `Design: ${design.id}`,
    ].filter(Boolean).join("\n");

    await tx.note.createMany({
      data: [
        { entityType: "CLIENT", entityId: client.id, authorId: ownerId, body: noteBody },
        { entityType: "JOB", entityId: job.id, authorId: ownerId, body: noteBody },
        { entityType: "DESIGN", entityId: design.id, authorId: ownerId, body: noteBody },
      ],
    });

    const submission = await tx.configuratorSubmission.create({
      data: {
        organizationId,
        clientId: client.id,
        designId: design.id,
        designVersionId: version.id,
        opportunityId: opportunity.id,
        jobId: job.id,
        idempotencyKey: data.idempotencyKey,
        projectType: data.projectType,
        configuration: data.configuration,
        pricing: { ...quote },
        artwork: data.artwork,
        customerMessage: data.configuration.notes || null,
      },
    });

    return {
      duplicate: false,
      submissionId: submission.id,
      orderId: job.id,
      orderReference: job.jobNumber,
      clientId: client.id,
      opportunityId: opportunity.id,
      designId: design.id,
      quote,
    };
  });
}
