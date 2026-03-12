import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const tokenData = token as (null | { role?: unknown; email?: unknown });
    const role = typeof tokenData?.role === "string" ? tokenData.role : undefined;
    const email = typeof tokenData?.email === "string" ? tokenData.email : undefined;

    if (!token || role !== "customer" || !email) {
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

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, email, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      console.error("Error verifying booking for rating:", bookingError);
      return NextResponse.json(
        { error: "Failed to verify booking" },
        { status: 500 },
      );
    }
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const bookingEmail =
      typeof booking.email === "string" ? booking.email.toLowerCase() : "";
    if (!bookingEmail || bookingEmail !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "You can only rate your own bookings" },
        { status: 403 },
      );
    }

    const status =
      typeof booking.status === "string"
        ? booking.status.toLowerCase()
        : undefined;
    if (status && !["completed", "confirmed"].includes(status)) {
      return NextResponse.json(
        { error: "You can only rate completed bookings" },
        { status: 400 },
      );
    }

    const { data: upserted, error: ratingError } = await supabase
      .from("booking_ratings")
      .upsert(
        {
          booking_id: bookingId,
          rater_type: "customer",
          rating: Math.round(ratingNumber),
          comment,
        },
        { onConflict: "booking_id,rater_type" },
      )
      .select("id, rating, comment, created_at")
      .maybeSingle();

    if (ratingError) {
      console.error("Error saving customer rating:", ratingError);
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
    console.error("Unexpected error in customer ratings POST:", err);
    return NextResponse.json(
      { error: "Unexpected error saving rating" },
      { status: 500 },
    );
  }
}

