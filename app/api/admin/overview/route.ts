import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type OverviewStats = {
  totalRevenue: number;
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
};

type ServiceDistributionItem = {
  label: string;
  value: number;
};

type OverviewPayload = {
  stats: OverviewStats;
  recentBookings: RecentBooking[];
  serviceDistribution: ServiceDistributionItem[];
};

export async function GET() {
  try {
    const supabase = await createClient();

    // 1) Load recent bookings
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, name, service, cleaner_id, status, total_amount, date, time, created_at"
      )
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

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalRevenue = rows
      .filter((row) => row.status === "confirmed")
      .reduce((sum, row) => sum + (row.total_amount ?? 0), 0);

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
        activeBookings,
        newCustomersLast30Days,
        averageRating,
      },
      recentBookings,
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

