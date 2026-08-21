import { z } from "zod";
import { normalizePhoneNumber } from "@/lib/portal/phone";
import { STITCH_STYLES } from "./stitch-simulation";

const hexColor = z.string().regex(/^#[0-9A-F]{6}$/i, "Expected a six-digit hex color");

export const threadMappingSchema = z.object({
  sequence: z.number().int().min(1).max(12),
  sourceHex: hexColor,
  targetHex: hexColor,
  threadColorId: z.string().max(200).nullable().optional(),
  threadName: z.string().min(1).max(160),
  manufacturerCode: z.string().max(80).optional().default(""),
  coverage: z.number().min(0).max(1),
});

export const configuratorArtworkSchema = z.object({
  url: z.string().url().max(2400),
  pathname: z.string().min(1).max(1200),
  fileName: z.string().min(1).max(500),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]),
  fileSizeBytes: z.number().int().min(1).max(20 * 1024 * 1024),
  widthPx: z.number().int().positive().max(30_000).nullable().optional(),
  heightPx: z.number().int().positive().max(30_000).nullable().optional(),
});

export const configuratorConfigurationSchema = z.object({
  designName: z.string().min(1).max(240),
  productId: z.string().max(200).nullable(),
  productName: z.string().min(1).max(240),
  productCategory: z.string().min(1).max(160),
  locationId: z.string().max(200).nullable(),
  placementName: z.string().min(1).max(160),
  garmentColorHex: hexColor,
  widthInches: z.number().min(0.25).max(15),
  heightInches: z.number().min(0.25).max(15),
  positionX: z.number().min(-1).max(1),
  positionY: z.number().min(-1).max(1),
  rotationDegrees: z.number().min(-30).max(30),
  threadWeight: z.enum(["W30", "W40", "W60"]),
  densityMm: z.number().min(0.3).max(0.65),
  stitchStyle: z.enum(STITCH_STYLES).optional().default("PATCH"),
  colors: z.array(threadMappingSchema).min(1).max(12),
  border: z.object({
    style: z.enum(["NONE", "SATIN", "MERROW"]),
    colorHex: hexColor,
    widthMm: z.number().min(0.5).max(6),
  }),
  quantity: z.number().int().min(1).max(5000),
  notes: z.string().max(12_000).optional().default(""),
});

export const configuratorSubmissionSchema = z.object({
  idempotencyKey: z.string().min(8).max(200),
  startedAt: z.number().int().positive(),
  website: z.literal("").optional().default(""),
  projectType: z.enum(["PERSONAL", "CORPORATE", "INSTITUTIONAL", "OTHER"]),
  customer: z.object({
    name: z.string().trim().min(2).max(200),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().min(7).max(40).refine(
      (value) => normalizePhoneNumber(value) !== null,
      "Enter a mobile number including its area code",
    ),
    organization: z.string().trim().max(240).optional().default(""),
    consent: z.literal(true),
  }),
  artwork: configuratorArtworkSchema,
  configuration: configuratorConfigurationSchema,
});

export type ConfiguratorSubmissionInput = z.infer<typeof configuratorSubmissionSchema>;
export type ConfiguratorConfiguration = z.infer<typeof configuratorConfigurationSchema>;
export type ConfiguratorThreadMapping = z.infer<typeof threadMappingSchema>;
