import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create account – Bokkies",
  description:
    "Create your Bokkies account to book cleaning services or join as a cleaner.",
  alternates: { canonical: `${SITE_URL}/signup` },
  robots: { index: false, follow: true },
  openGraph: {
    url: `${SITE_URL}/signup`,
    title: "Create account – Bokkies",
    description:
      "Create your Bokkies account to book cleaning services or join as a cleaner.",
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
