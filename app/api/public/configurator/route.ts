import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createConfiguratorSubmission, ConfiguratorIntakeError } from "@/lib/configurator/create-submission";
import { configuratorSubmissionSchema } from "@/lib/configurator/schema";

export const runtime = "nodejs";

function secretAuthorized(request: NextRequest) {
  const expected = process.env.STITCHOS_INTAKE_SECRET;
  if (!expected) return false;
  const supplied = request.headers.get("x-stitchos-intake-secret") ?? "";
  if (supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !!origin && origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request) && !secretAuthorized(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const parsed = configuratorSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please review the highlighted configuration details.",
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await createConfiguratorSubmission(parsed.data);
    return NextResponse.json({ ok: true, ...result }, {
      status: result.duplicate ? 200 : 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ConfiguratorIntakeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Public configurator intake failed", error);
    return NextResponse.json(
      { error: "The studio order system is temporarily unavailable. Your design remains in this browser." },
      { status: 502 },
    );
  }
}
