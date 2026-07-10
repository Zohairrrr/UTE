import type { Metadata } from "next";
import type { Plan } from "./catalog";

export const siteName = "URBAN TIFFIN AND EVENTS";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://urban-tiffin-and-events.vercel.app"
).replace(/\/$/, "");

export const defaultDescription =
  "Homemade monthly meal plans, frozen food, custom food orders, and event catering with simple bank transfer review.";

export const publicRoutes = [
  {
    path: "/",
    title: "Homemade Meal Plans And Event Catering",
    description: defaultDescription,
    priority: 1
  },
  {
    path: "/about",
    title: "About Our Meal And Catering Service",
    description:
      "Learn about URBAN TIFFIN AND EVENTS, a structured kitchen and hospitality service for offices, hostels, families, and private event hosts.",
    priority: 0.75
  },
  {
    path: "/subscriptions",
    title: "Office And Hostel Meal Plans",
    description:
      "Compare Standard, Premium, and Executive homemade meal plans with weekly menus and payment screenshot review.",
    priority: 0.95
  },
  {
    path: "/custom-order",
    title: "Custom Meal Orders For Offices And Groups",
    description:
      "Send custom meal requests for office teams, hostels, families, and bulk delivery with delivery timing and payment screenshot.",
    priority: 0.85
  },
  {
    path: "/frozen-goods",
    title: "Frozen Food Packs For Homes, Hostels, And Offices",
    description:
      "Order frozen rolls, kebabs, samosas, and prepared food packs with simple payment screenshot review.",
    priority: 0.8
  },
  {
    path: "/events",
    title: "Event Catering And Decor",
    description:
      "Plan family dinners, office events, decor, and catering through URBAN TIFFIN AND EVENTS.",
    priority: 0.85
  }
];

export function absoluteUrl(path = "/") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata(path: string): Metadata {
  const route = publicRoutes.find((item) => item.path === path) ?? publicRoutes[0];
  const images = [
    {
      url: absoluteUrl("/brand/editorial-tiffin.png"),
      width: 1024,
      height: 1024,
      alt: "URBAN TIFFIN AND EVENTS premium tiffin meal service"
    }
  ];

  return {
    title: route.title,
    description: route.description,
    alternates: {
      canonical: absoluteUrl(path)
    },
    openGraph: {
      title: `${route.title} | ${siteName}`,
      description: route.description,
      url: absoluteUrl(path),
      siteName,
      images,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: `${route.title} | ${siteName}`,
      description: route.description,
      images: [absoluteUrl("/brand/editorial-tiffin.png")]
    }
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FoodService",
    "@id": `${siteUrl}/#organization`,
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl("/brand/urban-tiffin-logo.jpeg"),
    image: absoluteUrl("/brand/editorial-tiffin.png"),
    description: defaultDescription,
    servesCuisine: ["Pakistani", "Homemade meals", "Office meals", "Event catering"],
    serviceType: ["Monthly meal plans", "Frozen goods", "Custom orders", "Event catering"],
    areaServed: {
      "@type": "Country",
      name: "Pakistan"
    },
    sameAs: []
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FoodService",
    "@id": `${siteUrl}/#localbusiness`,
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl("/brand/urban-tiffin-logo.jpeg"),
    image: absoluteUrl("/brand/editorial-tiffin.png"),
    description: defaultDescription,
    telephone: "+92 308 2225656",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lahore",
      addressRegion: "Punjab",
      addressCountry: "PK"
    },
    areaServed: [
      { "@type": "AdministrativeArea", "name": "DHA, Lahore" },
      { "@type": "AdministrativeArea", "name": "Gulberg, Lahore" },
      { "@type": "AdministrativeArea", "name": "Johar Town, Lahore" },
      { "@type": "AdministrativeArea", "name": "Cantt, Lahore" },
      { "@type": "AdministrativeArea", "name": "Model Town, Lahore" },
      { "@type": "AdministrativeArea", "name": "Garden Town, Lahore" },
      { "@type": "AdministrativeArea", "name": "Faisal Town, Lahore" },
      { "@type": "AdministrativeArea", "name": "Iqbal Town, Lahore" }
    ],
    provider: {
      "@type": "LocalBusiness",
      name: siteName
    }
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does the manual bank transfer verification work at Urban Tiffin?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "When you purchase a meal plan or place an order, you transfer the amount to our bank account and upload a screenshot of the transaction. Our admin team verifies the transfer and confirms your order/subscription, instantly issuing a printable digital receipt with a unique token number."
        }
      },
      {
        "@type": "Question",
        "name": "Which areas in Lahore does Urban Tiffin deliver to?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We deliver premium homemade tiffin meals and event catering to major areas in Lahore, Pakistan, including DHA, Gulberg, Johar Town, Cantt, Model Town, Garden Town, Faisal Town, and Iqbal Town."
        }
      },
      {
        "@type": "Question",
        "name": "What are the hygiene and preparation standards of Urban Tiffin?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All meals are prepared in a highly sterile commercial kitchen using premium grade ingredients. We maintain extreme sanitization, clean packaging, and rigorous temperature checks throughout food preparation and transport."
        }
      },
      {
        "@type": "Question",
        "name": "Can I customize the weekly menu for office tiffin subscriptions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Our Standard, Premium, and Executive plans come with diverse weekly schedules. Admins can adjust delivery time slots, and corporate buyers can request custom meal adjustments through our custom order form."
        }
      }
    ]
  };
}

export function mealPlansProductJsonLd(plans: Plan[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": plans.map((plan, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": `${plan.name} Meal Plan`,
        "description": plan.label || `${plan.name} homemade meal plan subscription`,
        "offers": {
          "@type": "Offer",
          "price": plan.price,
          "priceCurrency": "PKR",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": "2200-12-31"
        }
      }
    }))
  };
}

