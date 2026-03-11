import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { BookingRecord, PricingBreakdown } from "@/lib/types/booking";
import { computePricingForBooking } from "@/lib/pricing";

export const runtime = "nodejs";

interface BookingFormPayload {
  service: string;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  propertyType: string;
  officeSize: string;
  privateOffices: number;
  meetingRooms: number;
  carpetedRooms: number;
  looseRugs: number;
  carpetExtraCleaners: number;
  extras: string[];
  cleanerId: string;
  teamId: string;
  workingArea: string;
  cleaningFrequency: string;
  cleaningDays: string[];
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  apartmentUnit: string;
  instructions: string;
  promoCode: string;
}

function mapToBookingRecord(
  booking: BookingFormPayload,
  pricing: PricingBreakdown,
  reference: string,
  currency: string
): BookingRecord {
  const legacyBookingRef = reference.slice(0, 20);

  return {
    // Let Supabase apply its own default status to satisfy existing checks.
    reference,
    // Mirror into legacy NOT NULL columns so Supabase accepts the insert
    booking_ref: legacyBookingRef,

    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    address: booking.address,

    customer_name: booking.name,
    customer_email: booking.email,
    customer_phone: booking.phone,

    service: booking.service,
    bedrooms: booking.bedrooms,
    bathrooms: booking.bathrooms,
    extra_rooms: booking.extraRooms,
    property_type: booking.propertyType,
    office_size: booking.officeSize,
    private_offices: booking.privateOffices,
    meeting_rooms: booking.meetingRooms,
    carpeted_rooms: booking.carpetedRooms,
    loose_rugs: booking.looseRugs,
    carpet_extra_cleaners: booking.carpetExtraCleaners,
    extras: booking.extras,
    cleaner_id: booking.cleanerId || null,
    team_id: booking.teamId || null,
    working_area: booking.workingArea,
    cleaning_frequency: booking.cleaningFrequency,
    cleaning_days: booking.cleaningDays,
    date: booking.date,
    time: booking.time,
    instructions: booking.instructions,
    apartment_unit: booking.apartmentUnit || "",

    base_amount: pricing.basePrice,
    discount_amount: pricing.discountAmount,
    tip_amount: pricing.tipAmount,
    subtotal_amount: pricing.subtotal,
    total_amount: pricing.total,
    subtotal: pricing.subtotal,
    total: pricing.total,
    currency,

    payment_method: "online",

    paystack_reference: reference,
    paystack_transaction_id: null,
    paystack_status: null,
    paystack_raw_response: null,
  };
}

function generateReference() {
  // Generate a reference in the format SC######## (e.g. SC34429287)
  const random = Math.floor(10000000 + Math.random() * 90000000); // 8 digits
  return `SC${random}`;
}

type AvailableCleaner = {
  id: string;
  name: string | null;
  avg_rating: number | null;
  rating_count: number | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const booking = body.booking as BookingFormPayload | undefined;
    const clientPricing = body.pricing as PricingBreakdown | undefined;

    if (!booking) {
      return NextResponse.json(
        { error: "Missing booking data" },
        { status: 400 }
      );
    }

    if (!booking.email || !booking.date || !booking.time) {
      return NextResponse.json(
        { error: "Missing required booking fields" },
        { status: 400 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "PAYSTACK_SECRET_KEY is not configured" },
        { status: 500 }
      );
    }

    if (!appUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL is not configured" },
        { status: 500 }
      );
    }

    const currency = process.env.PAYSTACK_CURRENCY || "ZAR";
    const reference = generateReference();

    const supabase = await createClient();

    // If the customer selected "any" cleaner, automatically assign
    // the best-rated available cleaner for the chosen area/date/time.
    if (booking.cleanerId === "any") {
      const { data, error: cleanersError } = await supabase.rpc(
        "get_available_cleaners",
        {
        p_working_area: booking.workingArea,
        p_booking_date: booking.date,
        p_booking_time: booking.time,
        }
      );

      const availableCleaners = data as AvailableCleaner[] | null;

      if (cleanersError) {
        console.error("Failed to fetch available cleaners for auto-assignment", cleanersError);
      } else if (availableCleaners && availableCleaners.length > 0) {
        // Pick the highest-rated available cleaner (query is already ordered)
        booking.cleanerId = availableCleaners[0].id;
      } else {
        // No cleaner available for that slot – fall back to null so the booking
        // can still be created and handled manually by ops.
        booking.cleanerId = null as unknown as string;
      }
    }

    const pricing = await computePricingForBooking({
      service: booking.service,
      bedrooms: booking.bedrooms,
      bathrooms: booking.bathrooms,
      extraRooms: booking.extraRooms,
      propertyType: booking.propertyType,
      officeSize: booking.officeSize,
      privateOffices: booking.privateOffices,
      meetingRooms: booking.meetingRooms,
      carpetedRooms: booking.carpetedRooms,
      looseRugs: booking.looseRugs,
      carpetExtraCleaners: booking.carpetExtraCleaners,
      extras: booking.extras,
      tipAmount: (clientPricing && clientPricing.tipAmount) ?? 0,
      promoCode: booking.promoCode,
      cleaningFrequency: booking.cleaningFrequency,
    });

    const bookingRecord = mapToBookingRecord(
      booking,
      pricing,
      reference,
      currency
    );

    const { error: dbError } = await supabase
      .from("bookings")
      .insert(bookingRecord as BookingRecord);

    if (dbError) {
      console.error("Failed to insert booking", dbError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    const amountInMinorUnits = Math.max(0, Math.round(pricing.total * 100));

    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: booking.email,
          amount: amountInMinorUnits,
          currency,
          reference,
          callback_url: `${appUrl.replace(/\/$/, "")}/booking/verify`,
        }),
      }
    );

    if (!paystackRes.ok) {
      let errorMessage = "Failed to initialize payment";
      try {
        const text = await paystackRes.text();
        console.error("Paystack init failed", text);
        const parsed = JSON.parse(text) as
          | { message?: string; status?: boolean }
          | undefined;
        if (parsed?.message) {
          errorMessage = `Payment provider error: ${parsed.message}`;
        }
      } catch {
        // ignore parse errors, we already logged raw text above
      }
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    const paystackJson = await paystackRes.json();
    const authorizationUrl = paystackJson?.data?.authorization_url;

    if (!authorizationUrl) {
      console.error("Paystack response missing authorization_url", paystackJson);
      return NextResponse.json(
        { error: "Invalid response from payment provider" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        authorizationUrl: authorizationUrl as string,
        reference,
        pricing,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/booking/initialize", error);
    const message =
      error instanceof Error && error.message
        ? `Failed to initialize booking: ${error.message}`
        : "Unexpected error while initializing booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

