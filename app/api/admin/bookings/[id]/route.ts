import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";
import { processReferralCompletion } from "@/lib/referral";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string } | null)?.role;
  if (token && role === "admin") return true;
  return false;
}

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

/**
 * PATCH /api/admin/bookings/[id]
 * Update booking (e.g. status). When status is set to "completed",
 * referral credits (R100 each) are granted to referrer and referee if applicable.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const status = typeof body.status === "string" ? body.status.trim() : undefined;
    const cleanerId =
      body.cleaner_id === null || body.cleaner_id === ""
        ? null
        : typeof body.cleaner_id === "string"
          ? body.cleaner_id.trim() || null
          : undefined;

    const validStatuses = ["pending", "confirmed", "completed", "cancelled", "failed"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {};
    if (status !== undefined) updatePayload.status = status;
    if (cleanerId !== undefined) updatePayload.cleaner_id = cleanerId;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "Missing status or cleaner_id to update" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating booking status", updateError);
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (status === "completed") {
      const result = await processReferralCompletion(supabase, id);
      if (result.granted) {
        return NextResponse.json({
          booking: updated,
          referralCreditsGranted: true,
        });
      }
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("Unexpected error in admin booking PATCH:", err);
    return NextResponse.json(
      { error: "Unexpected server error updating booking" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bookings/[id]
 * Permanently delete a booking (admin only).
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = await createClient();

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) {
      console.error("Error deleting booking", error);
      return NextResponse.json(
        { error: "Failed to delete booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Unexpected error in admin booking DELETE:", err);
    return NextResponse.json(
      { error: "Unexpected server error deleting booking" },
      { status: 500 }
    );
  }
}

