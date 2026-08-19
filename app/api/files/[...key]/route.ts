import { NextRequest, NextResponse } from "next/server";
import { getStorageService } from "@/lib/services/storage";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  json: "application/json",
  pdf: "application/pdf",
  zip: "application/zip",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const storageKey = key.join("/");

  try {
    const storage = getStorageService();
    const data = await storage.get(storageKey);
    const ext = storageKey.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
