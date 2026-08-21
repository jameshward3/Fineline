import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { verifyConfiguratorUploadIntent } from "@/lib/configurator/upload-intent";

export const runtime = "nodejs";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const parsedPayload = JSON.parse(clientPayload ?? "null") as { uploadIntent?: string } | null;
        const intent = parsedPayload?.uploadIntent
          ? verifyConfiguratorUploadIntent(parsedPayload.uploadIntent)
          : null;
        if (!intent) throw new Error("This upload session has expired. Refresh and try again.");
        if (!pathname.startsWith(`configurator/${intent.nonce}/`)) {
          throw new Error("Invalid artwork upload path.");
        }
        if (!/^configurator\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(pathname)) {
          throw new Error("Invalid artwork filename.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ nonce: intent.nonce, requestedPathname: pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.info("Public configurator artwork uploaded", { pathname: blob.pathname, contentType: blob.contentType });
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Artwork upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
