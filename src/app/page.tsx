import { Navigation } from "@/components/navigation";
import { HomeClient } from "@/components/home-client";
import { publicPageProps } from "@/lib/page-props";
import { organizationJsonLd, localBusinessJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/");

export default async function Home() {
  const props = await publicPageProps();
  const orgLd = organizationJsonLd();
  const businessLd = localBusinessJsonLd();
  const faqLd = faqJsonLd();

  return (
    <>
      <Navigation />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }}
      />
      <HomeClient {...props} view="home" />
    </>
  );
}
