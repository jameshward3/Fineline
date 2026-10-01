import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPortalAccessAttempt } from "@/lib/portal/challenge";
import { normalizePhoneNumber } from "@/lib/portal/phone";
import { createPortalSession, setPortalSessionCookie } from "@/lib/portal/session";

export const runtime = "nodejs";

const accessSchema = z.object({
  phone: z.string().trim().min(7).max(40),
  returnReference: z.string().trim().regex(/^[A-Za-z0-9-]{1,80}$/).optional(),
});

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !!origin && origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const parsed = accessSchema.safeParse(await request.json().catch(() => null));
  const phone = parsed.success ? normalizePhoneNumber(parsed.data.phone) : null;
  if (!parsed.success || !phone) {
    return NextResponse.json({ error: "Enter a mobile number including its area code." }, { status: 400 });
  }

  try {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const accessResult = await createPortalAccessAttempt({
      phone,
      ipAddress: forwarded ?? request.headers.get("x-real-ip") ?? "unknown",
      returnReference: parsed.data.returnReference,
    });
    if (accessResult.rateLimited) {
      return NextResponse.json({ error: "Too many sign-in attempts. Try again in 15 minutes." }, { status: 429 });
    }

    const clientId = accessResult.attempt.clientId;
    if (!clientId) {
      return NextResponse.json(
        { error: "We could not find orders linked to that mobile number." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const requestedJob = parsed.data.returnReference
      ? await prisma.job.findFirst({
          where: { jobNumber: parsed.data.returnReference, clientId },
          select: { jobNumber: true },
        })
      : null;
    const [{ token, expiresAt }] = await Promise.all([
      createPortalSession(clientId),
      prisma.customerPortalLoginChallenge.update({
        where: { id: accessResult.attempt.id },
        data: { attempts: 1, verifiedAt: new Date() },
      }),
    ]);
    const destination = requestedJob ? `/orders/${encodeURIComponent(requestedJob.jobNumber)}` : "/orders";
    const response = NextResponse.json({ ok: true, destination }, { headers: { "Cache-Control": "no-store" } });
    setPortalSessionCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    console.error("Customer portal phone access failed", error);
    return NextResponse.json({ error: "We could not open your orders. Try again shortly." }, { status: 503 });
  }
}
