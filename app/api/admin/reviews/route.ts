import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("booking_ratings")
      .select("id, booking_id, rating, comment, rater_type, created_at, bookings(name, cleaner_id)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching admin reviews:", error);
      return NextResponse.json(
        { error: "Failed to load reviews" },
        { status: 500 }
      );
    }

    const reviews = (data ?? []).map((row: any) => ({
      id: row.id,
      customer: row.bookings?.name ?? "Customer",
      cleaner: row.bookings?.cleaner_id ?? "Cleaner",
      rating: Number(row.rating ?? 0),
      comment: row.comment ?? "",
      date: row.created_at ?? "",
      status: row.rater_type ?? "customer",
    }));

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in admin reviews route:", err);
    return NextResponse.json(
      { error: "Unexpected error loading reviews" },
      { status: 500 }
    );
  }
}

