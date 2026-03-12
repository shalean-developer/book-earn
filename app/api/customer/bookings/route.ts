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
        "id, reference, service, status, total_amount, currency, date, time, address, created_at, booking_ratings(rating, comment, rater_type)"
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
      booking_ratings?:
        | null
        | {
            rating?: number | null;
            comment?: string | null;
            rater_type?: string | null;
          }[];
    };

    const bookings: CustomerBooking[] = ((data ?? []) as BookingRow[]).map(
      (row) => {
        const ratings = Array.isArray(row.booking_ratings)
          ? row.booking_ratings
          : [];
        const customerRatingRow =
          ratings.find(
            (r) => (r.rater_type || "").toLowerCase() === "customer",
          ) ?? null;

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
        };
      },
    );

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in customer bookings route:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading bookings" },
      { status: 500 }
    );
  }
}

