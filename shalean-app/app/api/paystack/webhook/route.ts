import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { createBooking, getBookingByRef } from "@/app/actions/booking";
import type { CreateBookingPayload } from "@/app/actions/booking";

const PAYSTACK_VERIFY = "https://api.paystack.co/transaction/verify/";

function verifyPaystackSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const hash = crypto.createHmac("sha512", secret).update(payload).digest("hex");
  if (hash.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, "utf8"), Buffer.from(signature, "utf8"));
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const signature = request.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(rawBody, signature, secretKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    data?: {
      reference?: string;
      transfer_code?: string;
      status?: string;
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event;

  // Handle transfer lifecycle events (cleaner payouts)
  if (
    eventType === "transfer.success" ||
    eventType === "transfer.failed" ||
    eventType === "transfer.reversed"
  ) {
    const transferCode = event.data?.transfer_code;
    const status =
      eventType === "transfer.success"
        ? "success"
        : eventType === "transfer.failed"
          ? "failed"
          : "reversed";
    if (transferCode) {
      try {
        const supabase = createServerSupabase();
        const { data: rows } = await supabase
          .from("payouts")
          .select("id, status")
          .eq("paystack_transfer_code", transferCode)
          .limit(1);
        if (rows?.length === 1 && (rows[0] as { status: string }).status === "pending") {
          await supabase
            .from("payouts")
            .update({ status })
            .eq("id", (rows[0] as { id: string }).id);
        }
      } catch {
        // Still return 200 so Paystack doesn't retry
      }
    }
    return NextResponse.json({ received: true });
  }

  if (eventType !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference;
  if (!reference) {
    return NextResponse.json({ received: true });
  }

  try {
    const verifyRes = await fetch(`${PAYSTACK_VERIFY}${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.status || verifyData.data?.status !== "success") {
      return NextResponse.json({ received: true });
    }

    const bookingRef = verifyData.data?.metadata?.booking_ref;
    if (!bookingRef) {
      return NextResponse.json({ received: true });
    }

    const existing = await getBookingByRef(bookingRef);
    if (existing) {
      return NextResponse.json({ received: true });
    }

    const supabase = createServerSupabase();
    const { data: pending, error: fetchError } = await supabase
      .from("pending_payments")
      .select("payload")
      .eq("booking_ref", bookingRef)
      .maybeSingle();

    if (fetchError || !pending) {
      return NextResponse.json({ received: true });
    }

    const payload = pending.payload as unknown as CreateBookingPayload;
    const createPayload: CreateBookingPayload = {
      ...payload,
      paymentMethod: "paystack",
      paymentRef: reference,
    };

    await createBooking(createPayload);
    await supabase.from("pending_payments").delete().eq("booking_ref", bookingRef);
  } catch {
    // Still return 200 so Paystack doesn't retry indefinitely
  }

  return NextResponse.json({ received: true });
}
