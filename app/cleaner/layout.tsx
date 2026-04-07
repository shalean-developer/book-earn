import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard – Bokkies",
  description: "Cleaner dashboard for Bokkies – view and manage your jobs.",
  alternates: { canonical: `${SITE_URL}/cleaner` },
  robots: { index: false, follow: false },
  openGraph: {
    url: `${SITE_URL}/cleaner`,
    title: "Dashboard – Bokkies",
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
