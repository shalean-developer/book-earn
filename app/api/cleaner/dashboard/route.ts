import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";
import { computeEstimatedDurationMinutes } from "@/lib/duration";
import { getCleanerEarningsForBooking } from "@/lib/cleaner-earnings";

type CleanerDashboardJob = {
  id: string;
  customer: string;
  address: string | null;
  time: string;
  service: string;
  status: string | null;
  /** Cleaner earnings for this job (not customer total). */
  totalAmount: number;
  date: string;
  /** Estimated duration in minutes (min 3.5h). */
  estimatedDurationMinutes: number | null;
  /** Cleaner's rating of the customer (1-5), if already submitted */
  cleanerRating: number | null;
  /** What the customer booked — for cleaner to see what to do */
  bookingDetails: {
    bedrooms: number | null;
    bathrooms: number | null;
    extraRooms: number | null;
    propertyType: string | null;
    officeSize: string | null;
    privateOffices: number | null;
    meetingRooms: number | null;
    carpetedRooms: number | null;
    looseRugs: number | null;
    carpetExtraCleaners: number | null;
    extras: string[];
    instructions: string | null;
    apartmentUnit: string | null;
  };
};

type ScheduleDay = {
  date: string;
  dateLabel: string;
  jobs: CleanerDashboardJob[];
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
  schedule: ScheduleDay[];
  earnings: {
    pendingPayout: number;
    recentDays: {
      date: string;
      total: number;
      jobs: number;
    }[];
  };
  history: {
    completed: CleanerDashboardJob[];
    cancelled: CleanerDashboardJob[];
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
        "id, name, address, service, status, total_amount, tip_amount, service_fee_amount, equipment_charge_amount, date, time, created_at, bedrooms, bathrooms, extra_rooms, property_type, office_size, private_offices, meeting_rooms, carpeted_rooms, loose_rugs, carpet_extra_cleaners, extras, instructions, apartment_unit, estimated_duration_minutes",
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

    // Available to withdraw (completed earnings minus any requested/processed payouts)
    let pendingPayoutFromRpc: number | null = null;
    if (cleanerId) {
      const { data: availableData, error: availableError } = await supabase.rpc(
        "get_cleaner_available_payout",
        { p_cleaner_id: cleanerId },
      );
      if (!availableError && availableData != null) {
        pendingPayoutFromRpc = Number(availableData);
      } else if (availableError) {
        console.error("get_cleaner_available_payout RPC error:", availableError);
        // Fallback to total pending if table not yet migrated
        const { data: fallback } = await supabase.rpc("get_cleaner_pending_payout", { p_cleaner_id: cleanerId });
        if (fallback != null) pendingPayoutFromRpc = Number(fallback);
      }
    }

    // Dedicated query for earnings: completed jobs only, for Recent Earnings breakdown by day (cleaner earnings, not total_amount)
    const { data: completedRows, error: completedError } = await supabase
      .from("bookings")
      .select("date, total_amount, service, tip_amount, service_fee_amount, equipment_charge_amount")
      .eq("cleaner_id", cleanerId)
      .ilike("status", "completed")
      .order("date", { ascending: false })
      .limit(500);

    if (completedError) {
      console.error("Error loading completed bookings for earnings:", completedError);
    }

    const allBookings = (bookingRows ?? []) as any[];
    const excludedStatuses = ["completed", "cancelled", "failed"];
    const isActive = (row: { date?: string; status?: string }) =>
      !excludedStatuses.includes((row.status ?? "").toString().toLowerCase());

    const next7Dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      next7Dates.push(d.toISOString().slice(0, 10));
    }

    const scheduleRows = allBookings.filter(
      (row) =>
        next7Dates.includes(row.date as string) && isActive(row),
    );
    const allBookingIds = [...new Set(allBookings.map((r) => r.id))];

    const cleanerRatingsByBooking: Record<string, number> = {};
    if (allBookingIds.length > 0) {
      const { data: cleanerRatingRows } = await supabase
        .from("booking_ratings")
        .select("booking_id, rating")
        .eq("rater_type", "cleaner")
        .in("booking_id", allBookingIds);
      (cleanerRatingRows ?? []).forEach((r: { booking_id: string; rating: number }) => {
        cleanerRatingsByBooking[r.booking_id] = Number(r.rating ?? 0);
      });
    }

    const rowToJob = (row: any): CleanerDashboardJob => {
      const rawExtras = row.extras;
      const extras: string[] = Array.isArray(rawExtras)
        ? rawExtras.filter((e): e is string => typeof e === "string")
        : [];
      // Show cleaner earnings only (not customer total); same formula for all statuses (est. for upcoming, actual for completed)
      const cleanerEarnings = getCleanerEarningsForBooking({
        service: row.service,
        total_amount: row.total_amount,
        tip_amount: row.tip_amount,
        service_fee_amount: row.service_fee_amount,
        equipment_charge_amount: row.equipment_charge_amount,
      });
      return {
        id: String(row.id ?? ""),
        customer: row.name ?? "Customer",
        address: row.address ?? null,
        time: row.time ?? "",
        service: row.service ?? "Cleaning",
        status: row.status ?? null,
        totalAmount: cleanerEarnings,
        date: row.date ?? todayIso,
        estimatedDurationMinutes:
          row.estimated_duration_minutes != null
            ? Number(row.estimated_duration_minutes)
            : computeEstimatedDurationMinutes({
                service: row.service ?? "standard",
                bedrooms: row.bedrooms ?? 1,
                bathrooms: row.bathrooms ?? 1,
                extraRooms: row.extra_rooms ?? 0,
                propertyType: row.property_type ?? "apartment",
                officeSize: row.office_size ?? "",
                privateOffices: row.private_offices ?? 0,
                meetingRooms: row.meeting_rooms ?? 0,
                carpetedRooms: row.carpeted_rooms ?? 0,
                looseRugs: row.loose_rugs ?? 0,
                carpetExtraCleaners: row.carpet_extra_cleaners ?? 0,
                extras,
              }),
        cleanerRating: cleanerRatingsByBooking[row.id] ?? null,
        bookingDetails: {
          bedrooms: row.bedrooms != null ? Number(row.bedrooms) : null,
          bathrooms: row.bathrooms != null ? Number(row.bathrooms) : null,
          extraRooms: row.extra_rooms != null ? Number(row.extra_rooms) : null,
          propertyType: row.property_type ?? null,
          officeSize: row.office_size ?? null,
          privateOffices: row.private_offices != null ? Number(row.private_offices) : null,
          meetingRooms: row.meeting_rooms != null ? Number(row.meeting_rooms) : null,
          carpetedRooms: row.carpeted_rooms != null ? Number(row.carpeted_rooms) : null,
          looseRugs: row.loose_rugs != null ? Number(row.loose_rugs) : null,
          carpetExtraCleaners: row.carpet_extra_cleaners != null ? Number(row.carpet_extra_cleaners) : null,
          extras,
          instructions: row.instructions ?? null,
          apartmentUnit: row.apartment_unit ?? null,
        },
      };
    };

    const todayRowsActive = scheduleRows.filter((row) => row.date === todayIso);
    const todayJobs: CleanerDashboardJob[] = todayRowsActive.map(rowToJob);

    const formatDateLabel = (dateStr: string): string => {
      if (dateStr === todayIso) return "Today";
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (dateStr === tomorrow.toISOString().slice(0, 10)) return "Tomorrow";
      const d = new Date(dateStr + "T12:00:00");
      return d.toLocaleDateString("en-ZA", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    };

    const schedule: ScheduleDay[] = next7Dates.map((date) => ({
      date,
      dateLabel: formatDateLabel(date),
      jobs: scheduleRows
        .filter((r) => r.date === date)
        .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
        .map(rowToJob),
    }));

    const completedStatuses = ["completed"];
    const isCompleted = (row: { status?: string }) =>
      completedStatuses.includes((row.status ?? "").toString().toLowerCase());

    const jobsCompleted = allBookings.filter((row) => isCompleted(row)).length;

    // Earnings: use DB sum for exact Total Payout Pending; use completed rows for Recent Earnings by day
    type CompletedRow = {
      date: string | null;
      total_amount?: number | null;
      service?: string | null;
      tip_amount?: number | null;
      service_fee_amount?: number | null;
      equipment_charge_amount?: number | null;
    };
    const completedBookings = (completedRows ?? []) as CompletedRow[];
    const normalizeDate = (d: string | null | undefined): string | null => {
      if (d == null) return null;
      const s = String(d);
      return s.slice(0, 10);
    };

    const pendingPayout =
      pendingPayoutFromRpc != null
        ? pendingPayoutFromRpc
        : completedBookings.reduce(
            (sum, row) => sum + getCleanerEarningsForBooking(row),
            0,
          ); // fallback if RPC missing

    const recentMap = new Map<
      string,
      { total: number; jobs: number }
    >();
    completedBookings.forEach((row) => {
      const d = normalizeDate(row.date);
      if (!d) return;
      const earnings = getCleanerEarningsForBooking(row);
      const current = recentMap.get(d) ?? { total: 0, jobs: 0 };
      current.total += earnings;
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

    const historyCompleted = allBookings
      .filter((row) => (row.status ?? "").toString().toLowerCase() === "completed")
      .sort((a, b) => {
        const d = (a.date ?? "").localeCompare(b.date ?? "");
        if (d !== 0) return -d;
        return -(a.time ?? "").localeCompare(b.time ?? "");
      })
      .map(rowToJob);

    const historyCancelled = allBookings
      .filter((row) => (row.status ?? "").toString().toLowerCase() === "cancelled")
      .sort((a, b) => {
        const d = (a.date ?? "").localeCompare(b.date ?? "");
        if (d !== 0) return -d;
        return -(a.time ?? "").localeCompare(b.time ?? "");
      })
      .map(rowToJob);

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
      schedule,
      earnings: {
        pendingPayout,
        recentDays,
      },
      history: {
        completed: historyCompleted,
        cancelled: historyCancelled,
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

