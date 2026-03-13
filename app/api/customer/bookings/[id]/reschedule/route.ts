import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const tokenData = token as (null | { role?: unknown; email?: unknown });
    const role = typeof tokenData?.role === "string" ? tokenData.role : undefined;
    const email =
      typeof tokenData?.email === "string" ? tokenData.email.toLowerCase() : undefined;

    if (!token || role !== "customer" || !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => null)) as
      | { date?: string; time?: string; address?: string; service?: string }
      | null;

    const date = body?.date?.trim() || undefined;
    const time = body?.time?.trim() || undefined;
    const address = body?.address?.trim() || undefined;
    const service = body?.service?.trim() || undefined;

    if (!date && !time && !address && !service) {
      return NextResponse.json(
        { error: "At least one field (date, time, address, or service) must be provided" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .update({ date, time, address, service })
      .eq("id", id)
      .eq("email", email)
      .select("id, status, date, time")
      .single();

    if (error) {
      console.error("Error rescheduling customer booking:", error);
      return NextResponse.json(
        { error: "Failed to reschedule booking" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking: data }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in customer reschedule booking route:", err);
    return NextResponse.json(
      { error: "Unexpected server error rescheduling booking" },
      { status: 500 },
    );
  }
}

