import React, { Suspense } from "react";
import type { Metadata } from "next";
import ShaleanWebsite from "@/components/ShaleanWebsite";

export const metadata: Metadata = {
  title: "Home & Airbnb Cleaning Services in Cape Town | Shalean",
  description:
    "Standard, deep, move-in/out, Airbnb and carpet cleaning services across Cape Town suburbs including Sea Point, Claremont, Constantia, Durbanville and more.",
  openGraph: {
    title: "Home & Airbnb Cleaning Services in Cape Town | Shalean",
    description:
      "Book professional home and Airbnb cleaning services across Cape Town with vetted cleaners, transparent pricing and a 100% satisfaction guarantee.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Home & Airbnb Cleaning Services in Cape Town | Shalean",
    description:
      "Book trusted cleaners for homes and Airbnbs across Cape Town suburbs with transparent pricing and a satisfaction guarantee.",
  },
};

export default function ServicesRoutePage() {
  return (
    <Suspense fallback={null}>
      <ShaleanWebsite initialPage="services" />
    </Suspense>
  );
}

