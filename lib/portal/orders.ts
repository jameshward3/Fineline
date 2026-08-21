import type { JobStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { configuratorArtworkSchema, configuratorConfigurationSchema } from "@/lib/configurator/schema";

const STATUS_LABELS: Record<JobStatus, string> = {
  ARTWORK_RECEIVED: "Artwork received",
  ARTWORK_PROCESSING: "Artwork review",
  COLOR_REVIEW: "Color review",
  PRODUCTION_PREP: "Production planning",
  READY_FOR_INSTITCH: "Ready for digitizing",
  DIGITIZED: "Digitized",
  TEST_SEW: "Studio sew test",
  APPROVED: "Approved",
  PRODUCTION: "In production",
  COMPLETE: "Complete",
  ARCHIVED: "Archived",
};

const STATUS_PROGRESS: Record<JobStatus, number> = {
  ARTWORK_RECEIVED: 1,
  ARTWORK_PROCESSING: 1,
  COLOR_REVIEW: 1,
  PRODUCTION_PREP: 2,
  READY_FOR_INSTITCH: 2,
  DIGITIZED: 2,
  TEST_SEW: 2,
  APPROVED: 3,
  PRODUCTION: 3,
  COMPLETE: 4,
  ARCHIVED: 4,
};

function numberFrom(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function pricingRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

const portalOrderInclude = {
  configuratorSubmission: true,
  items: {
    include: {
      product: true,
      location: true,
      design: true,
      designVersion: {
        include: {
          sourceAsset: true,
          colorMappings: {
            include: { threadColor: true },
            orderBy: { sequence: "asc" as const },
          },
        },
      },
    },
  },
} as const;

type PortalJob = Awaited<ReturnType<typeof getRawPortalOrder>>;

async function getRawPortalOrder(clientId: string, reference: string) {
  return prisma.job.findFirst({
    where: { clientId, jobNumber: reference },
    include: portalOrderInclude,
  });
}

function toPortalOrder(job: NonNullable<PortalJob>) {
  const submission = job.configuratorSubmission;
  const parsedConfiguration = configuratorConfigurationSchema.safeParse(submission?.configuration);
  const configuration = parsedConfiguration.success ? parsedConfiguration.data : null;
  const parsedArtwork = configuratorArtworkSchema.safeParse(submission?.artwork);
  const artwork = parsedArtwork.success ? parsedArtwork.data : null;
  const pricing = pricingRecord(submission?.pricing);
  const item = job.items[0] ?? null;
  const quantity = configuration?.quantity ?? item?.quantity ?? 1;
  const total = numberFrom(pricing.total, job.estimatedValue ?? 0);
  const unitPrice = numberFrom(pricing.unitPrice, quantity > 0 ? total / quantity : total);
  const setupFee = numberFrom(pricing.setupFee);
  const artworkUrl = item?.designVersion.sourceAsset?.url
    ?? (artwork?.pathname ? `/api/files/${artwork.pathname}` : null);
  const colorMappings = configuration?.colors.map((color) => ({
    name: color.threadName,
    hex: color.targetHex,
    code: color.manufacturerCode,
  })) ?? item?.designVersion.colorMappings.map((color) => ({
    name: color.threadColor?.companyName ?? color.artworkColorHex,
    hex: color.threadColor?.hex ?? color.artworkColorHex,
    code: color.threadColor?.manufacturerCode ?? "",
  })) ?? [];

  return {
    id: job.id,
    reference: job.jobNumber,
    status: job.status,
    statusLabel: STATUS_LABELS[job.status],
    progress: STATUS_PROGRESS[job.status],
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    total,
    unitPrice,
    setupFee,
    estimatedStitches: numberFrom(pricing.estimatedStitches),
    quantity,
    productName: configuration?.productName ?? item?.product.name ?? "Custom embroidery",
    productCategory: configuration?.productCategory ?? item?.product.category ?? "Custom",
    productMaterial: item?.product.material ?? null,
    productImageUrl: item?.product.photoUrls[0] ?? null,
    designName: configuration?.designName ?? item?.design.name ?? "Custom design",
    placementName: configuration?.placementName ?? item?.location?.name ?? "Studio placement",
    garmentColorHex: configuration?.garmentColorHex ?? item?.garmentColor ?? "#E9E1D4",
    widthInches: configuration?.widthInches ?? item?.designVersion.widthInches ?? 0,
    heightInches: configuration?.heightInches ?? item?.designVersion.heightInches ?? 0,
    threadWeight: configuration?.threadWeight ?? "W40",
    densityMm: configuration?.densityMm ?? 0.45,
    stitchStyle: configuration?.stitchStyle ?? "PATCH",
    borderStyle: configuration?.border.style ?? "NONE",
    notes: configuration?.notes ?? submission?.customerMessage ?? "",
    artworkUrl,
    artworkFileName: artwork?.fileName ?? item?.designVersion.sourceAsset?.fileName ?? "Artwork",
    colors: colorMappings,
    submittedThroughConfigurator: !!submission,
  };
}

export type PortalOrder = ReturnType<typeof toPortalOrder>;

export async function getPortalOrder(clientId: string, reference: string) {
  const job = await getRawPortalOrder(clientId, reference);
  return job ? toPortalOrder(job) : null;
}

export async function getPortalOrders(clientId: string) {
  const jobs = await prisma.job.findMany({
    where: { clientId, status: { not: "ARCHIVED" } },
    include: portalOrderInclude,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return jobs.map(toPortalOrder);
}
