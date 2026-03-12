import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ email: string }> }
) {
  try {
    const { email: rawEmail } = await ctx.params;
    const email = decodeURIComponent(rawEmail || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Missing customer email" }, { status: 400 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const pageSize = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)),
      100
    );
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from("bookings")
      .select(
        "id, reference, name, email, phone, service, status, total_amount, currency, date, time, address, created_at",
        { count: "exact" }
      )
      .eq("email", email)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching customer detail:", error);
      return NextResponse.json({ error: "Failed to load customer profile" }, { status: 500 });
    }

    type BookingRow = {
      id?: string | number | null;
      reference?: string | null;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      service?: string | null;
      status?: string | null;
      total_amount?: number | null;
      currency?: string | null;
      date?: string | null;
      time?: string | null;
      address?: string | null;
      created_at?: string | null;
    };

    const rows = (data ?? []) as BookingRow[];
    const first: BookingRow | undefined = rows[0];

    const totalBookings = count ?? rows.length;
    const lifetimeValue = rows.reduce(
      (sum, r) => sum + (Number(r.total_amount ?? 0) || 0),
      0
    );
    const lastBooking = first?.date || first?.created_at || null;

    return NextResponse.json(
      {
        customer: {
          name: (first?.name && String(first.name).trim()) || "Customer",
          email,
          phone: first?.phone ? String(first.phone) : null,
          totalBookings,
          lifetimeValue,
          lastBooking,
        },
        bookings: rows.map((r) => ({
          id: String(r.id ?? ""),
          reference: String(r.reference ?? ""),
          service: String(r.service ?? "Cleaning"),
          status: r.status ?? null,
          totalAmount: Number(r.total_amount ?? 0),
          currency: r.currency ?? null,
          date: String(r.date ?? ""),
          time: String(r.time ?? ""),
          address: r.address ?? null,
          createdAt: r.created_at ? String(r.created_at) : null,
        })),
        pagination: {
          page,
          pageSize,
          totalCount: count ?? rows.length,
          totalPages: Math.max(
            1,
            Math.ceil(((count ?? rows.length) || 1) / pageSize)
          ),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error in admin customer detail route:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading customer" },
      { status: 500 }
    );
  }
}

