import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact – Shalean Cleaning Services",
  description:
    "Get in touch for quotes, support or bookings. Professional cleaning in Cape Town.",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    url: `${SITE_URL}/contact`,
    title: "Contact – Shalean Cleaning Services",
    description:
      "Get in touch for quotes, support or bookings. Professional cleaning in Cape Town.",
    type: "website",
  },
};

export default function ContactPage() {
  return <ShaleanWebsite />;
}
