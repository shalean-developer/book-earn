import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Booking confirmed – Bokkies",
  description: "Your Bokkies cleaning booking is confirmed. View payment and booking details.",
  alternates: { canonical: `${SITE_URL}/booking/verify` },
  openGraph: {
    url: `${SITE_URL}/booking/verify`,
    title: "Booking confirmed – Bokkies",
    description: "Your Bokkies cleaning booking is confirmed. View payment and booking details.",
    type: "website",
  },
};

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
