import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Careers – Shalean Cleaning Services",
  description:
    "Join the Shalean team. Cleaning and operations roles in Cape Town.",
  alternates: { canonical: `${SITE_URL}/careers` },
  openGraph: {
    url: `${SITE_URL}/careers`,
    title: "Careers – Shalean Cleaning Services",
    description: "Join the Shalean team. Cleaning and operations roles in Cape Town.",
    type: "website",
  },
};

export default function CareersPage() {
  return <ShaleanWebsite />;
}
