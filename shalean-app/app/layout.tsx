import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shalean Cleaning Services | Cape Town",
  description:
    "Professional home and Airbnb cleaning services in Cape Town. Transparent pricing, vetted cleaners, and a 100% satisfaction guarantee.",
  openGraph: {
    title: "Shalean Cleaning Services | Cape Town",
    description:
      "Premium home and Airbnb cleaning services across Cape Town with vetted cleaners and transparent pricing.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shalean Cleaning Services | Cape Town",
    description:
      "Book trusted home and Airbnb cleaners in Cape Town with Shalean Cleaning Services.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shalean.co.za";
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#shalean-cleaning-services`,
    name: "Shalean Cleaning Services",
    url: siteUrl,
    telephone: "+27 87 153 5250",
    email: "hello@shalean.co.za",
    description:
      "Professional home and Airbnb cleaning services in Cape Town with vetted cleaners, transparent pricing and a 100% satisfaction guarantee.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Cape Town",
      addressRegion: "Western Cape",
      addressCountry: "ZA",
    },
    areaServed: [
      "Cape Town",
      "Sea Point",
      "Claremont",
      "Durbanville",
      "Observatory",
      "Century City",
      "Table View",
      "Gardens",
      "Constantia",
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "07:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "08:00",
        closes: "16:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "09:00",
        closes: "14:00",
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

