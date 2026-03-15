import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string } | null)?.role;
  if (token && role === "admin") return true;
  return false;
}

export type CleanerDetailBooking = {
  id: string;
  customer: string;
  service: string;
  status: string | null;
  date: string;
  time: string;
  totalAmount: number;
};

export type AdminCleanerDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  verification_status: string | null;
  working_areas: string[];
  working_days: number[];
  unavailable_dates: string[];
  jobs: number;
  specialty: string;
  status: string;
  recentBookings: CleanerDetailBooking[];
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Cleaner ID required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, name, email, phone, avatar, verification_status, working_areas, working_days, unavailable_dates"
      )
      .eq("role", "cleaner")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Cleaner not found" },
        { status: 404 }
      );
    }

    const cleanerId = profile.id;

    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("cleaner_id", cleanerId)
      .in("status", ["confirmed", "completed"]);

    const jobs = count ?? 0;

    const { data: bookingRows } = await supabase
      .from("bookings")
      .select("cleaner_id, service")
      .eq("cleaner_id", cleanerId)
      .not("cleaner_id", "is", null);

    const serviceCounts: Record<string, number> = {};
    (bookingRows ?? []).forEach((row: { service: string }) => {
      const svc = row.service || "Standard";
      serviceCounts[svc] = (serviceCounts[svc] ?? 0) + 1;
    });
    const specialty =
      Object.keys(serviceCounts).length > 0
        ? Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0][0]
        : "Standard";

    const status =
      profile.verification_status === "verified"
        ? "active"
        : profile.verification_status === "suspended"
          ? "on-leave"
          : "pending";

    const { data: recentBookingRows } = await supabase
      .from("bookings")
      .select("id, name, service, status, date, time, total_amount")
      .eq("cleaner_id", cleanerId)
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(10);

    const recentBookings: CleanerDetailBooking[] = (recentBookingRows ?? []).map(
      (row: any) => ({
        id: row.id ?? "",
        customer: row.name ?? "Customer",
        service: row.service ?? "Cleaning",
        status: row.status ?? null,
        date: row.date ?? "",
        time: row.time ?? "",
        totalAmount: row.total_amount ?? 0,
      })
    );

    const detail: AdminCleanerDetail = {
      id: profile.id,
      name: (profile.name && String(profile.name).trim()) || "Unnamed cleaner",
      email: profile.email ?? null,
      phone: profile.phone ?? null,
      avatar: profile.avatar ?? null,
      verification_status: profile.verification_status ?? null,
      working_areas: Array.isArray(profile.working_areas)
        ? profile.working_areas
        : [],
      working_days: Array.isArray(profile.working_days)
        ? profile.working_days.filter((d: unknown) => typeof d === "number" && d >= 0 && d <= 6)
        : [],
      unavailable_dates: Array.isArray(profile.unavailable_dates)
        ? profile.unavailable_dates
        : [],
      jobs,
      specialty,
      status,
      recentBookings,
    };

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Error fetching cleaner detail:", error);
    return NextResponse.json(
      { error: "Failed to load cleaner details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Cleaner ID required" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const supabase = await createClient();

    const patch: Record<string, any> = {};

    if (typeof body.name === "string") patch.name = body.name.trim();
    if (typeof body.email === "string") patch.email = body.email.trim() || null;
    if (typeof body.phone === "string") patch.phone = body.phone.trim() || null;
    if (typeof body.avatar === "string") patch.avatar = body.avatar.trim() || null;
    if (typeof body.verification_status === "string")
      patch.verification_status = body.verification_status.trim() || null;
    if (Array.isArray(body.working_areas))
      patch.working_areas = body.working_areas.filter(
        (x: any) => typeof x === "string" && x.trim()
      );
    if (Array.isArray(body.working_days))
      patch.working_days = body.working_days.filter(
        (d: unknown) => typeof d === "number" && d >= 0 && d <= 6
      );
    if (Array.isArray(body.unavailable_dates))
      patch.unavailable_dates = body.unavailable_dates.filter(
        (x: any) => typeof x === "string" && x.trim()
      );

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .eq("role", "cleaner")
      .select(
        "id, name, email, phone, avatar, verification_status, working_areas, working_days, unavailable_dates"
      )
      .single();

    if (error) {
      console.error("Error updating cleaner profile:", error);
      return NextResponse.json(
        { error: "Failed to update cleaner", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ cleaner: data }, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error updating cleaner:", error);
    return NextResponse.json(
      { error: "Failed to update cleaner" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cleaners/[id]
 * Permanently delete a cleaner (profile + auth user). Unlinks their bookings.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Cleaner ID required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const admin = getSupabaseAdmin();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .eq("role", "cleaner")
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Cleaner not found" },
        { status: 404 }
      );
    }

    await supabase
      .from("bookings")
      .update({ cleaner_id: null })
      .eq("cleaner_id", id);

    const { error: deleteProfileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (deleteProfileError) {
      console.error("Error deleting cleaner profile:", deleteProfileError);
      return NextResponse.json(
        { error: "Failed to delete cleaner" },
        { status: 500 }
      );
    }

    try {
      await admin.auth.admin.deleteUser(id);
    } catch (authErr) {
      console.warn("Auth user delete (cleaner) failed, profile was removed:", authErr);
    }

    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    console.error("Unexpected error deleting cleaner:", error);
    return NextResponse.json(
      { error: "Failed to delete cleaner" },
      { status: 500 }
    );
  }
}
