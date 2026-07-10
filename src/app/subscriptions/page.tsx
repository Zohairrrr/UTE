import { Navigation } from "@/components/navigation";
import { HomeClient } from "@/components/home-client";
import { publicPageProps } from "@/lib/page-props";
import { pageMetadata, mealPlansProductJsonLd } from "@/lib/seo";

export const metadata = pageMetadata("/subscriptions");

export default async function SubscriptionsPage() {
  const props = await publicPageProps();
  const productLd = mealPlansProductJsonLd(props.plans);
  return (
    <>
      <Navigation />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd).replace(/</g, "\\u003c") }}
      />
      <HomeClient {...props} view="subscriptions" />
    </>
  );
}
