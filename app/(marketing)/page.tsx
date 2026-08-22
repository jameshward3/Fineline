import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Homepage } from "@/components/marketing/Homepage";
import { createConfiguratorUploadIntent } from "@/lib/configurator/upload-intent";

export const dynamic = "force-dynamic";

export default function MarketingHomePage() {
  return (
    <>
      <SiteHeader />
      <Homepage
        id="home"
        uploadIntent={createConfiguratorUploadIntent()}
        blobStorageReady={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
      />
    </>
  );
}
