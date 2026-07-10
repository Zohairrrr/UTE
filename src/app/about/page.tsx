import { Navigation } from "@/components/navigation";
import { HomeClient } from "@/components/home-client";
import { publicPageProps } from "@/lib/page-props";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/about");

export default async function AboutPage() {
  const props = await publicPageProps();
  return (
    <>
      <Navigation />
      <HomeClient {...props} view="about" />
    </>
  );
}
