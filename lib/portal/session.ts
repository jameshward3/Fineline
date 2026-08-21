import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const PORTAL_SESSION_COOKIE = "fine_line_portal_session";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sessionDurationDays() {
  const configured = Number(process.env.PORTAL_SESSION_DAYS ?? 30);
  return Number.isFinite(configured) ? Math.max(1, Math.min(90, Math.round(configured))) : 30;
}

export async function createPortalSession(clientId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationDays() * 24 * 60 * 60 * 1000);
  await prisma.customerPortalSession.create({
    data: { clientId, tokenHash: hashToken(token), expiresAt },
  });
  return { token, expiresAt };
}

export function setPortalSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getPortalViewer() {
  const token = (await cookies()).get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await prisma.customerPortalSession.findFirst({
      where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
      include: { client: true },
    });
    return session ? { sessionId: session.id, client: session.client } : null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("Customer portal session lookup unavailable", error);
    return null;
  }
}

export async function deleteCurrentPortalSession() {
  const token = (await cookies()).get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) return;
  await prisma.customerPortalSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}
