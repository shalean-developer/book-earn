import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * GET /api/booking/pay-by-reference?reference=SC12345678
 * Returns Paystack authorization URL for an existing (pending) booking.
 * Used by the payment link in the customer email and by the /booking/pay page.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference")?.trim();

    if (!reference || !reference.startsWith("SC")) {
      return NextResponse.json(
        { error: "Invalid or missing reference" },
        { status: 400 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!paystackSecretKey || !appUrl) {
      return NextResponse.json(
        { error: "Payment is not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("bookings")
      .select("id, status, paystack_status, total_amount, currency, email")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (error) {
      console.error("Pay-by-reference: fetch booking error", error);
      return NextResponse.json(
        { error: "Could not load booking" },
        { status: 500 }
      );
    }

    if (!row) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const status = (row as { status?: string }).status;
    const paystackStatus = (row as { paystack_status?: string | null }).paystack_status;

    if (status !== "pending") {
      return NextResponse.json(
        { error: "This booking is already paid or no longer pending" },
        { status: 400 }
      );
    }

    if (paystackStatus === "success") {
      return NextResponse.json(
        { error: "Payment already completed" },
        { status: 400 }
      );
    }

    const totalAmount = Number((row as { total_amount?: number }).total_amount ?? 0);
    const currency = (row as { currency?: string }).currency || "ZAR";
    const email = (row as { email?: string }).email || "";

    if (totalAmount <= 0 || !email) {
      return NextResponse.json(
        { error: "Invalid booking data" },
        { status: 400 }
      );
    }

    const amountInMinorUnits = Math.max(0, Math.round(totalAmount * 100));

    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amountInMinorUnits,
          currency,
          reference,
          callback_url: `${appUrl.replace(/\/$/, "")}/booking/verify`,
        }),
      }
    );

    if (!paystackRes.ok) {
      const text = await paystackRes.text();
      console.error("Paystack initialize (pay-by-reference) failed", text);
      return NextResponse.json(
        { error: "Failed to start payment" },
        { status: 502 }
      );
    }

    const paystackJson = (await paystackRes.json()) as {
      data?: { authorization_url?: string };
    };
    const authorizationUrl = paystackJson?.data?.authorization_url;

    if (!authorizationUrl) {
      return NextResponse.json(
        { error: "Invalid response from payment provider" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { authorizationUrl: authorizationUrl as string },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in pay-by-reference", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
