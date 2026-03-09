"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import {
  createBooking,
  type CreateBookingPayload,
} from "@/app/actions/booking";
import type { Database } from "@/lib/database.types";
import { getBaseUrl } from "@/lib/base-url";

type PendingPaymentInsert =
  Database["public"]["Tables"]["pending_payments"]["Insert"];

/** Input for initializing Paystack: same as CreateBookingPayload but bookingRef is generated server-side. */
export type InitializePaystackInput = Omit<CreateBookingPayload, "bookingRef">;

function generateBookingRef(): string {
  return "SHL-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function initializePaystackTransaction(
  input: InitializePaystackInput
): Promise<
  { ok: true; authorization_url: string; reference: string } | { ok: false; error: string }
> {
  const email = (input.customerEmail ?? "").trim();
  if (!email) {
    return { ok: false, error: "Please enter your email address in the Details step." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const customerName = (input.customerName ?? "").trim();
  const customerPhone = (input.customerPhone ?? "").trim();
  const address = (input.address ?? "").trim();
  if (!customerName || !customerPhone || !address) {
    return {
      ok: false,
      error: "Please complete the Details step with your name, phone, and address before paying.",
    };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { ok: false, error: "Paystack is not configured." };
  }

  if (!input.date?.trim() || !input.time?.trim()) {
    return { ok: false, error: "Please select a date and time in the Schedule step." };
  }

  const bookingRef = generateBookingRef();
  const payload: CreateBookingPayload = {
    ...input,
    bookingRef,
    customerEmail: email,
  };

  try {
    const supabase = createServerSupabase();
    const row: PendingPaymentInsert = {
      booking_ref: bookingRef,
      payload: payload as unknown as Database["public"]["Tables"]["pending_payments"]["Row"]["payload"],
    };
    const { error: insertError } = await supabase
      .from("pending_payments")
      .insert(row);
    if (insertError) {
      return { ok: false, error: "Failed to save payment session." };
    }

    const amountInCents = Math.round(payload.total * 100);
    const baseUrl = getBaseUrl();
    const callbackUrl = `${baseUrl}/api/paystack/callback?ref=${encodeURIComponent(bookingRef)}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInCents,
        currency: "ZAR",
        callback_url: callbackUrl,
        metadata: {
          booking_ref: bookingRef,
        },
      }),
    });

    const data = await res.json();
    if (!data.status || !data.data?.authorization_url) {
      const msg = data.message || "Paystack could not create payment link.";
      return { ok: false, error: msg };
    }

    return {
      ok: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference || "",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}
