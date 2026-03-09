import React, { Suspense } from "react";
import type { Metadata } from "next";
import ShaleanWebsite from "../../components/ShaleanWebsite";

export const metadata: Metadata = {
  title: "Get a Cleaning Quote in Cape Town | Shalean",
  description:
    "Request a custom quote for home or Airbnb cleaning in Cape Town. Share your details and we’ll respond quickly with transparent pricing.",
  openGraph: {
    title: "Get a Cleaning Quote in Cape Town | Shalean",
    description:
      "Tell us about your home or Airbnb in Cape Town and get a fast, transparent cleaning quote from Shalean.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get a Cleaning Quote in Cape Town | Shalean",
    description:
      "Request a personalised cleaning quote for your Cape Town home or short‑term rental from Shalean.",
  },
};

export default function QuotePage() {
  return (
    <Suspense fallback={null}>
      <ShaleanWebsite initialPage="quote" />
    </Suspense>
  );
}
