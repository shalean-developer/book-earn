import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

/** Avoid serving a stale pre-rendered shell that can mismatch the client bundle after UI changes. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bokkies – Cape Town | Home, Office & Airbnb Cleaning",
  description:
    "Professional home, office and Airbnb cleaning in Cape Town and surrounding suburbs. Sea Point, Claremont, Constantia, Durbanville and more. Book trusted cleaners with same-week availability.",
  keywords:
    "Cape Town cleaning, home cleaning Cape Town, office cleaning, Airbnb cleaning, Bokkies, cleaning services Cape Town",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Bokkies – Cape Town | Home, Office & Airbnb Cleaning",
    description:
      "Professional home, office and Airbnb cleaning in Cape Town and surrounding suburbs. Book trusted cleaners with same-week availability.",
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Bokkies – Cape Town | Home, Office & Airbnb Cleaning",
    description:
      "Professional home, office and Airbnb cleaning in Cape Town and surrounding suburbs. Book trusted cleaners with same-week availability.",
  },
};

export default function Home() {
  return <ShaleanWebsite />;
}
