import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("booking_ratings")
      .select("rating, rater_type", { count: "exact" });

    if (error) {
      console.error("Error fetching reviews summary:", error);
      return NextResponse.json(
        { error: "Failed to load reviews summary" },
        { status: 500 }
      );
    }

    const all = data ?? [];
    const customerRatings = all.filter(
      (r: any) => r.rater_type === "customer"
    );

    let averageRating: number | null = null;
    if (customerRatings.length > 0) {
      const sum = published.reduce(
        (acc: number, r: any) => acc + (Number(r.rating) || 0),
        0
      );
      averageRating = sum / customerRatings.length;
    }

    return NextResponse.json(
      {
        totalReviews: customerRatings.length,
        averageRating,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error in reviews summary route:", err);
    return NextResponse.json(
      { error: "Unexpected error loading reviews summary" },
      { status: 500 }
    );
  }
}

