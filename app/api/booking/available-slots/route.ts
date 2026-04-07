import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * Returns time slots between 07:00–18:00 that are not already taken
 * for the given date (confirmed/pending bookings).
 */
export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Missing or invalid date (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const slots: string[] = [];
    for (let h = 7; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 18 && m > 0) break;
        slots.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
      }
    }

    const { data: rows, error } = await supabase
      .from("bookings")
      .select("time, status")
      .eq("date", date)
      .in("status", ["pending", "confirmed"]);

    if (error) {
      console.error("available-slots bookings query", error);
      return NextResponse.json(
        { error: "Failed to load availability" },
        { status: 500 }
      );
    }

    const taken = new Set(
      (rows ?? [])
        .map((r) => (r as { time?: string }).time)
        .filter(Boolean) as string[]
    );

    const available = slots.filter((s) => !taken.has(s));

    return NextResponse.json({ date, slots: available, allSlots: slots }, {
      status: 200,
    });
  } catch (e) {
    console.error("available-slots", e);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
