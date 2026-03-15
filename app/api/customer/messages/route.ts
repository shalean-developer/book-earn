import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

export type BookingMessage = {
  id: string;
  senderType: "customer" | "cleaner";
  body: string;
  createdAt: string;
};

async function getAuth(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const tokenData = token as (null | { role?: unknown; email?: unknown });
  const role = typeof tokenData?.role === "string" ? tokenData.role : undefined;
  const email =
    typeof tokenData?.email === "string" ? tokenData.email?.toLowerCase() : undefined;
  return { token, role, email };
}

export async function GET(req: NextRequest) {
  try {
    const { token, role, email } = await getAuth(req);
    if (!token || role !== "customer" || !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId")?.trim();
    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", bookingId)
      .eq("email", email)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "Booking not found or you don't have access to it" },
        { status: 404 },
      );
    }

    const { data: rows, error } = await supabase
      .from("booking_messages")
      .select("id, sender_type, body, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ messages: [] }, { status: 200 });
      }
      console.error("Error fetching customer messages:", error);
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
    }));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in customer messages GET:", err);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, role, email } = await getAuth(req);
    if (!token || role !== "customer" || !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      .select("id")
      .eq("id", bookingId)
      .eq("email", email)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "Booking not found or you don't have access to it" },
        { status: 404 },
      );
    }

    const { error: insertError } = await supabase.from("booking_messages").insert({
      booking_id: bookingId,
      sender_type: "customer",
      sender_email: email,
      body: message,
    });

    if (insertError) {
      console.error("Error saving customer message:", insertError);
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

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in customer messages route:", err);
    return NextResponse.json(
      { error: "We could not send your message. Please try again." },
      { status: 500 },
    );
  }
}
