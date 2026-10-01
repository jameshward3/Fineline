import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { phoneLookupCandidates } from "./phone";

function portalSecret() {
  const secret = process.env.PORTAL_AUTH_SECRET ?? process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "fine-line-local-portal-only";
  throw new Error("PORTAL_AUTH_SECRET or AUTH_SECRET must be configured");
}

export function hashPortalIdentifier(value: string) {
  return crypto.createHmac("sha256", portalSecret()).update(value).digest("hex");
}

export async function createPortalAccessAttempt({
  phone,
  ipAddress,
  returnReference,
}: {
  phone: string;
  ipAddress: string;
  returnReference?: string;
}) {
  const phoneHash = hashPortalIdentifier(phone);
  const ipHash = hashPortalIdentifier(ipAddress || "unknown");
  const rateWindow = new Date(Date.now() - 15 * 60 * 1000);
  const [phoneRequests, ipRequests] = await Promise.all([
    prisma.customerPortalLoginChallenge.count({ where: { phoneHash, createdAt: { gte: rateWindow } } }),
    prisma.customerPortalLoginChallenge.count({ where: { ipHash, createdAt: { gte: rateWindow } } }),
  ]);
  if (phoneRequests >= 4 || ipRequests >= 10) return { rateLimited: true as const };

  const candidates = phoneLookupCandidates(phone);
  const client = await prisma.client.findFirst({
    where: {
      active: true,
      OR: [
        { phone: { in: candidates } },
        { contacts: { some: { phone: { in: candidates } } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  const attempt = await prisma.customerPortalLoginChallenge.create({
    data: {
      clientId: client?.id ?? null,
      phoneHash,
      ipHash,
      returnReference: returnReference || null,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return {
    rateLimited: false as const,
    attempt,
  };
}
