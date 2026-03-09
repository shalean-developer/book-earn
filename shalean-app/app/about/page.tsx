import React, { Suspense } from "react";
import type { Metadata } from "next";
import ShaleanWebsite from "@/components/ShaleanWebsite";

export const metadata: Metadata = {
  title: "About Shalean Cleaning Services | Cape Town",
  description:
    "Learn about Shalean Cleaning Services, a Cape Town‑born cleaning company focused on trust, quality and professional home and Airbnb cleaning.",
  openGraph: {
    title: "About Shalean Cleaning Services | Cape Town",
    description:
      "Discover the story, mission and team behind Shalean Cleaning Services, serving homes and Airbnbs across Cape Town.",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Shalean Cleaning Services | Cape Town",
    description:
      "Get to know Shalean Cleaning Services, a local Cape Town cleaning company built on trust and quality.",
  },
};

export default function AboutRoutePage() {
  return (
    <Suspense fallback={null}>
      <ShaleanWebsite initialPage="about" />
    </Suspense>
  );
}

