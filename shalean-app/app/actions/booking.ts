"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getProfileForSession } from "@/app/actions/profile";
import { computeCleanerEarnings } from "@/lib/revenue-split";
import type { Database } from "@/lib/database.types";
import type { ServiceType } from "@/lib/booking-routes";

type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];

/** Payload for creating a booking (after payment success). */
export interface CreateBookingPayload {
  bookingRef: string;
  service: ServiceType;
  propertyType: string;
  officeSize: string;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  workingArea: string;
  extras: string[];
  date: string;
  time: string;
  cleanerId: string;
  teamId: string;
  assignMe: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  instructions: string;
  subtotal: number;
  discountAmount: number;
  tipAmount: number;
  total: number;
  promoCode: string;
  paymentMethod: string;
  paymentRef?: string | null;
}

/**
 * Persist a completed booking. Call only after payment success.
 * Non-blocking: fire-and-forget from client so redirect is not delayed.
 */
function normalizePayload(p: CreateBookingPayload): CreateBookingPayload {
  return {
    bookingRef: p.bookingRef ?? "",
    service: p.service ?? "standard",
    propertyType: p.propertyType ?? "apartment",
    officeSize: p.officeSize ?? "",
    bedrooms: Number(p.bedrooms) || 0,
    bathrooms: Number(p.bathrooms) || 0,
    extraRooms: Number(p.extraRooms) || 0,
    workingArea: String(p.workingArea ?? "").trim() || "Cape Town",
    extras: Array.isArray(p.extras) ? p.extras : [],
    date: String(p.date ?? ""),
    time: String(p.time ?? ""),
    cleanerId: p.cleanerId ?? "",
    teamId: p.teamId ?? "",
    assignMe: Boolean(p.assignMe),
    customerName: String(p.customerName ?? "").trim(),
    customerEmail: String(p.customerEmail ?? "").trim(),
    customerPhone: String(p.customerPhone ?? "").trim(),
    address: String(p.address ?? "").trim(),
    instructions: p.instructions ?? "",
    subtotal: Number(p.subtotal) || 0,
    discountAmount: Number(p.discountAmount) || 0,
    tipAmount: Number(p.tipAmount) || 0,
    total: Number(p.total) || 0,
    promoCode: p.promoCode ?? "",
    paymentMethod: p.paymentMethod ?? "paystack",
    paymentRef: p.paymentRef ?? null,
  };
}

export async function createBooking(payload: CreateBookingPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const p = normalizePayload(payload);
    if (!p.date || !p.time) {
      return { ok: false, error: "Missing date or time" };
    }
    if (!p.customerName || !p.customerEmail || !p.customerPhone || !p.address.trim()) {
      return { ok: false, error: "Missing required customer or address fields" };
    }
    if (!p.workingArea.trim()) {
      return { ok: false, error: "Missing working area" };
    }
    const { serviceFeeAmount, cleanerEarnings } = computeCleanerEarnings(
      p.service,
      p.total,
      p.tipAmount
    );
    const supabase = createServerSupabase();
    const row: BookingInsert = {
      booking_ref: p.bookingRef,
      service: p.service,
      property_type: p.propertyType,
      office_size: p.officeSize || null,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      extra_rooms: p.extraRooms,
      working_area: p.workingArea,
      extras: p.extras,
      date: p.date,
      time: p.time,
      cleaner_id: p.cleanerId || null,
      team_id: p.teamId || null,
      assign_me: p.assignMe,
      customer_name: p.customerName,
      customer_email: p.customerEmail,
      customer_phone: p.customerPhone,
      address: p.address,
      instructions: p.instructions || null,
      subtotal: p.subtotal,
      discount_amount: p.discountAmount,
      tip_amount: p.tipAmount,
      total: p.total,
      service_fee_amount: serviceFeeAmount,
      cleaner_earnings: cleanerEarnings,
      promo_code: p.promoCode || null,
      payment_method: p.paymentMethod,
      payment_ref: p.paymentRef ?? null,
      payment_status: "paid",
      status: "confirmed",
    };
    const { error } = await supabase.from("bookings").insert(row);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}

/** Shape returned for confirmation page (no joins). */
export interface BookingForConfirmation {
  bookingRef: string;
  service: ServiceType;
  date: string;
  time: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  tipAmount: number;
  customerName: string;
  customerEmail: string;
}

/**
 * Fetch a booking by ref for the confirmation page.
 * Single indexed lookup by booking_ref; no joins.
 */
export async function getBookingByRef(ref: string): Promise<BookingForConfirmation | null> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select("booking_ref, service, date, time, total, subtotal, discount_amount, tip_amount, customer_name, customer_email")
      .eq("booking_ref", ref)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as {
      booking_ref: string;
      service: string;
      date: string;
      time: string;
      total: number;
      subtotal: number;
      discount_amount: number;
      tip_amount: number;
      customer_name: string;
      customer_email: string;
    };
    return {
      bookingRef: row.booking_ref,
      service: row.service as ServiceType,
      date: row.date,
      time: row.time,
      total: Number(row.total),
      subtotal: Number(row.subtotal),
      discountAmount: Number(row.discount_amount),
      tipAmount: Number(row.tip_amount),
      customerName: row.customer_name,
      customerEmail: row.customer_email,
    };
  } catch {
    return null;
  }
}

/** Customer-only: reschedule own booking (date/time). Only allowed for confirmed upcoming bookings. */
export async function updateBookingDateTimeForCustomer(
  bookingId: string,
  updates: { date: string; time: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "customer") {
    return { ok: false, error: "Only customers can reschedule their own bookings." };
  }

  const date = String(updates.date ?? "").trim();
  const time = String(updates.time ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Invalid date format (use YYYY-MM-DD)." };
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return { ok: false, error: "Invalid time format (e.g. 08:00, 10:00)." };
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const supabase = createServerSupabase();
    const { data: row, error: fetchError } = await supabase
      .from("bookings")
      .select("id, customer_email, status, date")
      .eq("id", bookingId)
      .maybeSingle();

    if (fetchError || !row) {
      return { ok: false, error: "Booking not found." };
    }
    const r = row as { customer_email: string; status: string; date: string };
    if (r.customer_email?.trim().toLowerCase() !== profile.email?.trim().toLowerCase()) {
      return { ok: false, error: "You can only reschedule your own bookings." };
    }
    if (r.status !== "confirmed") {
      return { ok: false, error: "Only confirmed bookings can be rescheduled." };
    }
    if (r.date < today) {
      return { ok: false, error: "Past bookings cannot be rescheduled." };
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        date,
        time,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateError) return { ok: false, error: updateError.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

/** Shape returned for rebook prefill (admin: any booking; customer: own only). */
export interface BookingForRebook {
  service: ServiceType;
  propertyType: string;
  officeSize: string;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  workingArea: string;
  extras: string[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  instructions: string;
}

/** Fetch full booking for rebook prefill. Admin: any; customer: own only (by email). */
export async function getBookingForRebook(bookingId: string): Promise<BookingForRebook | null> {
  const profile = await getProfileForSession();
  if (!profile) return null;

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "service, property_type, office_size, bedrooms, bathrooms, extra_rooms, working_area, extras, customer_name, customer_email, customer_phone, address, instructions"
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as {
      service: string;
      property_type: string;
      office_size: string | null;
      bedrooms: number;
      bathrooms: number;
      extra_rooms: number;
      working_area: string;
      extras: string[];
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      address: string;
      instructions: string | null;
    };

    if (profile.role !== "admin") {
      if (profile.role !== "customer") return null;
      if (row.customer_email?.trim().toLowerCase() !== profile.email?.trim().toLowerCase()) {
        return null;
      }
    }

    return {
      service: row.service as ServiceType,
      propertyType: row.property_type ?? "apartment",
      officeSize: row.office_size ?? "",
      bedrooms: Number(row.bedrooms) ?? 0,
      bathrooms: Number(row.bathrooms) ?? 0,
      extraRooms: Number(row.extra_rooms) ?? 0,
      workingArea: row.working_area ?? "",
      extras: Array.isArray(row.extras) ? row.extras : [],
      customerName: row.customer_name ?? "",
      customerEmail: row.customer_email ?? "",
      customerPhone: row.customer_phone ?? "",
      address: row.address ?? "",
      instructions: row.instructions ?? "",
    };
  } catch {
    return null;
  }
}

/** Payload for rebook: same as CreateBookingPayload but without bookingRef (used with initializePaystackTransaction). */
export type RebookPayload = Omit<CreateBookingPayload, "bookingRef">;

/**
 * Build payload to duplicate a past booking with new date/time only.
 * Same auth as getBookingForRebook (admin: any; customer: own only).
 * Does not copy cleaner_id/team_id/assign_me so the new booking can be assigned for the new slot.
 */
export async function getRebookPayload(
  bookingId: string,
  { date, time }: { date: string; time: string }
): Promise<{ ok: true; payload: RebookPayload } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile) {
    return { ok: false, error: "You must be signed in to rebook." };
  }

  const dateTrim = String(date ?? "").trim();
  const timeTrim = String(time ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTrim)) {
    return { ok: false, error: "Invalid date format (use YYYY-MM-DD)." };
  }
  if (!/^\d{2}:\d{2}$/.test(timeTrim)) {
    return { ok: false, error: "Invalid time format (e.g. 08:00, 10:00)." };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (dateTrim < today) {
    return { ok: false, error: "Please choose a future date." };
  }

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "service, property_type, office_size, bedrooms, bathrooms, extra_rooms, working_area, extras, customer_name, customer_email, customer_phone, address, instructions, subtotal, discount_amount, tip_amount, total, promo_code, payment_method"
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, error: "Booking not found." };
    }

    const row = data as {
      service: string;
      property_type: string;
      office_size: string | null;
      bedrooms: number;
      bathrooms: number;
      extra_rooms: number;
      working_area: string;
      extras: string[];
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      address: string;
      instructions: string | null;
      subtotal: number;
      discount_amount: number;
      tip_amount: number;
      total: number;
      promo_code: string | null;
      payment_method: string;
    };

    if (profile.role !== "admin") {
      if (profile.role !== "customer") {
        return { ok: false, error: "You cannot rebook this booking." };
      }
      if (row.customer_email?.trim().toLowerCase() !== profile.email?.trim().toLowerCase()) {
        return { ok: false, error: "You can only rebook your own bookings." };
      }
    }

    const payload: RebookPayload = {
      service: row.service as ServiceType,
      propertyType: row.property_type ?? "apartment",
      officeSize: row.office_size ?? "",
      bedrooms: Number(row.bedrooms) ?? 0,
      bathrooms: Number(row.bathrooms) ?? 0,
      extraRooms: Number(row.extra_rooms) ?? 0,
      workingArea: String(row.working_area ?? "").trim() || "Cape Town",
      extras: Array.isArray(row.extras) ? row.extras : [],
      date: dateTrim,
      time: timeTrim,
      cleanerId: "",
      teamId: "",
      assignMe: false,
      customerName: row.customer_name ?? "",
      customerEmail: row.customer_email ?? "",
      customerPhone: row.customer_phone ?? "",
      address: row.address ?? "",
      instructions: row.instructions ?? "",
      subtotal: Number(row.subtotal) ?? 0,
      discountAmount: Number(row.discount_amount) ?? 0,
      tipAmount: Number(row.tip_amount) ?? 0,
      total: Number(row.total) ?? 0,
      promoCode: row.promo_code ?? "",
      paymentMethod: row.payment_method ?? "paystack",
    };

    return { ok: true, payload };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}
