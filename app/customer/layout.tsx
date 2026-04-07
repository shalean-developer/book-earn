import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard – Bokkies",
  description: "Your Bokkies customer dashboard – manage bookings and account.",
  alternates: { canonical: `${SITE_URL}/customer` },
  robots: { index: false, follow: false },
  openGraph: {
    url: `${SITE_URL}/customer`,
    title: "Dashboard – Bokkies",
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
