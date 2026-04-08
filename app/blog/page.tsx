import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog – Shalean Cleaning Services",
  description:
    "Cleaning tips, guides and updates from Shalean Cleaning Services in Cape Town.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    url: `${SITE_URL}/blog`,
    title: "Blog – Shalean Cleaning Services",
    description: "Cleaning tips, guides and updates from Shalean Cleaning Services in Cape Town.",
    type: "website",
  },
};

export default function BlogPage() {
  return <ShaleanWebsite />;
}
