import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

export type CustomerBooking = {
  id: string;
  reference: string;
  service: string;
  status: string | null;
  totalAmount: number;
  currency: string | null;
  date: string;
  time: string;
  address: string | null;
  createdAt: string | null;
  customerRating: number | null;
  customerComment: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  extraRooms: number | null;
  instructions: string | null;
  extras: string[];
  cleanerId: string | null;
  cleanerName: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const tokenData = token as (null | { role?: unknown; email?: unknown });
    const role = typeof tokenData?.role === "string" ? tokenData.role : undefined;
    const email = typeof tokenData?.email === "string" ? tokenData.email : undefined;

    if (!token || role !== "customer" || !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status")?.trim() || undefined;

    let query = supabase
      .from("bookings")
      .select(
        "id, reference, service, status, total_amount, currency, date, time, address, created_at, bedrooms, bathrooms, extra_rooms, instructions, extras, cleaner_id, booking_ratings(rating, comment, rater_type)"
      )
      .eq("email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching customer bookings:", error);
      return NextResponse.json(
        { error: "Failed to load bookings" },
        { status: 500 }
      );
    }

    type BookingRow = {
      id?: string | number | null;
      reference?: string | null;
      service?: string | null;
      status?: string | null;
      total_amount?: number | null;
      currency?: string | null;
      date?: string | null;
      time?: string | null;
      address?: string | null;
      created_at?: string | null;
      bedrooms?: number | null;
      bathrooms?: number | null;
      extra_rooms?: number | null;
      instructions?: string | null;
      extras?: string[] | null;
      cleaner_id?: string | null;
      booking_ratings?:
        | null
        | {
            rating?: number | null;
            comment?: string | null;
            rater_type?: string | null;
          }[];
    };

    const rows = (data ?? []) as BookingRow[];
    const cleanerIds = Array.from(
      new Set(
        rows
          .map((r) => r.cleaner_id)
          .filter(
            (id): id is string =>
              typeof id === "string" && id.length > 0 && id.includes("-"),
          )
      )
    );

    let cleanerNameById: Record<string, string> = {};
    if (cleanerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", cleanerIds);
      if (profiles) {
        cleanerNameById = (profiles as { id?: string; name?: string }[]).reduce(
          (acc, p) => {
            if (p.id) acc[p.id] = (p.name && String(p.name).trim()) || "Your Shalean Pro";
            return acc;
          },
          {} as Record<string, string>
        );
      }
    }

    const bookings: CustomerBooking[] = rows.map((row) => {
      const ratings = Array.isArray(row.booking_ratings)
        ? row.booking_ratings
        : [];
      const customerRatingRow =
        ratings.find(
          (r) => (r.rater_type || "").toLowerCase() === "customer",
        ) ?? null;

      const rawExtras = row.extras;
      const extras: string[] = Array.isArray(rawExtras)
        ? rawExtras.filter((e): e is string => typeof e === "string")
        : typeof rawExtras === "string"
          ? (rawExtras ? [rawExtras] : [])
          : [];

      return {
        id: String(row.id ?? ""),
        reference: String(row.reference ?? ""),
        service: String(row.service ?? "Cleaning"),
        status: row.status ?? null,
        totalAmount: Number(row.total_amount ?? 0),
        currency: row.currency ?? null,
        date: String(row.date ?? ""),
        time: String(row.time ?? ""),
        address: row.address ?? null,
        createdAt: row.created_at ? String(row.created_at) : null,
        customerRating: customerRatingRow?.rating ?? null,
        customerComment: customerRatingRow?.comment ?? null,
        bedrooms: row.bedrooms != null ? Number(row.bedrooms) : null,
        bathrooms: row.bathrooms != null ? Number(row.bathrooms) : null,
        extraRooms: row.extra_rooms != null ? Number(row.extra_rooms) : null,
        instructions: row.instructions ?? null,
        extras,
        cleanerId: row.cleaner_id ?? null,
        cleanerName: row.cleaner_id
          ? cleanerNameById[row.cleaner_id] ?? null
          : null,
      };
    });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in customer bookings route:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading bookings" },
      { status: 500 }
    );
  }
}

