import React, { Suspense } from "react";
import type { Metadata } from "next";
import ShaleanWebsite from "@/components/ShaleanWebsite";

export const metadata: Metadata = {
  title: "Cleaning Jobs in Cape Town | Shalean Careers",
  description:
    "Apply for cleaner and team leader roles at Shalean Cleaning Services in Cape Town. Flexible schedules, competitive pay and training provided.",
  openGraph: {
    title: "Cleaning Jobs in Cape Town | Shalean Careers",
    description:
      "Join the Shalean Cleaning Services team in Cape Town. View cleaner, team leader and operations roles with training and growth opportunities.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cleaning Jobs in Cape Town | Shalean Careers",
    description:
      "Start or grow your cleaning career in Cape Town with Shalean — flexible hours, training and reliable work.",
  },
};

export default function CareersRoutePage() {
  return (
    <Suspense fallback={null}>
      <ShaleanWebsite initialPage="careers" />
    </Suspense>
  );
}

