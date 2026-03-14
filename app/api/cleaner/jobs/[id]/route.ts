import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

const ALLOWED_STATUSES = ["on_my_way", "arrived", "in_progress", "completed"];

/**
 * PATCH /api/cleaner/jobs/[id]
 * Allows the assigned cleaner to update their job status:
 * On My Way → Arrived → Start Job (in_progress) → Completed Job (completed).
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const t = token as (null | { role?: string; phone?: string });
    if (!token || t?.role !== "cleaner" || !t?.phone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookingId } = await context.params;
    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing job id" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const status =
      typeof body.status === "string" ? body.status.trim().toLowerCase() : undefined;
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Missing or invalid status. Use on_my_way, arrived, in_progress, or completed." },
        { status: 400 }
      );
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
      return NextResponse.json({ error: "Cleaner profile not found" }, { status: 403 });
    }

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, cleaner_id")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (booking.cleaner_id !== cleanerId) {
      return NextResponse.json(
        { error: "You are not assigned to this job" },
        { status: 403 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating cleaner job status:", updateError);
      const message =
        updateError.code === "23514"
          ? "Database does not allow this status. Run sql/cleaner_job_status_in_progress.sql in Supabase to allow in_progress."
          : (updateError.message || "Failed to update job status");
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("Unexpected error in cleaner job update:", err);
    return NextResponse.json(
      { error: "Unexpected error updating job" },
      { status: 500 }
    );
  }
}
