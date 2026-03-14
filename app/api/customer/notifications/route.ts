import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";
import { formatBookingCode } from "@/lib/utils";

export const runtime = "nodejs";

export type CustomerNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "upcoming" | "booking_update" | "payment" | "other";
};

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const tokenData = token as (null | { role?: unknown; email?: unknown });
    const role = typeof tokenData?.role === "string" ? tokenData.role : undefined;
    const email = typeof tokenData?.email === "string" ? tokenData.email : undefined;

    if (!token || role !== "customer" || !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .select("id, service, status, date, time, total_amount, currency, created_at")
      .eq("email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error fetching customer notifications bookings:", error);
      return NextResponse.json(
        { error: "Failed to load notifications" },
        { status: 500 },
      );
    }

    const rows = (data ?? []) as any[];

    const notifications: CustomerNotification[] = rows.map((row) => {
      const bookingId = row.id?.toString() ?? "booking";
      const ref = formatBookingCode(bookingId);
      const service = row.service ?? "Cleaning";
      const status = (row.status ?? "pending") as string;
      const amount = Number(row.total_amount ?? 0);
      const currency = typeof row.currency === "string" ? row.currency : "ZAR";

      let title: string;
      let type: CustomerNotification["type"];
      let description: string;

      if (status === "pending") {
        title = "We received your booking request";
        type = "booking_update";
        description = `Your ${service.toLowerCase()} booking (${ref}) is pending confirmation.`;
      } else if (status === "confirmed") {
        title = "Your clean is confirmed";
        type = "upcoming";
        description = `Your ${service.toLowerCase()} booking (${ref}) is confirmed.`;
      } else if (status === "completed") {
        title = "Thanks for booking with Shalean";
        type = "booking_update";
        description = `Your ${service.toLowerCase()} booking (${ref}) is completed. Rate your clean from the Past Bookings tab.`;
      } else if (status === "failed" || status === "cancelled") {
        title = "Booking update";
        type = "booking_update";
        description = `Your ${service.toLowerCase()} booking (${ref}) was ${status}.`;
      } else {
        title = "Booking update";
        type = "other";
        description = `We have an update on your booking (${ref}).`;
      }

      if (amount > 0 && status === "confirmed") {
        const formattedAmount = new Intl.NumberFormat("en-ZA", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(amount);
        description += ` Estimated charge: ${formattedAmount}.`;
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
        description,
        time: timeLabel,
        read: false,
        type,
      };
    });

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in customer notifications route:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading notifications" },
      { status: 500 },
    );
  }
}

