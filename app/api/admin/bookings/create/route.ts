import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";
import type { BookingRecord, PricingBreakdown } from "@/lib/types/booking";
import { computePricingForBooking } from "@/lib/pricing";
import { computeEstimatedDurationMinutes } from "@/lib/duration";
import { sendPaymentLinkEmail } from "@/lib/email";

export const runtime = "nodejs";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string } | null)?.role;
  if (token && role === "admin") return true;
  return false;
}

/** Reference format for Paystack (customer can pay later). */
function generatePayableReference() {
  const random = Math.floor(10000000 + Math.random() * 90000000);
  return `SC${random}`;
}

interface AdminBookingPayload {
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
  promoCode?: string;
}

type AvailableCleaner = {
  id: string;
  name: string | null;
  avg_rating: number | null;
  rating_count: number | null;
};

function mapToBookingRecord(
  booking: AdminBookingPayload,
  pricing: PricingBreakdown,
  reference: string,
  currency: string,
  estimatedDurationMinutes: number,
  paymentStatus: "paid" | "unpaid"
): BookingRecord {
  const legacyBookingRef = reference.slice(0, 20);
  const isPaid = paymentStatus === "paid";
  return {
    reference,
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
    estimated_duration_minutes: estimatedDurationMinutes,
    base_amount: pricing.basePrice,
    discount_amount: pricing.discountAmount,
    tip_amount: pricing.tipAmount ?? 0,
    subtotal_amount: pricing.subtotal,
    total_amount: pricing.total,
    service_fee_amount: pricing.serviceFee ?? 0,
    equipment_charge_amount: pricing.equipmentCharge ?? 0,
    subtotal: pricing.subtotal,
    total: pricing.total,
    currency,
    payment_method: isPaid ? "admin" : "online",
    paystack_reference: reference,
    paystack_transaction_id: null,
    paystack_status: isPaid ? "admin" : null,
    paystack_raw_response: null,
    referred_by_email: null,
    status: isPaid ? "confirmed" : "pending",
  };
}

function generateAdminReference() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ADMIN-${Date.now()}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const booking = body.booking as AdminBookingPayload | undefined;

    if (!booking) {
      return NextResponse.json(
        { error: "Missing booking data" },
        { status: 400 }
      );
    }

    if (!booking.email?.trim() || !booking.date || !booking.time || !booking.name?.trim() || !booking.address?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, date, time, address" },
        { status: 400 }
      );
    }

    const paymentStatus = (body.paymentStatus === "unpaid" ? "unpaid" : "paid") as "paid" | "unpaid";
    const currency = process.env.PAYSTACK_CURRENCY || "ZAR";
    const reference = paymentStatus === "unpaid" ? generatePayableReference() : generateAdminReference();
    const supabase = await createClient();

    let payload = { ...booking };

    if (payload.cleanerId === "any" && payload.workingArea) {
      const { data, error: cleanersError } = await supabase.rpc(
        "get_available_cleaners",
        {
          p_working_area: payload.workingArea,
          p_booking_date: payload.date,
          p_booking_time: payload.time,
        }
      );
      const availableCleaners = data as AvailableCleaner[] | null;
      if (!cleanersError && availableCleaners && availableCleaners.length > 0) {
        payload.cleanerId = availableCleaners[0].id;
      } else {
        payload.cleanerId = "";
      }
    }

    const pricing = await computePricingForBooking({
      service: payload.service,
      bedrooms: payload.bedrooms,
      bathrooms: payload.bathrooms,
      extraRooms: payload.extraRooms,
      propertyType: payload.propertyType,
      officeSize: payload.officeSize,
      privateOffices: payload.privateOffices,
      meetingRooms: payload.meetingRooms,
      carpetedRooms: payload.carpetedRooms,
      looseRugs: payload.looseRugs,
      carpetExtraCleaners: payload.carpetExtraCleaners,
      extras: payload.extras,
      tipAmount: 0,
      promoCode: payload.promoCode,
      cleaningFrequency: payload.cleaningFrequency ?? "once",
    });

    const estimatedDurationMinutes = computeEstimatedDurationMinutes({
      service: payload.service,
      bedrooms: payload.bedrooms,
      bathrooms: payload.bathrooms,
      extraRooms: payload.extraRooms,
      propertyType: payload.propertyType,
      officeSize: payload.officeSize,
      privateOffices: payload.privateOffices,
      meetingRooms: payload.meetingRooms,
      carpetedRooms: payload.carpetedRooms,
      looseRugs: payload.looseRugs,
      carpetExtraCleaners: payload.carpetExtraCleaners,
      extras: payload.extras,
    });

    const bookingRecord = mapToBookingRecord(
      payload,
      pricing,
      reference,
      currency,
      estimatedDurationMinutes,
      paymentStatus
    );

    const { data: inserted, error: dbError } = await supabase
      .from("bookings")
      .insert(bookingRecord as BookingRecord)
      .select("id, reference, status, date, time, total_amount, service, email, name")
      .single();

    if (dbError) {
      console.error("Admin create booking: insert failed", dbError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    if (paymentStatus === "unpaid" && inserted?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      const insertedRow = inserted as { email?: string; name?: string; total_amount?: number; reference?: string; date?: string; time?: string };
      const totalAmount = Number(insertedRow.total_amount ?? 0);
      const amountInMinorUnits = Math.max(0, Math.round(totalAmount * 100));

      let paymentPageUrl = `${appUrl}/booking/pay?ref=${encodeURIComponent(reference)}`;

      if (paystackSecretKey && amountInMinorUnits > 0) {
        try {
          const paystackRes = await fetch(
            "https://api.paystack.co/transaction/initialize",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${paystackSecretKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: insertedRow.email,
                amount: amountInMinorUnits,
                currency,
                reference,
                callback_url: `${appUrl}/booking/verify`,
              }),
            }
          );
          if (paystackRes.ok) {
            const paystackJson = (await paystackRes.json()) as { data?: { authorization_url?: string } };
            const paystackUrl = paystackJson?.data?.authorization_url;
            if (paystackUrl) {
              paymentPageUrl = paystackUrl;
            }
          }
        } catch (paystackErr) {
          console.error("Paystack initialize for email link failed, using app fallback:", paystackErr);
        }
      }

      try {
        await sendPaymentLinkEmail({
          to: insertedRow.email!,
          name: insertedRow.name || "Customer",
          reference: String(insertedRow.reference ?? reference),
          date: String(insertedRow.date ?? ""),
          time: String(insertedRow.time ?? ""),
          totalAmount,
          currency,
          paymentPageUrl,
        });
      } catch (emailErr) {
        console.error("Failed to send payment link email:", emailErr);
      }
    }

    return NextResponse.json(
      {
        booking: inserted,
        message: "Booking created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/admin/bookings/create", error);
    const message =
      error instanceof Error ? error.message : "Unexpected error creating booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
