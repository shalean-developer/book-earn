import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    const { data, error } = await supabase
      .from("bookings")
      // Fetch all columns to avoid mismatches with the table schema.
      // You can narrow this list later once you're happy with the data.
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading booking details", error);
      return NextResponse.json(
        { error: "Could not load booking details" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking: data });
  } catch (err) {
    console.error("Unexpected error in admin booking details route:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading booking details" },
      { status: 500 }
    );
  }
}

