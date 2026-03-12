import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("booking_ratings")
      .select("id, rating, comment, created_at, rater_type, bookings(name)")
      .eq("rater_type", "customer")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Error fetching reviews for public testimonials:", error);
      return NextResponse.json(
        { error: "Failed to load reviews" },
        { status: 500 }
      );
    }

    const reviews = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.bookings?.name ?? "Customer",
      role: "Homeowner",
      rating: Number(row.rating ?? 5),
      text: row.comment ?? "",
      createdAt: row.created_at,
      status: row.rater_type ?? "customer",
    }));

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error loading public reviews:", err);
    return NextResponse.json(
      { error: "Unexpected error loading reviews" },
      { status: 500 }
    );
  }
}

