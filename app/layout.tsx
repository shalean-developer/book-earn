import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "@/index.css";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bokkies - Find & Book Trusted Service Professionals",
  description: "Book verified professionals for home cleaning, plumbing, car services, and more. Instant booking, secure payments, and quality guaranteed.",
  keywords: "service booking, home services, cleaning, plumbing, handyman, book professionals, Bokkies",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Bokkies - Find & Book Trusted Service Professionals",
    description: "Book verified professionals for any service. From home cleaning to car repair — all in one place.",
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Bokkies - Find & Book Trusted Service Professionals",
    description: "Book verified professionals for any service. From home cleaning to car repair — all in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <script
          type="application/ld+json"
          // Local SEO: describe Bokkies as a Cape Town cleaning business
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Bokkies",
              description:
                "Professional home, office and Airbnb cleaning services in Cape Town and surrounding suburbs.",
              url: SITE_URL,
              telephone: "+27 87 153 5250",
              areaServed: [
                "Cape Town",
                "Sea Point",
                "Gardens",
                "Claremont",
                "Constantia",
                "Durbanville",
                "Table View",
                "Century City",
                "Observatory",
              ],
              address: {
                "@type": "PostalAddress",
                addressLocality: "Cape Town",
                addressCountry: "ZA",
              },
              sameAs: [],
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  telephone: "+27 87 153 5250",
                  contactType: "customer service",
                  areaServed: "ZA",
                  availableLanguage: ["en"],
                },
                {
                  "@type": "ContactPoint",
                  telephone: "+27 82 591 5525",
                  contactType: "customer service",
                  contactOption: "WhatsApp",
                  areaServed: "ZA",
                  availableLanguage: ["en"],
                },
              ],
              serviceType: "Cleaning Service",
            }),
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

