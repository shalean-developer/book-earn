import React, { Suspense } from "react";
import type { Metadata } from "next";
import ShaleanWebsite from "@/components/ShaleanWebsite";

export const metadata: Metadata = {
  title: "Cleaning Services Across Cape Town Suburbs | Shalean",
  description:
    "Professional cleaning services across Cape Town suburbs including Sea Point, Claremont, Constantia, Durbanville, Century City, Table View, Gardens and Observatory.",
  openGraph: {
    title: "Cleaning Services Across Cape Town Suburbs | Shalean",
    description:
      "Find vetted home and Airbnb cleaners in top Cape Town suburbs with same‑week availability and transparent pricing.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cleaning Services Across Cape Town Suburbs | Shalean",
    description:
      "Book trusted cleaners in Sea Point, Claremont, Constantia, Durbanville and more Cape Town suburbs.",
  },
};

export default function LocationsRoutePage() {
  return (
    <Suspense fallback={null}>
      <ShaleanWebsite initialPage="locations" />
    </Suspense>
  );
}

