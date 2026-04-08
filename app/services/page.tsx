import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cleaning services – Shalean Cleaning Services",
  description:
    "Home, office and Airbnb cleaning services in Cape Town. Same-week availability, vetted cleaners, transparent pricing.",
  alternates: { canonical: `${SITE_URL}/services` },
  openGraph: {
    url: `${SITE_URL}/services`,
    title: "Cleaning services – Shalean Cleaning Services",
    description:
      "Home, office and Airbnb cleaning services in Cape Town. Same-week availability, vetted cleaners, transparent pricing.",
    type: "website",
  },
};

export default function ServicesPage() {
  return <ShaleanWebsite />;
}
