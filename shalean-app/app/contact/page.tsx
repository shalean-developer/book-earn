import React, { Suspense } from "react";
import type { Metadata } from "next";
import ShaleanWebsite from "@/components/ShaleanWebsite";

export const metadata: Metadata = {
  title: "Contact Shalean Cleaning Services in Cape Town",
  description:
    "Contact Shalean Cleaning Services for quotes, bookings or support. Call, WhatsApp or email our Cape Town team.",
  openGraph: {
    title: "Contact Shalean Cleaning Services in Cape Town",
    description:
      "Get in touch with Shalean Cleaning Services in Cape Town for cleaning quotes, bookings and customer support.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Shalean Cleaning Services in Cape Town",
    description:
      "Reach the Shalean team in Cape Town by phone, WhatsApp or email to discuss your cleaning needs.",
  },
};

export default function ContactRoutePage() {
  return (
    <Suspense fallback={null}>
      <ShaleanWebsite initialPage="contact" />
    </Suspense>
  );
}

