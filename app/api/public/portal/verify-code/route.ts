import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/portal/phone";
import { hashPortalIdentifier } from "@/lib/portal/challenge";
import { createPortalSession, setPortalSessionCookie } from "@/lib/portal/session";
import { checkPhoneVerification, developmentPortalCode, hasTwilioVerify } from "@/lib/portal/twilio-verify";

export const runtime = "nodejs";

const verifySchema = z.object({
  challengeId: z.string().min(8).max(200),
  code: z.string().trim().regex(/^\d{4,10}$/),
});

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !!origin && origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const parsed = verifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the verification code from your text message." }, { status: 400 });
  }

  try {
    const challenge = await prisma.customerPortalLoginChallenge.findUnique({
      where: { id: parsed.data.challengeId },
      include: { client: { include: { contacts: { select: { phone: true } } } } },
    });
    if (!challenge || !challenge.client || challenge.expiresAt <= new Date() || challenge.verifiedAt || challenge.attempts >= 5) {
      return NextResponse.json({ error: "That verification session has expired. Request a new code." }, { status: 400 });
    }

    await prisma.customerPortalLoginChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });

    const phone = [challenge.client.phone, ...challenge.client.contacts.map((contact) => contact.phone)]
      .flatMap((candidate) => {
        const normalized = candidate ? normalizePhoneNumber(candidate) : null;
        return normalized && hashPortalIdentifier(normalized) === challenge.phoneHash ? [normalized] : [];
      })[0] ?? null;
    if (!phone) {
      return NextResponse.json({ error: "We could not verify that code." }, { status: 400 });
    }

    const devCode = developmentPortalCode();
    const approved = hasTwilioVerify()
      ? await checkPhoneVerification(phone, parsed.data.code)
      : !!devCode && parsed.data.code === devCode;
    if (!approved) {
      return NextResponse.json({ error: "That code was not accepted. Check it and try again." }, { status: 400 });
    }

    const requestedJob = challenge.returnReference
      ? await prisma.job.findFirst({
          where: { jobNumber: challenge.returnReference, clientId: challenge.clientId },
          select: { jobNumber: true },
        })
      : null;
    const [{ token, expiresAt }] = await Promise.all([
      createPortalSession(challenge.client.id),
      prisma.customerPortalLoginChallenge.update({ where: { id: challenge.id }, data: { verifiedAt: new Date() } }),
    ]);
    const destination = requestedJob ? `/orders/${encodeURIComponent(requestedJob.jobNumber)}` : "/orders";
    const response = NextResponse.json({ ok: true, destination }, { headers: { "Cache-Control": "no-store" } });
    setPortalSessionCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    console.error("Customer portal verification failed", error);
    return NextResponse.json({ error: "We could not verify that code. Try again shortly." }, { status: 502 });
  }
}
