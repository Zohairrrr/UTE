import { Navigation } from "@/components/navigation";
import { HomeClient } from "@/components/home-client";
import { publicPageProps } from "@/lib/page-props";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/events");

export default async function EventsPage() {
  const props = await publicPageProps();
  return (
    <>
      <Navigation />
      <HomeClient {...props} view="events" />
    </>
  );
}
