import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About us – Shalean Cleaning Services",
  description:
    "Shalean Cleaning Services provides trusted home, office and Airbnb cleaning in Cape Town. Meet our team and learn how we deliver quality cleans.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    url: `${SITE_URL}/about`,
    title: "About us – Shalean Cleaning Services",
    description:
      "Shalean Cleaning Services provides trusted home, office and Airbnb cleaning in Cape Town. Meet our team and learn how we deliver quality cleans.",
    type: "website",
  },
};

export default function AboutPage() {
  return <ShaleanWebsite />;
}
