import type { Metadata } from "next";
import { ShaleanWebsite } from "@/components/ShaleanWebsite";
import { SITE_URL } from "@/lib/utils";

const BOOKING_SLUGS = [
  "your-cleaning-plan",
  "preferences",
  "schedule",
  "cleaner",
  "your-details",
  "checkout",
  "tip-promo",
];

export function generateStaticParams() {
  return BOOKING_SLUGS.map((slug) => ({ slug }));
}

const STEP_TITLES: Record<string, string> = {
  "your-cleaning-plan": "Book a clean – Bokkies",
  preferences: "Preferences – Book a clean – Bokkies",
  schedule: "Schedule – Book a clean – Bokkies",
  cleaner: "Cleaner & team – Book a clean – Bokkies",
  "your-details": "Your details – Book a clean – Bokkies",
  checkout: "Payment – Book a clean – Bokkies",
  "tip-promo": "Schedule – Book a clean – Bokkies",
};

const STEP_DESCRIPTIONS: Record<string, string> = {
  "your-cleaning-plan":
    "Choose your cleaning plan. Book home, office or Airbnb cleaning in Cape Town.",
  preferences: "Choose optional add-on extras for your clean.",
  schedule:
    "Choose date, time, and promo code for your Bokkies cleaning.",
  "your-details":
    "Enter your contact details to complete your Bokkies booking.",
  cleaner:
    "Choose your preferred cleaner or team and optionally add a tip for your Bokkies booking.",
  checkout: "Review terms and pay securely with Paystack.",
  "tip-promo":
    "Choose date, time, and promo code for your Bokkies cleaning.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const url = `${SITE_URL}/booking/${slug}`;
  const title = STEP_TITLES[slug] ?? "Book a clean – Bokkies";
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

