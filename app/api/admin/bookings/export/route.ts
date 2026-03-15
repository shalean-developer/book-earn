import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status")?.trim() || undefined;
    const serviceFilter = searchParams.get("service")?.trim() || undefined;
    const period = searchParams.get("period")?.trim().toLowerCase() || undefined;
    const q = searchParams.get("q")?.trim() || undefined;

    let query = supabase
      .from("bookings")
      .select(
        "id, booking_ref, reference, status, service, date, time, total_amount, currency, name, email, phone, working_area, extras, estimated_duration_minutes, cleaner_id, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }
    if (serviceFilter) {
      query = query.eq("service", serviceFilter);
    }
    if (period) {
      const now = new Date();
      const toYMD = (d: Date) => d.toISOString().slice(0, 10);
      let dateFrom: string;
      let dateEnd: string;
      switch (period) {
        case "today":
          dateFrom = toYMD(now);
          dateEnd = dateFrom;
          break;
        case "week": {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - 6);
          dateFrom = toYMD(weekStart);
          dateEnd = toYMD(now);
          break;
        }
        case "month":
          dateFrom = toYMD(new Date(now.getFullYear(), now.getMonth(), 1));
          dateEnd = toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
          break;
        case "90days": {
          const start = new Date(now);
          start.setDate(start.getDate() - 89);
          dateFrom = toYMD(start);
          dateEnd = toYMD(now);
          break;
        }
        case "year":
          dateFrom = toYMD(new Date(now.getFullYear(), 0, 1));
          dateEnd = toYMD(new Date(now.getFullYear(), 11, 31));
          break;
        default:
          dateFrom = "";
          dateEnd = "";
      }
      if (dateFrom && dateEnd) {
        query = query.gte("date", dateFrom).lte("date", dateEnd);
      }
    }
    if (q && q.length > 0) {
      const escaped = q.replace(/"/g, '\\"');
      const pattern = `"%${escaped}%"`;
      query = query.or(
        `name.ilike.${pattern},email.ilike.${pattern},reference.ilike.${pattern},booking_ref.ilike.${pattern}`
      );
    }

    const { data, error } = await query.limit(5000);

    if (error) {
      console.error("Error exporting admin bookings list:", error);
      return NextResponse.json(
        { error: "Failed to export bookings" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as any[];

    const headers = [
      "id",
      "booking_ref",
      "reference",
      "status",
      "service",
      "date",
      "time",
      "total_amount",
      "currency",
      "name",
      "email",
      "phone",
      "working_area",
      "extras",
      "estimated_duration_minutes",
      "cleaner_id",
      "created_at",
    ];

    const escape = (value: any): string => {
      if (value === null || value === undefined) return "";
      const str =
        typeof value === "string"
          ? value
          : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
      const needsQuotes = /[",\n]/.test(str);
      const escaped = str.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const lines = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => escape((row as any)[h])).join(",")
      ),
    ];

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="bookings-export.csv"',
      },
    });
  } catch (err) {
    console.error("Unexpected error in admin bookings export route:", err);
    return NextResponse.json(
      { error: "Unexpected server error exporting bookings" },
      { status: 500 }
    );
  }
}

