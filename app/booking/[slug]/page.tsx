import { ShaleanWebsite } from "@/components/ShaleanWebsite";

const BOOKING_SLUGS = ["your-cleaning-plan", "schedule", "details", "payment"];

export function generateStaticParams() {
  return BOOKING_SLUGS.map((slug) => ({ slug }));
}

export default function BookingRoutePage() {
  return <ShaleanWebsite />;
}

