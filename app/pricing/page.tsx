import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing – Shalean Cleaning Services",
  description:
    "Transparent pricing for home, office and Airbnb cleaning in Cape Town. Book online with no hidden fees.",
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    url: `${SITE_URL}/pricing`,
    title: "Pricing – Shalean Cleaning Services",
    description:
      "Transparent pricing for home, office and Airbnb cleaning in Cape Town. Book online with no hidden fees.",
    type: "website",
  },
};

export default function PricingPage() {
  return <ShaleanWebsite />;
}
