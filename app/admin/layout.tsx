import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard – Shalean",
  description: "Admin dashboard for Shalean Cleaning.",
  alternates: { canonical: `${SITE_URL}/admin` },
  robots: { index: false, follow: false },
  openGraph: {
    url: `${SITE_URL}/admin`,
    title: "Dashboard – Shalean",
    type: "website",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
