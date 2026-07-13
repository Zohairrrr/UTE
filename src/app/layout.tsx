import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import { BrandSplash } from "@/components/brand-splash";
import { WhatsAppWidget } from "@/components/whatsapp-widget";
import { absoluteUrl, defaultDescription, siteName, siteUrl } from "@/lib/seo";
import { getPublicContent } from "@/lib/public-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Homemade Meal Plans And Event Catering`,
    template: `%s | ${siteName}`
  },
  description: defaultDescription,
  applicationName: siteName,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: absoluteUrl("/")
  },
  openGraph: {
    title: `${siteName} | Premium Homemade Meals And Event Catering`,
    description: defaultDescription,
    url: siteUrl,
    siteName,
    images: [
      {
        url: absoluteUrl("/brand/editorial-tiffin.png"),
        width: 1024,
        height: 1024,
        alt: "URBAN TIFFIN AND EVENTS homemade tiffin meal service"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Premium Homemade Meals And Event Catering`,
    description: defaultDescription,
    images: [absoluteUrl("/brand/editorial-tiffin.png")]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: "/brand/urban-tiffin-logo.jpeg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getPublicContent();
  const { phone, whatsappUrl } = content.business;

  return (
    <html lang="en">
      <body>
        {children}
        <BrandSplash />
        <WhatsAppWidget phone={phone} whatsappUrl={whatsappUrl} />
        <Toaster
          position="bottom-left"
          closeButton
          toastOptions={{
            style: {
              background: "#F9F7F2",
              color: "#233426",
              border: "1px solid rgba(35, 52, 38, 0.18)",
              borderRadius: "2px"
            }
          }}
        />
      </body>
    </html>
  );
}
