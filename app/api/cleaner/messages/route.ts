import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

export type BookingMessage = {
  id: string;
  senderType: "customer" | "cleaner";
  body: string;
  createdAt: string;
  status: "sent" | "delivered" | "read";
  deliveredAt: string | null;
  readAt: string | null;
};

async function getCleanerId(req: NextRequest): Promise<{ cleanerId: string } | { error: NextResponse }> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const t = token as (null | { role?: string; phone?: string });
  if (!token || t?.role !== "cleaner" || !t?.phone) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "cleaner")
    .eq("phone", t.phone)
    .single();

  const cleanerId = profile?.id as string | undefined;
  if (!cleanerId) {
    return { error: NextResponse.json({ error: "Cleaner profile not found" }, { status: 403 }) };
  }
  return { cleanerId };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getCleanerId(req);
    if ("error" in auth) return auth.error;
    const { cleanerId } = auth;

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId")?.trim();
    const markRead = searchParams.get("markRead") === "1";
    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, cleaner_id")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking || booking.cleaner_id !== cleanerId) {
      return NextResponse.json(
        { error: "Job not found or you are not assigned to it" },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();
    if (markRead) {
      await supabase
        .from("booking_messages")
        .update({ status: "read", read_at: now })
        .eq("booking_id", bookingId)
        .eq("sender_type", "customer")
        .in("status", ["sent", "delivered"]);
    } else {
      await supabase
        .from("booking_messages")
        .update({ status: "delivered", delivered_at: now })
        .eq("booking_id", bookingId)
        .eq("sender_type", "customer")
        .eq("status", "sent");
    }

    const { data: rows, error } = await supabase
      .from("booking_messages")
      .select("id, sender_type, body, created_at, status, delivered_at, read_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ messages: [] }, { status: 200 });
      }
      console.error("Error fetching cleaner messages:", error);
      return NextResponse.json(
        { error: "Failed to load messages" },
        { status: 500 },
      );
    }

    const messages: BookingMessage[] = (rows ?? []).map((r: any) => ({
      id: String(r.id ?? ""),
      senderType: r.sender_type === "cleaner" ? "cleaner" : "customer",
      body: String(r.body ?? ""),
      createdAt: r.created_at ? String(r.created_at) : "",
      status: (r.status === "read" || r.status === "delivered" ? r.status : "sent") as "sent" | "delivered" | "read",
      deliveredAt: r.delivered_at ? String(r.delivered_at) : null,
      readAt: r.read_at ? String(r.read_at) : null,
    }));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in cleaner messages GET:", err);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getCleanerId(req);
    if ("error" in auth) return auth.error;
    const { cleanerId } = auth;

    let body: { bookingId?: string; message?: string };
    try {
      body = (await req.json()) as { bookingId?: string; message?: string };
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const bookingId =
      typeof body?.bookingId === "string" ? body.bookingId.trim() : undefined;
    const message =
      typeof body?.message === "string" ? body.message.trim() : undefined;

    if (!bookingId || !message) {
      return NextResponse.json(
        { error: "Booking and message are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, cleaner_id")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking || booking.cleaner_id !== cleanerId) {
      return NextResponse.json(
        { error: "Job not found or you are not assigned to it" },
        { status: 404 },
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("booking_messages")
      .insert({
        booking_id: bookingId,
        sender_type: "cleaner",
        sender_cleaner_id: cleanerId,
        body: message,
        status: "sent",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error saving cleaner message:", insertError);
      return NextResponse.json(
        {
          error:
            insertError.code === "42P01"
              ? "Messaging is not set up yet. Please contact support."
              : "We could not send your message. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: true, messageId: (inserted as { id?: string })?.id ?? null },
      { status: 200 },
    );
  } catch (err) {
    console.error("Unexpected error in cleaner messages POST:", err);
    return NextResponse.json(
      { error: "We could not send your message. Please try again." },
      { status: 500 },
    );
  }
}
