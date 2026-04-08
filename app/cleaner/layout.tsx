import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard – Shalean Cleaning Services",
  description: "Cleaner dashboard for Shalean Cleaning Services – view and manage your jobs.",
  alternates: { canonical: `${SITE_URL}/cleaner` },
  robots: { index: false, follow: false },
  openGraph: {
    url: `${SITE_URL}/cleaner`,
    title: "Dashboard – Shalean Cleaning Services",
    type: "website",
  },
};

export default function CleanerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
