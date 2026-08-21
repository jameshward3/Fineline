import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPortalLoginChallenge } from "@/lib/portal/challenge";
import { maskPhoneNumber, normalizePhoneNumber } from "@/lib/portal/phone";
import { developmentPortalCode, hasTwilioVerify, startPhoneVerification } from "@/lib/portal/twilio-verify";

export const runtime = "nodejs";

const requestSchema = z.object({
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

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  const phone = parsed.success ? normalizePhoneNumber(parsed.data.phone) : null;
  if (!parsed.success || !phone) {
    return NextResponse.json({ error: "Enter a mobile number including its area code." }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production" && !hasTwilioVerify()) {
    return NextResponse.json({ error: "Phone sign-in is temporarily unavailable." }, { status: 503 });
  }

  try {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const challengeResult = await createPortalLoginChallenge({
      phone,
      ipAddress: forwarded ?? request.headers.get("x-real-ip") ?? "unknown",
      returnReference: parsed.data.returnReference,
    });
    if (challengeResult.rateLimited) {
      return NextResponse.json({ error: "Too many codes requested. Try again in 15 minutes." }, { status: 429 });
    }

    const devCode = developmentPortalCode();
    if (challengeResult.deliveryPhone && hasTwilioVerify()) {
      try {
        await startPhoneVerification(normalizePhoneNumber(challengeResult.deliveryPhone) ?? phone);
      } catch (error) {
        console.error("Unable to start customer phone verification", error);
      }
    }

    return NextResponse.json({
      ok: true,
      challengeId: challengeResult.challenge.id,
      maskedPhone: maskPhoneNumber(phone),
      expiresInSeconds: 600,
      ...(challengeResult.deliveryPhone && devCode && !hasTwilioVerify() ? { developmentCode: devCode } : {}),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Customer portal code request failed", error);
    return NextResponse.json({ error: "Phone sign-in is temporarily unavailable." }, { status: 503 });
  }
}
