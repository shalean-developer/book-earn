import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Areas we serve – Shalean Cleaning Services Cape Town",
  description:
    "Professional cleaning in Sea Point, Claremont, Durbanville, Observatory, Century City, Table View, Gardens, Constantia and greater Cape Town.",
  alternates: { canonical: `${SITE_URL}/locations` },
  openGraph: {
    url: `${SITE_URL}/locations`,
    title: "Areas we serve – Shalean Cleaning Services Cape Town",
    description:
      "Professional cleaning in Sea Point, Claremont, Durbanville, Observatory, Century City, Table View, Gardens, Constantia and greater Cape Town.",
    type: "website",
  },
};

export default function LocationsIndexPage() {
  return <ShaleanWebsite />;
}
