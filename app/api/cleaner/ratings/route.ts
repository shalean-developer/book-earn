import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * POST /api/cleaner/ratings
 * Cleaner rates the customer after job is completed.
 * Body: { bookingId: string, rating: number (1-5), comment?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const t = token as (null | { role?: string; phone?: string });
    if (!token || t?.role !== "cleaner" || !t?.phone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      bookingId?: string;
      rating?: number;
      comment?: string;
    };

    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    const ratingNumber = Number(body.rating);
    const comment =
      typeof body.comment === "string" && body.comment.trim()
        ? body.comment.trim()
        : null;

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "cleaner")
      .eq("phone", t.phone)
      .single();

    const cleanerId = profile?.id as string | undefined;
    if (!cleanerId) {
      return NextResponse.json({ error: "Cleaner profile not found" }, { status: 403 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, cleaner_id, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      console.error("Error verifying booking for cleaner rating:", bookingError);
      return NextResponse.json(
        { error: "Failed to verify booking" },
        { status: 500 },
      );
    }
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.cleaner_id !== cleanerId) {
      return NextResponse.json(
        { error: "You can only rate jobs assigned to you" },
        { status: 403 },
      );
    }

    const status =
      typeof booking.status === "string" ? booking.status.toLowerCase() : "";
    if (status !== "completed") {
      return NextResponse.json(
        { error: "You can only rate after the job is completed" },
        { status: 400 },
      );
    }

    const { data: upserted, error: ratingError } = await supabase
      .from("booking_ratings")
      .upsert(
        {
          booking_id: bookingId,
          rater_type: "cleaner",
          rating: Math.round(ratingNumber),
          comment,
        },
        { onConflict: "booking_id,rater_type" },
      )
      .select("id, rating, comment, created_at")
      .maybeSingle();

    if (ratingError) {
      console.error("Error saving cleaner rating:", ratingError);
      return NextResponse.json(
        { error: "Failed to save rating" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        rating: {
          id: upserted?.id,
          rating: upserted?.rating,
          comment: upserted?.comment,
          createdAt: upserted?.created_at,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Unexpected error in cleaner ratings POST:", err);
    return NextResponse.json(
      { error: "Unexpected error saving rating" },
      { status: 500 },
    );
  }
}
