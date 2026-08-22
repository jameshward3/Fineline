import type { Metadata } from "next";
import { EmbroideryConfigurator } from "@/components/configurator/embroidery-configurator";
import { createConfiguratorUploadIntent } from "@/lib/configurator/upload-intent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configure Your Embroidery — Fine Line Studio",
  description: "Upload artwork, map thread colors, set placement and size, and preview a Fine Line Studio embroidery commission in 3D.",
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
    <EmbroideryConfigurator
      embedded={embedded}
      uploadIntent={createConfiguratorUploadIntent()}
      blobStorageReady={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
    />
  );
}
