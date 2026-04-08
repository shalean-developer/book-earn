import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create account – Shalean Cleaning Services",
  description:
    "Create your Shalean Cleaning Services account to book cleaning services or join as a cleaner.",
  alternates: { canonical: `${SITE_URL}/signup` },
  robots: { index: false, follow: true },
  openGraph: {
    url: `${SITE_URL}/signup`,
    title: "Create account – Shalean Cleaning Services",
    description:
      "Create your Shalean Cleaning Services account to book cleaning services or join as a cleaner.",
    type: "website",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
