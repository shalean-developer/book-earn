import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type AdminNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "booking_created" | "booking_confirmed" | "booking_failed" | "other";
};

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch the most recent bookings to derive notifications from real data.
    const { data, error } = await supabase
      .from("bookings")
      .select("id, name, service, status, date, time, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching bookings for admin notifications:", error);
      return NextResponse.json(
        { error: "Failed to load admin notifications" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as any[];

    const notifications: AdminNotification[] = rows.map((row) => {
      const bookingId = row.id?.toString() ?? "booking";
      const customerName = row.name ?? "Customer";
      const service = row.service ?? "Cleaning";
      const status = (row.status ?? "pending") as string;

      let title: string;
      let type: AdminNotification["type"];

      if (status === "pending") {
        title = "New booking requested";
        type = "booking_created";
      } else if (status === "confirmed") {
        title = "Booking confirmed";
        type = "booking_confirmed";
      } else if (status === "failed" || status === "cancelled") {
        title = "Booking needs attention";
        type = "booking_failed";
      } else {
        title = "Booking update";
        type = "other";
      }

      const createdAt = row.created_at ? new Date(row.created_at) : null;
      const timeLabel = createdAt
        ? createdAt.toLocaleString("en-ZA", {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Recently";

      return {
        id: bookingId,
        title,
        description: `${customerName} requested a ${service} booking (${bookingId}).`,
        time: timeLabel,
        read: status !== "pending",
        type,
      };
    });

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("Unexpected error in admin notifications route:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading admin notifications" },
      { status: 500 }
    );
  }
}

