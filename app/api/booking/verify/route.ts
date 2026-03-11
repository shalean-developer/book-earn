import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { BookingRecord, PricingBreakdown } from "@/lib/types/booking";
import { sendBookingEmails } from "@/lib/email";

interface VerifyResponse {
  status: string;
  data?: {
    status: string;
    reference: string;
    id: number;
    amount: number;
    currency: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reference = body.reference as string | undefined;

    if (!reference) {
      return NextResponse.json(
        { error: "Missing payment reference" },
        { status: 400 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "PAYSTACK_SECRET_KEY is not configured" },
        { status: 500 }
      );
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    if (!verifyRes.ok) {
      const text = await verifyRes.text();
      console.error("Paystack verify failed", text);
      return NextResponse.json(
        { error: "Failed to verify payment" },
        { status: 502 }
      );
    }

    const verifyJson = (await verifyRes.json()) as VerifyResponse;
    const paystackStatus = verifyJson?.data?.status;

    const supabase = await createClient();

    const { data: bookingRow, error: fetchError } = await supabase
      .from<BookingRecord>("bookings")
      .select("*")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to fetch booking for verification", fetchError);
      return NextResponse.json(
        { error: "Failed to load booking" },
        { status: 500 }
      );
    }

    if (!bookingRow) {
      return NextResponse.json(
        { error: "Booking not found for this reference" },
        { status: 404 }
      );
    }

    const isSuccess = paystackStatus === "success";

    const { data: updatedBooking, error: updateError } = await supabase
      .from<BookingRecord>("bookings")
      .update({
        status: isSuccess ? "confirmed" : "failed",
        paystack_status: paystackStatus ?? null,
        paystack_transaction_id: verifyJson?.data?.id ?? null,
        paystack_raw_response: verifyJson,
      } as Partial<BookingRecord>)
      .eq("paystack_reference", reference)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("Failed to update booking after verification", updateError);
      return NextResponse.json(
        { error: "Failed to update booking after verification" },
        { status: 500 }
      );
    }

    if (!isSuccess) {
      return NextResponse.json(
        { error: "Payment not successful", status: paystackStatus },
        { status: 400 }
      );
    }

    const pricing: PricingBreakdown = {
      basePrice: updatedBooking.base_amount,
      bedroomAdd: 0,
      bathroomAdd: 0,
      extraRoomsAdd: 0,
      officePrivateAdd: 0,
      officeMeetingAdd: 0,
      officeScaleAdd: 0,
      carpetRoomsAdd: 0,
      looseRugsAdd: 0,
      carpetExtraCleanerAdd: 0,
      extrasTotal: updatedBooking.extras?.length ? updatedBooking.extras.length : 0,
      tipAmount: updatedBooking.tip_amount,
      discountAmount: updatedBooking.discount_amount,
      subtotal: updatedBooking.subtotal_amount,
      total: updatedBooking.total_amount,
    };

    await sendBookingEmails({
      booking: updatedBooking,
      pricing,
    });

    return NextResponse.json(
      {
        status: "success",
        booking: {
          reference: updatedBooking.reference,
          date: updatedBooking.date,
          time: updatedBooking.time,
          service: updatedBooking.service,
          total: updatedBooking.total_amount,
          currency: updatedBooking.currency,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/booking/verify", error);
    return NextResponse.json(
      { error: "Unexpected error while verifying payment" },
      { status: 500 }
    );
  }
}

