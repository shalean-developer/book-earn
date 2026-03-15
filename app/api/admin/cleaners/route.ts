import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string } | null)?.role;
  if (token && role === "admin") return true;
  return false;
}

export type AdminCleaner = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  rating: number;
  jobs: number;
  status: string;
  specialty: string;
  verification_status: string | null;
};

export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const pageSize = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") ?? "8", 10)),
      100
    );
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const offset = (page - 1) * pageSize;

    const { data: profiles, error: profilesError, count } = await supabase
      .from("profiles")
      .select("id, name, email, phone, avatar, verification_status", {
        count: "exact",
      })
      .eq("role", "cleaner")
      .order("name", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (profilesError) {
      console.error("Error fetching admin cleaners:", profilesError);
      return NextResponse.json(
        { error: "Failed to load cleaners" },
        { status: 500 }
      );
    }

    const rows = profiles ?? [];
    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    if (rows.length === 0) {
      return NextResponse.json(
        {
          cleaners: [],
          pagination: { page, pageSize, totalCount, totalPages },
        },
        { status: 200 }
      );
    }

    const cleanerIds = rows.map((r) => r.id);

    const { data: bookingCounts } = await supabase
      .from("bookings")
      .select("cleaner_id")
      .in("cleaner_id", cleanerIds)
      .in("status", ["confirmed", "completed"]);

    const jobsByCleanerId: Record<string, number> = {};
    cleanerIds.forEach((id) => (jobsByCleanerId[id] = 0));
    (bookingCounts ?? []).forEach((row: { cleaner_id: string | null }) => {
      if (row.cleaner_id) {
        jobsByCleanerId[row.cleaner_id] = (jobsByCleanerId[row.cleaner_id] ?? 0) + 1;
      }
    });

    const { data: cleanerServices } = await supabase
      .from("bookings")
      .select("cleaner_id, service")
      .in("cleaner_id", cleanerIds)
      .not("cleaner_id", "is", null);

    const serviceCountByCleaner: Record<string, Record<string, number>> = {};
    (cleanerServices ?? []).forEach((row: { cleaner_id: string; service: string }) => {
      if (!row.cleaner_id) return;
      if (!serviceCountByCleaner[row.cleaner_id])
        serviceCountByCleaner[row.cleaner_id] = {};
      const svc = row.service || "Standard";
      serviceCountByCleaner[row.cleaner_id][svc] =
        (serviceCountByCleaner[row.cleaner_id][svc] ?? 0) + 1;
    });

    const cleaners: AdminCleaner[] = rows.map((row: any) => {
      const jobs = jobsByCleanerId[row.id] ?? 0;
      const serviceCounts = serviceCountByCleaner[row.id];
      let specialty = "Standard";
      if (serviceCounts && Object.keys(serviceCounts).length > 0) {
        const top = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];
        specialty = top[0];
      }
      const status =
        row.verification_status === "verified"
          ? "active"
          : row.verification_status === "suspended"
            ? "on-leave"
            : "pending";

      return {
        id: row.id,
        name: (row.name && String(row.name).trim()) || "Unnamed cleaner",
        email: row.email ?? null,
        phone: row.phone ?? null,
        avatar: row.avatar ?? null,
        rating: 0,
        jobs,
        status,
        specialty,
        verification_status: row.verification_status ?? null,
      };
    });

    return NextResponse.json(
      {
        cleaners,
        pagination: { page, pageSize, totalCount, totalPages },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in admin cleaners:", error);
    return NextResponse.json(
      { error: "Failed to load cleaners" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { name, email, phone, password } = body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    const passwordStr = typeof password === "string" ? String(password) : "";

    if (!trimmedName) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Profile must be linked to an auth user (profiles.id references auth.users.id).
    if (!trimmedEmail || !passwordStr) {
      return NextResponse.json(
        { error: "Email and password are required to add a cleaner (profile is linked to login account)." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: trimmedEmail.toLowerCase(),
      password: passwordStr,
      email_confirm: true,
      user_metadata: { name: trimmedName },
    });

    if (authError) {
      console.error("Error creating auth user for cleaner:", authError);
      if (authError.message?.toLowerCase().includes("already registered")) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError.message || "Failed to create account" },
        { status: 400 }
      );
    }

    const profileId = authData?.user?.id;
    if (!profileId) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    const profileRow = {
      name: trimmedName,
      email: trimmedEmail || null,
      phone: trimmedPhone || null,
      role: "cleaner",
      verification_status: "pending",
      working_areas: [],
      unavailable_dates: [],
    };

    // Update in case a trigger already created a profile row; otherwise insert.
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update(profileRow)
      .eq("id", profileId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating cleaner profile:", updateError);
      return NextResponse.json(
        { error: "Failed to save cleaner profile", detail: updateError.message },
        { status: 500 }
      );
    }

    if (!updated) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: profileId,
        ...profileRow,
      });

      if (insertError) {
        console.error("Error inserting cleaner profile:", insertError);
        return NextResponse.json(
          { error: "Failed to save cleaner profile", detail: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { id: profileId, message: "Cleaner added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error creating cleaner:", error);
    return NextResponse.json(
      { error: "Failed to add cleaner" },
      { status: 500 }
    );
  }
}
