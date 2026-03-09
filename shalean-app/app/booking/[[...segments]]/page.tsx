import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingFlowFromUrl } from "@/components/BookingFlowFromUrl";
import { getActivePricingConfig } from "@/app/actions/pricing";
import {
  parseBookingPathFromSegments,
  serviceTitleFromSlug,
  BOOKING_BASE,
  SERVICE_SLUGS,
  DEFAULT_SERVICE,
} from "@/lib/booking-routes";

type Props = { params: Promise<{ segments?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  const segmentList = segments ?? [];
  if (segmentList.length === 0) {
    return {
      title: "Book Cleaning | Shalean",
      description: "Book professional cleaning in Cape Town.",
      openGraph: {
        title: "Book Cleaning in Cape Town | Shalean",
        description: "Choose your service, date and time to book a trusted cleaner anywhere in Cape Town.",
      },
      twitter: {
        card: "summary_large_image",
        title: "Book Cleaning in Cape Town | Shalean",
        description: "Book a professional cleaner in Cape Town in a few simple steps.",
      },
    };
  }
  const parsed = parseBookingPathFromSegments(segmentList);
  if (!parsed) {
    return {
      title: "Book Cleaning | Shalean",
      description: "Book professional cleaning in Cape Town.",
    };
  }
  if (parsed.kind === "confirmation") {
    return {
      title: `Booking Confirmed ${parsed.ref} | Shalean`,
      description: "Your cleaning booking is confirmed. Check your email for details.",
    };
  }
  const serviceTitle = serviceTitleFromSlug(parsed.serviceSlug);
  const stepTitles: Record<number, string> = {
    1: "Plan",
    2: "Schedule",
    3: "Cleaner",
    4: "Details",
    5: "Payment",
  };
  const stepTitle = stepTitles[parsed.step] ?? "Book";
  return {
    title: `Book ${serviceTitle} – ${stepTitle} | Shalean`,
    description: `Book ${serviceTitle} in Cape Town. ${stepTitle} step of your cleaning booking.`,
  };
}

export default async function BookingSegmentsPage({ params }: Props) {
  const { segments } = await params;
  const segmentList = segments ?? [];
  if (segmentList.length === 0) {
    redirect(`${BOOKING_BASE}/${SERVICE_SLUGS[DEFAULT_SERVICE]}`);
  }

  const pricingConfigRows = await getActivePricingConfig();

  return <BookingFlowFromUrl segments={segmentList} pricingConfigRows={pricingConfigRows} />;
}
