import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

type CleanerDashboardJob = {
  id: string;
  customer: string;
  address: string | null;
  time: string;
  service: string;
  status: string | null;
  totalAmount: number;
  date: string;
};

type CleanerDashboardResponse = {
  cleaner: {
    name: string;
    rating: number | null;
    reviews: number;
    jobsCompleted: number;
  };
  today: {
    assignedCount: number;
    jobs: CleanerDashboardJob[];
  };
  earnings: {
    pendingPayout: number;
    recentDays: {
      date: string;
      total: number;
      jobs: number;
    }[];
  };
};

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const t = token as (null | { role?: unknown; phone?: unknown });
    const role = typeof t?.role === "string" ? t.role : undefined;
    const phone = typeof t?.phone === "string" ? t.phone : undefined;

    if (!token || role !== "cleaner" || !phone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "cleaner")
      .eq("phone", phone)
      .single();

    const cleanerId =
      (profile && (profile.id as string | undefined)) ?? undefined;

    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);

    const { data: bookingRows, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, name, address, service, status, total_amount, date, time, created_at",
      )
      .eq("cleaner_id", cleanerId)
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(100);

    if (bookingError) {
      console.error("Error loading cleaner bookings:", bookingError);
      return NextResponse.json(
        { error: "Failed to load cleaner bookings" },
        { status: 500 },
      );
    }

    const allBookings = (bookingRows ?? []) as any[];

    const todayJobs: CleanerDashboardJob[] = allBookings
      .filter((row) => row.date === todayIso)
      .map((row) => ({
        id: String(row.id ?? ""),
        customer: row.name ?? "Customer",
        address: row.address ?? null,
        time: row.time ?? "",
        service: row.service ?? "Cleaning",
        status: row.status ?? null,
        totalAmount: Number(row.total_amount ?? 0),
        date: row.date ?? todayIso,
      }));

    const completedStatuses = ["confirmed", "completed"];

    const jobsCompleted = allBookings.filter((row) =>
      completedStatuses.includes((row.status ?? "").toString()),
    ).length;

    const pendingPayout = allBookings
      .filter((row) =>
        completedStatuses.includes((row.status ?? "").toString()),
      )
      .reduce(
        (sum, row) => sum + Number(row.total_amount ?? 0),
        0,
      );

    const recentMap = new Map<
      string,
      {
        total: number;
        jobs: number;
      }
    >();

    allBookings.forEach((row) => {
      const d = (row.date as string | null) ?? undefined;
      if (!d) return;
      const total = Number(row.total_amount ?? 0);
      const current = recentMap.get(d) ?? { total: 0, jobs: 0 };
      current.total += total;
      current.jobs += 1;
      recentMap.set(d, current);
    });

    const recentDays = Array.from(recentMap.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 7)
      .map(([date, value]) => ({
        date,
        total: value.total,
        jobs: value.jobs,
      }));

    const { data: ratingRows, error: ratingError } = await supabase
      .from("booking_ratings")
      .select("rating, rater_type, bookings(cleaner_id)")
      .eq("rater_type", "customer");

    let rating: number | null = null;
    let reviews = 0;

    if (!ratingError && Array.isArray(ratingRows)) {
      const relevant = (ratingRows as any[]).filter(
        (row) => row.bookings?.cleaner_id === cleanerId,
      );
      if (relevant.length > 0) {
        const sum = relevant.reduce(
          (acc, row) => acc + Number(row.rating ?? 0),
          0,
        );
        rating = sum / relevant.length;
        reviews = relevant.length;
      }
    }

    const response: CleanerDashboardResponse = {
      cleaner: {
        name:
          (profile && profile.name && String(profile.name).trim()) ||
          "Cleaner",
        rating,
        reviews,
        jobsCompleted,
      },
      today: {
        assignedCount: todayJobs.length,
        jobs: todayJobs,
      },
      earnings: {
        pendingPayout,
        recentDays,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in cleaner dashboard route:", err);
    return NextResponse.json(
      { error: "Unexpected error while loading cleaner dashboard" },
      { status: 500 },
    );
  }
}

