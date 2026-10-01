import { NextRequest, NextResponse } from "next/server";
import { deleteCurrentPortalSession, PORTAL_SESSION_COOKIE } from "@/lib/portal/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  await deleteCurrentPortalSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PORTAL_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
