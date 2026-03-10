import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "@/index.css";
import { Providers } from "./providers";

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
  title: "Shalean Projects - Find & Book Trusted Service Professionals",
  description: "Book verified professionals for home cleaning, plumbing, car services, and more. Instant booking, secure payments, and quality guaranteed.",
  keywords: "service booking, home services, cleaning, plumbing, handyman, book professionals, Shalean",
  openGraph: {
    title: "Shalean Projects - Find & Book Trusted Service Professionals",
    description: "Book verified professionals for any service. From home cleaning to car repair — all in one place.",
    type: "website",
    url: "https://shalean.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shalean Projects - Find & Book Trusted Service Professionals",
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
          // Local SEO: describe Shalean as a Cape Town cleaning business
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Shalean Cleaning Services",
              description:
                "Professional home, office and Airbnb cleaning services in Cape Town and surrounding suburbs.",
              url: "https://shalean.com",
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

