import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createBooking, getBookingByRef } from "@/app/actions/booking";
import type { CreateBookingPayload } from "@/app/actions/booking";
import { getConfirmationPath, getBookingPath, DEFAULT_SERVICE } from "@/lib/booking-routes";
import { getBaseUrl } from "@/lib/base-url";

const PAYSTACK_VERIFY = "https://api.paystack.co/transaction/verify/";

function redirectToStep1WithError(error: string, detail?: string): NextResponse {
  const baseUrl = getBaseUrl();
  const path = getBookingPath(DEFAULT_SERVICE, 1);
  const params = new URLSearchParams({ error });
  if (detail && process.env.NODE_ENV === "development") {
    params.set("msg", detail);
  }
  const url = `${baseUrl}${path}?${params.toString()}`;
  return NextResponse.redirect(url);
}

function redirectToConfirmation(bookingRef: string): NextResponse {
  const url = getBaseUrl() + getConfirmationPath(bookingRef);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference"); // Paystack transaction reference
  const refFromUrl = searchParams.get("ref"); // our booking_ref (from our callback_url)

  if (!reference) {
    return redirectToStep1WithError("payment_cancelled");
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return redirectToStep1WithError("config");
  }

  try {
    const verifyRes = await fetch(`${PAYSTACK_VERIFY}${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return redirectToStep1WithError("payment_failed");
    }

    const metadata = verifyData.data?.metadata;
    const refFromMetadata =
      metadata?.booking_ref != null ? String(metadata.booking_ref) : undefined;
    const bookingRef = refFromUrl ?? refFromMetadata;
    if (!bookingRef) {
      return redirectToStep1WithError("invalid_ref");
    }

    // Idempotent: if booking already created (e.g. by webhook), redirect to confirmation
    const existing = await getBookingByRef(bookingRef);
    if (existing) {
      return redirectToConfirmation(bookingRef);
    }

    const supabase = createServerSupabase();
    const { data: pending, error: fetchError } = await supabase
      .from("pending_payments")
      .select("payload")
      .eq("booking_ref", bookingRef)
      .maybeSingle();

    if (fetchError || !pending) {
      // Pending already consumed (e.g. webhook) or missing; redirect to confirmation so user sees result
      return redirectToConfirmation(bookingRef);
    }

    const raw = pending.payload as Record<string, unknown> | null;
    const dateRaw = raw?.date != null ? String(raw.date) : "";
    const timeRaw = raw?.time != null ? String(raw.time) : "";
    const fallbackDate = new Date().toISOString().slice(0, 10);
    const createPayload: CreateBookingPayload = {
      bookingRef,
      service: (raw?.service as CreateBookingPayload["service"]) ?? "standard",
      propertyType: String(raw?.propertyType ?? "apartment"),
      officeSize: String(raw?.officeSize ?? ""),
      bedrooms: Number(raw?.bedrooms) ?? 0,
      bathrooms: Number(raw?.bathrooms) ?? 0,
      extraRooms: Number(raw?.extraRooms) ?? 0,
      workingArea: String(raw?.workingArea ?? "").trim() || "Cape Town",
      extras: Array.isArray(raw?.extras) ? (raw.extras as string[]) : [],
      date: dateRaw.trim() || fallbackDate,
      time: timeRaw.trim() || "09:00",
      cleanerId: String(raw?.cleanerId ?? ""),
      teamId: String(raw?.teamId ?? ""),
      assignMe: Boolean(raw?.assignMe),
      customerName: String(raw?.customerName ?? "").trim(),
      customerEmail: String(raw?.customerEmail ?? "").trim(),
      customerPhone: String(raw?.customerPhone ?? "").trim(),
      address: String(raw?.address ?? "").trim(),
      instructions: String(raw?.instructions ?? ""),
      subtotal: Number(raw?.subtotal) ?? 0,
      discountAmount: Number(raw?.discountAmount) ?? 0,
      tipAmount: Number(raw?.tipAmount) ?? 0,
      total: Number(raw?.total) ?? 0,
      promoCode: String(raw?.promoCode ?? ""),
      paymentMethod: "paystack",
      paymentRef: reference,
    };

    const result = await createBooking(createPayload);
    if (!result.ok) {
      const err = result.error ?? "";
      const isDuplicate =
        err.toLowerCase().includes("duplicate") ||
        err.toLowerCase().includes("unique constraint");
      if (isDuplicate) {
        return redirectToConfirmation(bookingRef);
      }
      console.error("[Paystack callback] createBooking failed:", err);
      return redirectToStep1WithError("booking_failed", err);
    }

    await supabase.from("pending_payments").delete().eq("booking_ref", bookingRef);

    return redirectToConfirmation(bookingRef);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[Paystack callback] unexpected error:", message);
    return redirectToStep1WithError("callback_error", message);
  }
}
