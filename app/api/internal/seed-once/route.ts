import { NextRequest, NextResponse } from "next/server";
import { main as seed } from "@/prisma/seed";

// Temporary, token-gated one-time production seed endpoint.
// Remove this route once the production database has been seeded.

export async function POST(req: NextRequest) {
  const expected = process.env.SEED_TOKEN;
  const token = req.headers.get("x-seed-token");
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await seed();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
