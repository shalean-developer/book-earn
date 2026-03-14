import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shalean Cleaning Services – Cape Town | Home, Office & Airbnb Cleaning",
  description:
    "Professional home, office and Airbnb cleaning in Cape Town and surrounding suburbs. Sea Point, Claremont, Constantia, Durbanville and more. Book trusted cleaners with same-week availability.",
  keywords:
    "Cape Town cleaning, home cleaning Cape Town, office cleaning, Airbnb cleaning, Shalean, cleaning services Cape Town",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Shalean Cleaning Services – Cape Town | Home, Office & Airbnb Cleaning",
    description:
      "Professional home, office and Airbnb cleaning in Cape Town and surrounding suburbs. Book trusted cleaners with same-week availability.",
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Shalean Cleaning Services – Cape Town | Home, Office & Airbnb Cleaning",
    description:
      "Professional home, office and Airbnb cleaning in Cape Town and surrounding suburbs. Book trusted cleaners with same-week availability.",
  },
};

export default function Home() {
  return <ShaleanWebsite />;
}
