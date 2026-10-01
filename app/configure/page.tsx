import type { Metadata } from "next";
import { EmbroideryConfigurator } from "@/components/configurator/embroidery-configurator";
import { createConfiguratorUploadIntent } from "@/lib/configurator/upload-intent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configure Your Embroidery — Fine Line Studio",
  description: "Upload artwork or enter custom lettering, map thread colors, set placement and size, and preview a Fine Line Studio embroidery commission in 3D.",
  robots: { index: false, follow: false },
};

export default async function ConfigurePage({
  searchParams,
}: {
  searchParams: Promise<{ embed?: string | string[] }>;
}) {
  const { embed } = await searchParams;
  const embedded = embed === "1" || embed === "true";
  return (
    <>
      {/* Script/Handwritten lettering fonts: loaded as literal, known font-family
          names (rather than next/font/google's hashed names) because <canvas>
          text rendering needs a plain string to put in ctx.font. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Caveat:wght@700&display=swap"
      />
      <EmbroideryConfigurator
        embedded={embedded}
        uploadIntent={createConfiguratorUploadIntent()}
        blobStorageReady={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
      />
    </>
  );
}
