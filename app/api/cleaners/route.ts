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

    const cleaners = (data ?? [])
      .filter((row) => row.verification_status === "verified")
      .map((row) => ({
        id: row.id,
        name: row.name ?? "Unnamed cleaner",
        photo: row.avatar ?? "",
        experience: "",
        rating: 0,
        reviews: 0,
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


