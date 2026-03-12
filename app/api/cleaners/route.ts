import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

interface ProfileRow {
  id: string;
  role: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  verification_status: string | null;
  working_areas: string[] | null;
  unavailable_dates: string[] | null;
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, role, name, email, phone, avatar, verification_status, working_areas, unavailable_dates"
      )
      .eq("role", "cleaner");

    if (error) {
      console.error("Failed to fetch cleaners", error);
      return NextResponse.json(
        { error: "Failed to load cleaners" },
        { status: 500 }
      );
    }

    const cleanerIds = (data ?? [])
      .filter((row) => row.verification_status === "verified")
      .map((row) => row.id);

    let ratingsByCleaner: Record<string, { total: number; count: number }> =
      {};

    if (cleanerIds.length > 0) {
      const { data: ratingRows, error: ratingError } = await supabase
        .from("booking_ratings")
        .select("rating, rater_type, bookings(cleaner_id)")
        .eq("rater_type", "customer");

      if (ratingError) {
        console.error("Failed to fetch cleaner ratings", ratingError);
      } else {
        (ratingRows as any[] | null | undefined)?.forEach((row) => {
          const cleanerId = row.bookings?.cleaner_id as string | null | undefined;
          if (!cleanerId) return;
          if (!cleanerIds.includes(cleanerId)) return;

          const rating = Number(row.rating ?? 0);
          if (!ratingsByCleaner[cleanerId]) {
            ratingsByCleaner[cleanerId] = { total: 0, count: 0 };
          }
          ratingsByCleaner[cleanerId].total += rating;
          ratingsByCleaner[cleanerId].count += 1;
        });
      }
    }

    const cleaners = (data ?? [])
      .filter((row) => row.verification_status === "verified")
      .map((row) => ({
        id: row.id,
        name: row.name ?? "Unnamed cleaner",
        photo: row.avatar ?? "",
        experience: "",
        rating:
          ratingsByCleaner[row.id]?.count && ratingsByCleaner[row.id].total
            ? ratingsByCleaner[row.id].total / ratingsByCleaner[row.id].count
            : 0,
        reviews: ratingsByCleaner[row.id]?.count ?? 0,
        badge: undefined as string | undefined,
        workingAreas: row.working_areas ?? [],
        unavailableDates: row.unavailable_dates ?? [],
      }));

    return NextResponse.json({ cleaners }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error while fetching cleaners", error);
    return NextResponse.json(
      { error: "Unexpected error while fetching cleaners" },
      { status: 500 }
    );
  }
}


