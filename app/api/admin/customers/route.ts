import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export type AdminCustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalBookings: number;
  lifetimeValue: number;
  lastBooking: string | null;
  status: "new" | "vip" | "churn-risk" | "active";
};

function formatDateLabel(date: string | null | undefined) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function computeSegment(args: {
  totalBookings: number;
  lifetimeValue: number;
  lastBookingDate: string | null;
}): AdminCustomerSummary["status"] {
  const { totalBookings, lifetimeValue, lastBookingDate } = args;
  const now = Date.now();
  const last = lastBookingDate ? new Date(lastBookingDate).getTime() : NaN;
  const daysSinceLast = Number.isFinite(last) ? (now - last) / (1000 * 60 * 60 * 24) : Infinity;

  if (totalBookings <= 1) return "new";
  if (lifetimeValue >= 5000 || totalBookings >= 8) return "vip";
  if (daysSinceLast > 60) return "churn-risk";
  return "active";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const segment = (searchParams.get("segment") ?? "").trim().toLowerCase();
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") ?? "500", 10)), 2000);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("id, name, email, phone, total_amount, date, created_at, status")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching bookings for admin customers:", error);
      return NextResponse.json({ error: "Failed to load customers" }, { status: 500 });
    }

    const byEmail = new Map<
      string,
      {
        email: string;
        name: string;
        phone: string | null;
        totalBookings: number;
        lifetimeValue: number;
        lastBookingDate: string | null;
      }
    >();

    type BookingRow = {
      email?: string | null;
      name?: string | null;
      phone?: string | null;
      total_amount?: number | null;
      date?: string | null;
      created_at?: string | null;
    };

    ((data ?? []) as BookingRow[]).forEach((row) => {
      const email = typeof row.email === "string" ? row.email.trim().toLowerCase() : "";
      if (!email) return;
      const existing = byEmail.get(email);
      const amount = Number(row.total_amount ?? 0) || 0;
      const bookingDate = typeof row.date === "string" ? row.date : null;
      const createdAt = typeof row.created_at === "string" ? row.created_at : null;
      const lastCandidate = bookingDate || createdAt;

      if (!existing) {
        byEmail.set(email, {
          email,
          name: (row.name && String(row.name).trim()) || "Customer",
          phone: row.phone ? String(row.phone) : null,
          totalBookings: 1,
          lifetimeValue: amount,
          lastBookingDate: lastCandidate,
        });
      } else {
        existing.totalBookings += 1;
        existing.lifetimeValue += amount;
        if (lastCandidate) {
          const prev = existing.lastBookingDate ? new Date(existing.lastBookingDate).getTime() : 0;
          const next = new Date(lastCandidate).getTime();
          if (!Number.isNaN(next) && next >= prev) {
            existing.lastBookingDate = lastCandidate;
          }
        }
        if (!existing.phone && row.phone) existing.phone = String(row.phone);
        if (existing.name === "Customer" && row.name) existing.name = String(row.name).trim();
      }
    });

    let customers: AdminCustomerSummary[] = Array.from(byEmail.values()).map((c, idx) => {
      const status = computeSegment({
        totalBookings: c.totalBookings,
        lifetimeValue: c.lifetimeValue,
        lastBookingDate: c.lastBookingDate,
      });
      return {
        id: `CU-${String(idx + 1).padStart(4, "0")}`,
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalBookings: c.totalBookings,
        lifetimeValue: c.lifetimeValue,
        lastBooking: formatDateLabel(c.lastBookingDate),
        status,
      };
    });

    if (q) {
      customers = customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    if (segment) {
      customers = customers.filter((c) => c.status === segment);
    }

    customers.sort((a, b) => b.lifetimeValue - a.lifetimeValue);

    return NextResponse.json({ customers }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in admin customers route:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const password = typeof body?.password === "string" ? String(body.password) : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      console.error("Error creating auth user for customer:", authError);
      if (authError.message?.toLowerCase().includes("already registered")) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }
      return NextResponse.json(
        { error: authError.message || "Failed to create account" },
        { status: 400 }
      );
    }

    const profileId = authData?.user?.id;
    if (!profileId) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    const profileRow = {
      name,
      email,
      phone: phone || null,
      role: "customer",
    };

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update(profileRow)
      .eq("id", profileId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating customer profile:", updateError);
      return NextResponse.json(
        { error: "Failed to save customer profile", detail: updateError.message },
        { status: 500 }
      );
    }

    if (!updated) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: profileId,
        ...profileRow,
      });
      if (insertError) {
        console.error("Error inserting customer profile:", insertError);
        return NextResponse.json(
          { error: "Failed to save customer profile", detail: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ id: profileId, message: "Customer added successfully" }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error creating customer:", err);
    return NextResponse.json({ error: "Failed to add customer" }, { status: 500 });
  }
}

