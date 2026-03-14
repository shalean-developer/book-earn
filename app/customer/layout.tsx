import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard – Shalean",
  description: "Your Shalean customer dashboard – manage bookings and account.",
  alternates: { canonical: `${SITE_URL}/customer` },
  robots: { index: false, follow: false },
  openGraph: {
    url: `${SITE_URL}/customer`,
    title: "Dashboard – Shalean",
    type: "website",
  },
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
