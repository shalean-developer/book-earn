import React, { Suspense } from "react";
import type { Metadata } from "next";
import ShaleanWebsite from "@/components/ShaleanWebsite";

export const metadata: Metadata = {
  title: "Cleaning Service Pricing in Cape Town | Shalean",
  description:
    "Transparent pricing for standard, deep, move-in/out, Airbnb and carpet cleaning services across Cape Town. No hidden fees.",
  openGraph: {
    title: "Cleaning Service Pricing in Cape Town | Shalean",
    description:
      "View clear pricing for professional cleaning services in Cape Town, including deep cleans, move‑in/out and Airbnb turnovers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cleaning Service Pricing in Cape Town | Shalean",
    description:
      "See transparent, no‑surprise pricing for home and Airbnb cleaning services across Cape Town.",
  },
};

export default function PricingRoutePage() {
  return (
    <Suspense fallback={null}>
      <ShaleanWebsite initialPage="pricing" />
    </Suspense>
  );
}

