import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export type AdminBookingSummary = {
  id: string;
  customer: string;
  service: string;
  cleaner: string | null;
  status: string | null;
  totalAmount: number;
  date: string;
  time: string;
  estimatedDurationMinutes: number | null;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status")?.trim() || undefined;
    const serviceFilter = searchParams.get("service")?.trim() || undefined;
    const period = searchParams.get("period")?.trim().toLowerCase() || undefined;
    const q = searchParams.get("q")?.trim() || undefined;
    const pageSize = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)),
      100
    );
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("bookings")
      .select(
        "id, name, service, cleaner_id, status, total_amount, date, time, created_at, estimated_duration_minutes",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

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
        `name.ilike.${pattern},email.ilike.${pattern},reference.ilike.${pattern}`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching admin bookings list:", error);
      return NextResponse.json(
        { error: "Failed to load bookings" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as any[];

    const cleanerIds = Array.from(
      new Set(
        rows
          .map((row) => row.cleaner_id as string | null | undefined)
          .filter(
            (id): id is string => Boolean(id) && typeof id === "string" && id.includes("-")
          )
      )
    );

    let cleanerNameById: Record<string, string> = {};

    if (cleanerIds.length > 0) {
      const { data: cleanerProfiles, error: cleanerError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", cleanerIds);

      if (!cleanerError && cleanerProfiles) {
        cleanerNameById = cleanerProfiles.reduce(
          (acc: Record<string, string>, row: { id?: string; name?: string }) => {
            if (!row.id) return acc;
            acc[row.id] =
              (row.name && String(row.name).trim()) || "Cleaner";
            return acc;
          },
          {}
        );
      }
    }

    const bookings: AdminBookingSummary[] = rows.map((row: any) => {
      let cleanerLabel: string | null = null;
      if (row.cleaner_id) {
        cleanerLabel = cleanerNameById[row.cleaner_id] ?? "Assigned cleaner";
      }
      return {
        id: row.id?.toString() ?? "",
        customer: row.name ?? "Customer",
        service: row.service ?? "Cleaning",
        cleaner: cleanerLabel,
        status: row.status ?? null,
        totalAmount: row.total_amount ?? 0,
        date: row.date ?? "",
        time: row.time ?? "",
        estimatedDurationMinutes:
          row.estimated_duration_minutes != null
            ? Number(row.estimated_duration_minutes)
            : null,
      };
    });

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Unexpected error in admin bookings list route:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading bookings" },
      { status: 500 }
    );
  }
}
