import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";
import { formatBookingCode } from "@/lib/utils";

export type CleanerNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "job_assigned" | "job_confirmed" | "job_update" | "message" | "other";
};

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const t = token as (null | { role?: unknown; phone?: unknown });
    const role = typeof t?.role === "string" ? t.role : undefined;
    const phone = typeof t?.phone === "string" ? t.phone : undefined;

    if (!token || role !== "cleaner" || !phone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "cleaner")
      .eq("phone", phone)
      .single();

    const cleanerId =
      (profile && (profile.id as string | undefined)) ?? undefined;
    if (!cleanerId) {
      return NextResponse.json({ notifications: [] }, { status: 200 });
    }

    const { data: rows, error } = await supabase
      .from("bookings")
      .select("id, name, address, service, status, date, time, created_at")
      .eq("cleaner_id", cleanerId)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error fetching cleaner notifications:", error);
      return NextResponse.json(
        { error: "Failed to load notifications" },
        { status: 500 },
      );
    }

    const list = (rows ?? []) as any[];

    const bookingIds = list.map((r) => r.id).filter(Boolean);
    let messageBookings: { booking_id: string; created_at: string; body: string }[] = [];
    if (bookingIds.length > 0) {
      const { data: msgRows } = await supabase
        .from("booking_messages")
        .select("booking_id, created_at, body")
        .eq("sender_type", "customer")
        .in("status", ["sent", "delivered"])
        .in("booking_id", bookingIds)
        .order("created_at", { ascending: false });
      const byBooking = new Map<string, { created_at: string; body: string }>();
      for (const m of msgRows ?? []) {
        const bid = String(m.booking_id ?? "");
        if (!bid || byBooking.has(bid)) continue;
        byBooking.set(bid, {
          created_at: String(m.created_at ?? ""),
          body: String(m.body ?? "").slice(0, 60),
        });
      }
      messageBookings = Array.from(byBooking.entries()).map(([booking_id, rest]) => ({
        booking_id,
        ...rest,
      }));
    }

    const notifications: CleanerNotification[] = list.map((row) => {
      const bookingId = row.id?.toString() ?? "booking";
      const ref = formatBookingCode(bookingId);
      const customerName = row.name ?? "Customer";
      const service = row.service ?? "Cleaning";
      const status = (row.status ?? "pending") as string;

      let title: string;
      let type: CleanerNotification["type"];
      let description: string;

      if (status === "pending") {
        title = "New job assigned";
        type = "job_assigned";
        description = `${customerName} – ${service} (${ref}).`;
      } else if (status === "confirmed") {
        title = "Job confirmed";
        type = "job_confirmed";
        description = `${customerName} – ${service} (${ref}).`;
      } else if (status === "completed") {
        title = "Job completed";
        type = "job_update";
        description = `${customerName} – ${service} (${ref}) completed.`;
      } else if (status === "failed" || status === "cancelled") {
        title = "Job update";
        type = "job_update";
        description = `${customerName} – ${service} (${ref}) was ${status}.`;
      } else {
        title = "Job update";
        type = "other";
        description = `Update on ${service} (${ref}).`;
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

    for (const msg of messageBookings) {
      const row = list.find((r) => String(r.id) === msg.booking_id);
      if (!row) continue;
      const ref = formatBookingCode(msg.booking_id);
      const customerName = row.name ?? "Customer";
      const service = row.service ?? "Cleaning";
      const timeLabel = msg.created_at
        ? new Date(msg.created_at).toLocaleString("en-ZA", {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Recently";
      const preview = msg.body ? (msg.body.length > 60 ? `${msg.body}…` : msg.body) : "New message";
      notifications.unshift({
        id: `msg-${msg.booking_id}`,
        title: "New message from customer",
        description: `${customerName} – ${service} (${ref}): ${preview}`,
        time: timeLabel,
        read: false,
        type: "message",
      });
    }

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in cleaner notifications route:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading notifications" },
      { status: 500 },
    );
  }
}
