import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in – Bokkies",
  description:
    "Sign in to your Bokkies account to manage bookings or access your dashboard.",
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: true },
  openGraph: {
    url: `${SITE_URL}/login`,
    title: "Sign in – Bokkies",
    description:
      "Sign in to your Bokkies account to manage bookings or access your dashboard.",
    type: "website",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
