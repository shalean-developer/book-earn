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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

