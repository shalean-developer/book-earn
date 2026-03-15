import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string } | null)?.role;
  return !!(token && role === "admin");
}

/**
 * POST /api/admin/bookings/bulk-delete
 * Body: { ids: string[] } — booking UUIDs to delete (admin only).
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const raw = body?.ids;
    const ids = Array.isArray(raw)
      ? (raw as unknown[]).filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No booking IDs provided" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("bookings")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("Error bulk deleting bookings:", error);
      return NextResponse.json(
        { error: "Failed to delete some or all bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: ids.length });
  } catch (err) {
    console.error("Unexpected error in admin bookings bulk-delete:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
