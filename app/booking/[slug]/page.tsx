import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

const BOOKING_SLUGS = ["your-cleaning-plan", "schedule", "details", "payment"];

export function generateStaticParams() {
  return BOOKING_SLUGS.map((slug) => ({ slug }));
}

const STEP_TITLES: Record<string, string> = {
  "your-cleaning-plan": "Book a clean – Shalean",
  schedule: "Schedule – Book a clean – Shalean",
  details: "Your details – Book a clean – Shalean",
  payment: "Payment – Book a clean – Shalean",
};

const STEP_DESCRIPTIONS: Record<string, string> = {
  "your-cleaning-plan":
    "Choose your cleaning plan. Book home, office or Airbnb cleaning in Cape Town.",
  schedule: "Pick a date and time for your Shalean cleaning.",
  details: "Enter your details for your Shalean cleaning booking.",
  payment: "Complete payment for your Shalean cleaning booking.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const url = `${SITE_URL}/booking/${slug}`;
  const title = STEP_TITLES[slug] ?? "Book a clean – Shalean";
  const description =
    STEP_DESCRIPTIONS[slug] ??
    "Book home, office or Airbnb cleaning in Cape Town. Choose your plan, schedule and pay securely.";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { url, title, description, type: "website" },
  };
}

export default function BookingRoutePage() {
  return <ShaleanWebsite />;
}

