"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getProfileForSession } from "@/app/actions/profile";
import type { CleanerProfile } from "@/lib/dashboard-types";

/** Submit a rating for a booking. Customer rates cleaner (rater_type=customer), cleaner rates customer (rater_type=cleaner). */
export async function submitBookingRating(
  bookingId: string,
  raterType: "customer" | "cleaner",
  rating: number,
  comment?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (rating < 1 || rating > 5) return { ok: false, error: "Rating must be between 1 and 5." };
  const profile = await getProfileForSession();
  if (!profile) return { ok: false, error: "Not signed in." };
  try {
    const supabase = createServerSupabase();
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, customer_email, cleaner_id")
      .eq("id", bookingId)
      .single();
    if (fetchErr || !booking) return { ok: false, error: "Booking not found." };

    if (raterType === "customer") {
      const sessionEmail = profile.role === "customer" ? profile.email : null;
      if (!sessionEmail || booking.customer_email !== sessionEmail) {
        return { ok: false, error: "Only the customer for this booking can rate the cleaner." };
      }
    } else {
      const cleanerId = profile.role === "cleaner" ? (profile as CleanerProfile).id : null;
      if (!cleanerId || booking.cleaner_id !== cleanerId) {
        return { ok: false, error: "Only the assigned cleaner can rate the customer." };
      }
    }

    const { error: insertErr } = await supabase.from("booking_ratings").upsert(
      {
        booking_id: bookingId,
        rater_type: raterType,
        rating: Math.round(rating),
        comment: comment?.trim() || null,
      },
      { onConflict: "booking_id,rater_type" }
    );
    if (insertErr) return { ok: false, error: insertErr.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

/** Booking IDs that the current customer has already rated (for customer dashboard). */
export async function getRatedBookingIdsForCustomer(): Promise<Set<string>> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "customer") return new Set();
  try {
    const supabase = createServerSupabase();
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("customer_email", profile.email);
    const ids = (bookings ?? []).map((b: { id: string }) => b.id);
    if (ids.length === 0) return new Set();
    const { data: ratings } = await supabase
      .from("booking_ratings")
      .select("booking_id")
      .eq("rater_type", "customer")
      .in("booking_id", ids);
    return new Set((ratings ?? []).map((r: { booking_id: string }) => r.booking_id));
  } catch {
    return new Set();
  }
}

export interface CleanerReviewRow {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** Reviews (customer ratings) for the given cleaner. */
export async function getCleanerReviews(cleanerId: string): Promise<CleanerReviewRow[]> {
  try {
    const supabase = createServerSupabase();
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("cleaner_id", cleanerId);
    const bookingIds = (bookings ?? []).map((b: { id: string }) => b.id);
    if (bookingIds.length === 0) return [];
    const { data: rows } = await supabase
      .from("booking_ratings")
      .select("id, booking_id, rating, comment, created_at")
      .eq("rater_type", "customer")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });
    return (rows ?? []).map((r: { id: string; booking_id: string; rating: number; comment: string | null; created_at: string }) => ({
      id: r.id,
      bookingId: r.booking_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

/** Average rating (1–5) for the cleaner from customer ratings; 0 if none. */
export async function getCleanerAverageRating(cleanerId: string): Promise<number> {
  try {
    const supabase = createServerSupabase();
    const { data: bookings } = await supabase.from("bookings").select("id").eq("cleaner_id", cleanerId);
    const bookingIds = (bookings ?? []).map((b: { id: string }) => b.id);
    if (bookingIds.length === 0) return 0;
    const { data: rows } = await supabase
      .from("booking_ratings")
      .select("rating")
      .eq("rater_type", "customer")
      .in("booking_id", bookingIds);
    const ratings = (rows ?? []).map((r: { rating: number }) => r.rating);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  } catch {
    return 0;
  }
}

/** Platform-wide rating stats from customer ratings (for public landing page). No auth required. */
export async function getPlatformRatingStats(): Promise<{
  averageRating: number;
  totalReviews: number;
}> {
  try {
    const supabase = createServerSupabase();
    const { data: rows } = await supabase
      .from("booking_ratings")
      .select("rating")
      .eq("rater_type", "customer");
    const ratings = (rows ?? []).map((r: { rating: number }) => r.rating);
    if (ratings.length === 0) return { averageRating: 0, totalReviews: 0 };
    const sum = ratings.reduce((a, b) => a + b, 0);
    const averageRating = Math.round((sum / ratings.length) * 10) / 10;
    return { averageRating, totalReviews: ratings.length };
  } catch {
    return { averageRating: 0, totalReviews: 0 };
  }
}
