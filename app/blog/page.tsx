import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog – Bokkies",
  description:
    "Cleaning tips, guides and updates from Bokkies in Cape Town.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    url: `${SITE_URL}/blog`,
    title: "Blog – Bokkies",
    description: "Cleaning tips, guides and updates from Bokkies in Cape Town.",
    type: "website",
  },
};

export default function BlogPage() {
  return <ShaleanWebsite />;
}
