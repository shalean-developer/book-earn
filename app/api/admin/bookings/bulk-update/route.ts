import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";
import { processReferralCompletion } from "@/lib/referral";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string } | null)?.role;
  return !!(token && role === "admin");
}

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled", "failed"];

/**
 * POST /api/admin/bookings/bulk-update
 * Body: { ids: string[], status: string } — booking UUIDs and new status (admin only).
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawIds = body?.ids;
    const ids = Array.isArray(rawIds)
      ? (rawIds as unknown[]).filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
    const status = typeof body?.status === "string" ? body.status.trim() : "";

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No booking IDs provided" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value. Use: pending, confirmed, completed, cancelled, failed" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .in("id", ids)
      .select("id");

    if (updateError) {
      console.error("Error bulk updating bookings:", updateError);
      return NextResponse.json(
        { error: "Failed to update bookings" },
        { status: 500 }
      );
    }

    const updatedIds = (updated ?? []).map((r) => r.id);

    if (status === "completed") {
      for (const id of updatedIds) {
        await processReferralCompletion(supabase, id);
      }
    }

    return NextResponse.json({ updated: updatedIds.length, ids: updatedIds });
  } catch (err) {
    console.error("Unexpected error in admin bookings bulk-update:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
