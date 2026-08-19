import { CinematicIntro } from "@/components/story/CinematicIntro";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Homepage } from "@/components/marketing/Homepage";

export default function MarketingHomePage() {
  return (
    <>
      <CinematicIntro homeAnchorId="home" />
      <SiteHeader />
      <Homepage id="home" />
    </>
  );
}
