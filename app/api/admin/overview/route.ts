import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type OverviewStats = {
  totalRevenue: number;
  totalRevenueAllTime: number;
  activeBookings: number;
  newCustomersLast30Days: number;
  averageRating?: number | null;
};

type RecentBooking = {
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

type ServiceDistributionItem = {
  label: string;
  value: number;
};

type OverviewPayload = {
  stats: OverviewStats;
  recentBookings: RecentBooking[];
  upcomingBookings: RecentBooking[];
  serviceDistribution: ServiceDistributionItem[];
};

export async function GET() {
  try {
    const supabase = await createClient();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthStartStr = monthStart.toISOString().slice(0, 10);
    const monthEndStr = monthEnd.toISOString().slice(0, 10);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    // 0a) All-time total revenue (confirmed + completed, only bookings strictly after today)
    let totalRevenueAllTime = 0;
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: allTimeRows, error: allTimeError } = await supabase
        .from("bookings")
        .select("total_amount")
        .in("status", ["confirmed", "completed"])
        .gte("date", tomorrowStr)
        .range(offset, offset + pageSize - 1);
      if (allTimeError) {
        console.error("Error fetching all-time revenue for admin overview:", allTimeError);
        break;
      }
      const chunk = (allTimeRows ?? []) as { total_amount?: number }[];
      if (chunk.length) {
        totalRevenueAllTime += chunk.reduce(
          (sum, row) => sum + (Number(row.total_amount) ?? 0),
          0
        );
      }
      hasMore = chunk.length === pageSize;
      offset += pageSize;
    }

    // 0b) Total revenue for the current month (confirmed + completed bookings with date in this month, but only from tomorrow onward)
    let totalRevenue = 0;
    const { data: revenueRows, error: revenueError } = await supabase
      .from("bookings")
      .select("total_amount")
      .in("status", ["confirmed", "completed"])
      .gte("date", monthStartStr > tomorrowStr ? monthStartStr : tomorrowStr)
      .lte("date", monthEndStr);

    if (revenueError) {
      console.error("Error fetching monthly revenue for admin overview:", revenueError);
    } else if (revenueRows?.length) {
      totalRevenue = revenueRows.reduce(
        (sum, row) => sum + (Number((row as any).total_amount) ?? 0),
        0
      );
    }

    // 1) Upcoming bookings for the next 7 days (starting tomorrow)
    const weekStart = new Date(tomorrow);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    const { data: upcomingRows, error: upcomingError } = await supabase
      .from("bookings")
      .select(
        "id, name, service, cleaner_id, status, total_amount, date, time, created_at, estimated_duration_minutes"
      )
      .gte("date", weekStartStr)
      .lte("date", weekEndStr)
      .in("status", ["pending", "confirmed", "completed"])
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    const upcomingRaw = (upcomingError ? [] : (upcomingRows ?? [])) as any[];
    const upcomingCleanerIds = Array.from(
      new Set(
        upcomingRaw
          .map((r) => r.cleaner_id as string | null | undefined)
          .filter((id): id is string => Boolean(id) && id.includes("-"))
      )
    );
    let upcomingCleanerNames: Record<string, string> = {};
    if (upcomingCleanerIds.length > 0) {
      const { data: upProfiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", upcomingCleanerIds);
      upcomingCleanerNames = (upProfiles ?? []).reduce(
        (acc: Record<string, string>, row: any) => {
          if (row.id) acc[row.id] = (row.name && String(row.name).trim()) || "Cleaner";
          return acc;
        },
        {}
      );
    }
    const upcomingBookings: RecentBooking[] = upcomingRaw.map((row: any) => ({
      id: row.id?.toString() ?? "",
      customer: row.name ?? "Customer",
      service: row.service ?? "Cleaning",
      cleaner: row.cleaner_id ? (upcomingCleanerNames[row.cleaner_id] ?? "Assigned cleaner") : null,
      status: row.status ?? null,
      totalAmount: row.total_amount ?? 0,
      date: row.date ?? "",
      time: row.time ?? "",
      estimatedDurationMinutes: row.estimated_duration_minutes != null ? Number(row.estimated_duration_minutes) : null,
    }));

    // 2) Load recent bookings (booked in the current month)
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, name, service, cleaner_id, status, total_amount, date, time, created_at, estimated_duration_minutes"
      )
      .gte("date", monthStartStr)
      .lte("date", monthEndStr)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching bookings for admin overview:", error);
      return NextResponse.json(
        { error: "Failed to load admin overview data" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as any[];

    // 2) Resolve cleaner IDs -> names via a separate query
    // Collect only UUID-like cleaner IDs (values containing "-") to avoid
    // casting errors when querying the profiles table (which uses uuid ids).
    const cleanerIds = Array.from(
      new Set(
        rows
          .map((row) => row.cleaner_id as string | null | undefined)
          .filter(
            (id): id is string => Boolean(id) && id.includes("-")
          )
      )
    );

    let cleanerNameById: Record<string, string> = {};

    if (cleanerIds.length > 0) {
      const { data: cleanerProfiles, error: cleanerError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", cleanerIds);

      if (cleanerError) {
        console.error(
          "Error fetching cleaner profiles for admin overview:",
          cleanerError
        );
      } else {
        cleanerNameById = (cleanerProfiles ?? []).reduce(
          (acc: Record<string, string>, row: any) => {
            if (!row.id) return acc;
            const displayName =
              (row.name && row.name.toString().trim()) || "Cleaner";
            acc[row.id] = displayName;
            return acc;
          },
          {}
        );
      }
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeBookings = rows.filter((row) => {
      if (!row.date) return false;
      const bookingDate = new Date(row.date);
      return (
        bookingDate >= now &&
        (row.status === "pending" || row.status === "confirmed")
      );
    }).length;

    const customerEmails = new Set<string>();
    const recentCustomerEmails = new Set<string>();

    rows.forEach((row: any) => {
      if (!row.name) return;
      customerEmails.add(row.name);

      if (row.created_at) {
        const createdAt = new Date(row.created_at);
        if (createdAt >= thirtyDaysAgo) {
          recentCustomerEmails.add(row.name);
        }
      }
    });

    const newCustomersLast30Days = recentCustomerEmails.size;

    const serviceCounts: Record<string, number> = {};
    rows.forEach((row) => {
      const key = row.service || "Other";
      serviceCounts[key] = (serviceCounts[key] ?? 0) + 1;
    });

    const totalServices = Object.values(serviceCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    const serviceDistribution: ServiceDistributionItem[] =
      totalServices === 0
        ? []
        : Object.entries(serviceCounts).map(([label, count]) => ({
            label,
            value: Math.round((count / totalServices) * 100),
          }));

    const recentBookings: RecentBooking[] = rows.slice(0, 10).map((row: any) => {
      let cleanerLabel: string | null = null;

      if (row.cleaner_id) {
        // Prefer the cleaner's profile name if we have it;
        // otherwise show a generic label instead of the raw UUID.
        cleanerLabel = cleanerNameById[row.cleaner_id] ?? "Assigned cleaner";
      }

      return {
        id: row.id?.toString(),
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

    // 3) Compute average rating from booking_ratings (optional, non‑blocking)
    let averageRating: number | null = null;
    try {
      const { data: ratings, error: ratingsError } = await supabase
        .from("booking_ratings")
        .select("rating, rater_type");

      if (ratingsError) {
        console.error(
          "Error fetching booking ratings for admin overview:",
          ratingsError
        );
      } else if (ratings && ratings.length > 0) {
        const customerRatings = ratings.filter(
          (r: any) => r.rater_type === "customer"
        );
        if (customerRatings.length > 0) {
          const sum = customerRatings.reduce(
            (acc: number, r: any) => acc + (Number(r.rating) || 0),
            0
          );
          averageRating = sum / customerRatings.length;
        }
      }
    } catch (ratingErr) {
      console.error("Unexpected error computing average rating:", ratingErr);
    }

    const payload: OverviewPayload = {
      stats: {
        totalRevenue,
        totalRevenueAllTime,
        activeBookings,
        newCustomersLast30Days,
        averageRating,
      },
      recentBookings,
      upcomingBookings,
      serviceDistribution,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("Unexpected error in admin overview route:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading admin overview" },
      { status: 500 }
    );
  }
}

