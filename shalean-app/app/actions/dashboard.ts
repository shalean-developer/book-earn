"use server";

import { createHash } from "crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfileForSession } from "@/app/actions/profile";
import { getCleanerDisplayName } from "@/lib/constants";
import { computeCleanerEarnings } from "@/lib/revenue-split";
import type { ServiceType } from "@/lib/booking-routes";
import type { CleanerProfile } from "@/lib/dashboard-types";

type BookingRow = {
  id: string;
  booking_ref: string;
  service: string;
  date: string;
  time: string;
  total: number;
  address: string;
  instructions: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  extra_rooms: number | null;
  extras: string[] | null;
  cleaner_id: string | null;
  team_id: string | null;
  customer_name: string;
  status: string;
  created_at: string;
};

/** Row shape for cleaner jobs query (includes tip_amount). */
type CleanerBookingRow = BookingRow & { tip_amount: number };

function toDashboardStatus(
  status: string,
  dateStr: string,
  timeStr?: string
): "upcoming" | "completed" | "cancelled" {
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  const today = new Date().toISOString().slice(0, 10);
  if (timeStr) {
    const slotAt = new Date(dateStr + "T" + timeStr + ":00");
    if (!Number.isNaN(slotAt.getTime())) {
      return slotAt <= new Date() ? "completed" : "upcoming";
    }
  }
  return dateStr > today ? "upcoming" : dateStr < today ? "completed" : "upcoming";
}

/** Dashboard booking shape for customer list and admin list. */
export interface DashboardBooking {
  id: string;
  ref: string;
  date: string;
  time: string;
  service: ServiceType;
  status: "upcoming" | "completed" | "cancelled";
  /** Raw DB status for lifecycle display (confirmed, on_my_way, arrived, started, completed, cancelled). */
  statusRaw?: string;
  total: number;
  address?: string;
  instructions?: string;
  bedrooms?: number;
  bathrooms?: number;
  extraRooms?: number;
  extras?: string[];
  cleanerName?: string;
  customerName?: string;
}

function rowToDashboardBooking(
  row: BookingRow,
  cleanerNameById?: Record<string, string>,
  teamDisplayName?: string
): DashboardBooking {
  const status = toDashboardStatus(row.status, row.date, row.time);
  const resolvedCleanerName = teamDisplayName ?? (row.cleaner_id && cleanerNameById?.[row.cleaner_id]);
  const fallbackCleanerName = getCleanerDisplayName(row.cleaner_id, row.team_id);
  const cleanerName =
    resolvedCleanerName ?? (fallbackCleanerName !== "Assigned" ? fallbackCleanerName : undefined);
  return {
    id: row.id,
    ref: row.booking_ref,
    date: row.date,
    time: row.time,
    service: row.service as ServiceType,
    status,
    statusRaw: row.status,
    total: Number(row.total),
    address: row.address,
    instructions: row.instructions ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    extraRooms: row.extra_rooms ?? undefined,
    extras: row.extras ?? undefined,
    cleanerName,
    customerName: row.customer_name,
  };
}

/** Cleaner job lifecycle status for UI (raw DB status used as-is). */
export type CleanerJobStatus = "confirmed" | "on_my_way" | "arrived" | "started" | "completed" | "cancelled";

/** Cleaner job shape (today's schedule / earnings). */
export interface CleanerJob {
  id: string;
  customerName: string;
  address: string;
  time: string;
  service: ServiceType;
  /** Lifecycle status from DB for button flow. */
  status: CleanerJobStatus;
  price: number;
  tipAmount: number;
  /** True if cleaner has already submitted a rating for this booking. */
  hasCleanerRated: boolean;
}

const CLEANER_JOB_STATUS_VALUES: CleanerJobStatus[] = [
  "confirmed",
  "on_my_way",
  "arrived",
  "started",
  "completed",
  "cancelled",
];

function toCleanerJobStatus(s: string): CleanerJobStatus {
  return CLEANER_JOB_STATUS_VALUES.includes(s as CleanerJobStatus) ? (s as CleanerJobStatus) : "confirmed";
}

function rowToCleanerJob(
  row: CleanerBookingRow,
  cleanerRatedBookingIds: Set<string>,
  earningsOverride?: number
): CleanerJob {
  const today = new Date().toISOString().slice(0, 10);
  const rawStatus = toCleanerJobStatus(row.status);
  let status: CleanerJobStatus;
  if (row.date < today) {
    status = "completed";
  } else if (row.date > today) {
    status = "confirmed";
  } else {
    const slotAt = new Date(row.date + "T" + (row.time || "23:59") + ":00");
    status =
      !Number.isNaN(slotAt.getTime()) && slotAt <= new Date() ? ("completed" as const) : rawStatus;
  }
  const tipAmount = Number(row.tip_amount ?? 0);
  const price =
    earningsOverride !== undefined
      ? earningsOverride
      : computeCleanerEarnings(row.service, row.total, tipAmount).cleanerEarnings;
  return {
    id: row.id,
    customerName: row.customer_name,
    address: row.address,
    time: row.time,
    service: row.service as ServiceType,
    status,
    price,
    tipAmount,
    hasCleanerRated: cleanerRatedBookingIds.has(row.id),
  };
}

export async function getBookingsByCustomerEmail(
  email: string
): Promise<DashboardBooking[]> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select("id, booking_ref, service, date, time, total, address, instructions, bedrooms, bathrooms, extra_rooms, extras, cleaner_id, team_id, customer_name, status, created_at")
      .eq("customer_email", email.trim())
      .order("date", { ascending: false })
      .order("time", { ascending: false });
    if (error) return [];
    const rows = (data ?? []) as BookingRow[];
    const bookingIds = rows.map((r) => r.id);
    const cleanerIdsFromRows = [...new Set(rows.map((r) => r.cleaner_id).filter(Boolean))] as string[];

    const assignmentMap: Record<string, string[]> = {};
    if (bookingIds.length > 0) {
      const { data: assignData } = await supabase
        .from("booking_assignments")
        .select("booking_id, cleaner_id")
        .in("booking_id", bookingIds);
      for (const r of (assignData ?? []) as { booking_id: string; cleaner_id: string }[]) {
        if (!assignmentMap[r.booking_id]) assignmentMap[r.booking_id] = [];
        assignmentMap[r.booking_id].push(r.cleaner_id);
      }
    }
    const cleanerIdsFromAssignments = [...new Set(Object.values(assignmentMap).flat())];
    const allCleanerIds = [...new Set([...cleanerIdsFromRows, ...cleanerIdsFromAssignments])];

    const cleanerNameById: Record<string, string> = {};
    if (allCleanerIds.length > 0) {
      const { data: byCleanerId } = await supabase
        .from("profiles")
        .select("cleaner_id, name")
        .in("cleaner_id", allCleanerIds);
      for (const p of byCleanerId ?? []) {
        const key = (p as { cleaner_id: string | null; name: string | null }).cleaner_id;
        const name = (p as { cleaner_id: string | null; name: string | null }).name;
        if (key && name) cleanerNameById[key] = name.trim() || "Cleaner";
      }
      const matched = new Set(Object.keys(cleanerNameById));
      const remaining = allCleanerIds.filter((id) => !matched.has(id));
      if (remaining.length > 0) {
        const { data: byId } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", remaining);
        for (const p of byId ?? []) {
          const key = (p as { id: string; name: string | null }).id;
          const name = (p as { id: string; name: string | null }).name;
          if (key && name) cleanerNameById[key] = name.trim() || "Cleaner";
        }
      }
    }

    return rows.map((row) => {
      const teamIds = assignmentMap[row.id];
      const teamDisplayName =
        teamIds?.length > 0
          ? "Team (" + teamIds.map((id) => cleanerNameById[id] ?? id).join(", ") + ")"
          : undefined;
      return rowToDashboardBooking(row, cleanerNameById, teamDisplayName);
    });
  } catch {
    return [];
  }
}

export async function getBookingsByCleanerId(
  cleanerId: string,
  options?: { date?: string }
): Promise<CleanerJob[]> {
  try {
    const supabase = createServerSupabase();
    const { data: assignmentRows } = await supabase
      .from("booking_assignments")
      .select("booking_id, earnings")
      .eq("cleaner_id", cleanerId);
    const assignmentBookingIds = (assignmentRows ?? []).map((r: { booking_id: string }) => r.booking_id);
    const assignmentEarningsByBookingId: Record<string, number> = {};
    for (const r of (assignmentRows ?? []) as { booking_id: string; earnings: number }[]) {
      assignmentEarningsByBookingId[r.booking_id] = Number(r.earnings);
    }

    let query = supabase
      .from("bookings")
      .select("id, booking_ref, service, date, time, total, tip_amount, address, instructions, cleaner_id, team_id, customer_name, status, created_at");
    if (assignmentBookingIds.length > 0) {
      query = query.or(`cleaner_id.eq.${cleanerId},id.in.(${assignmentBookingIds.join(",")})`);
    } else {
      query = query.eq("cleaner_id", cleanerId);
    }
    query = query.order("date", { ascending: true }).order("time", { ascending: true });
    if (options?.date) {
      query = query.eq("date", options.date);
    }
    const { data, error } = await query;
    if (error) return [];
    const rows = (data ?? []) as CleanerBookingRow[];
    const bookingIds = rows.map((r) => r.id);
    let cleanerRatedBookingIds = new Set<string>();
    if (bookingIds.length > 0) {
      const { data: ratingRows } = await supabase
        .from("booking_ratings")
        .select("booking_id")
        .eq("rater_type", "cleaner")
        .in("booking_id", bookingIds);
      cleanerRatedBookingIds = new Set((ratingRows ?? []).map((r: { booking_id: string }) => r.booking_id));
    }
    return rows.map((row) =>
      rowToCleanerJob(row, cleanerRatedBookingIds, assignmentEarningsByBookingId[row.id])
    );
  } catch {
    return [];
  }
}

const CLEANER_STATUS_TRANSITIONS: Record<CleanerJobStatus, CleanerJobStatus[] | null> = {
  confirmed: ["on_my_way"],
  on_my_way: ["arrived"],
  arrived: ["started"],
  started: ["completed"],
  completed: [],
  cancelled: [],
};

/** Cleaner-only: update booking job status (confirmed → on_my_way → arrived → started → completed).
 * When status is set to completed, that booking's earnings are reflected as available (and no longer pending) on the next load of earnings. */
export async function updateBookingJobStatusForCleaner(
  bookingId: string,
  newStatus: "on_my_way" | "arrived" | "started" | "completed"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "cleaner") {
    return { ok: false, error: "Only cleaners can update job status." };
  }
  const cleanerId = (profile as CleanerProfile).id;
  try {
    const supabase = createServerSupabase();
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, status, cleaner_id")
      .eq("id", bookingId)
      .single();
    if (fetchError || !booking) {
      return { ok: false, error: "Booking not found." };
    }
    const isAssignedSolo = booking.cleaner_id === cleanerId;
    let isAssignedTeam = false;
    if (!isAssignedSolo) {
      const { data: assign } = await supabase
        .from("booking_assignments")
        .select("cleaner_id")
        .eq("booking_id", bookingId)
        .eq("cleaner_id", cleanerId)
        .maybeSingle();
      isAssignedTeam = !!assign;
    }
    if (!isAssignedSolo && !isAssignedTeam) {
      return { ok: false, error: "You can only update your own assigned jobs." };
    }
    const current = toCleanerJobStatus(booking.status as string);
    const allowed = CLEANER_STATUS_TRANSITIONS[current];
    if (!allowed || !allowed.includes(newStatus)) {
      return { ok: false, error: "Invalid status transition." };
    }
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (updateError) return { ok: false, error: updateError.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

/** Full admin booking row with details for expanded view. */
export interface AdminBookingRow {
  id: string;
  ref: string;
  customerName: string;
  service: string;
  date: string;
  time: string;
  /** Display status (upcoming/completed/cancelled) for badges. */
  status: "upcoming" | "completed" | "cancelled";
  /** Raw DB status for admin update dropdown (confirmed/completed/cancelled). */
  statusRaw: string;
  total: number;
  /** Assigned cleaner ID (profile id or profiles.cleaner_id) or null. */
  cleanerId: string | null;
  /** Assigned team ID (t1–t3) or null. */
  teamId: string | null;
  /** Detail fields for expanded card. */
  address: string;
  instructions: string | null;
  customerEmail: string;
  customerPhone: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  workingArea: string;
  extras: string[];
  subtotal: number;
  discountAmount: number;
  tipAmount: number;
  paymentMethod: string;
  paymentRef: string | null;
  paymentStatus: string;
  /** Gravatar URL derived from customer_email for avatar display. */
  customerAvatarUrl: string;
  /** For team Deep/Move: cleaner IDs from booking_assignments. */
  assignedTeamCleanerIds?: string[];
}

type AdminBookingDbRow = {
  id: string;
  booking_ref: string;
  service: string;
  date: string;
  time: string;
  total: number;
  customer_name: string;
  status: string;
  cleaner_id: string | null;
  team_id: string | null;
  address: string;
  instructions: string | null;
  customer_email: string;
  customer_phone: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  working_area: string;
  extras: string[];
  subtotal: number;
  discount_amount: number;
  tip_amount: number;
  payment_method: string;
  payment_ref: string | null;
  payment_status: string;
};

function gravatarUrl(email: string, size = 64): string {
  const trimmed = (email ?? "").trim().toLowerCase();
  if (!trimmed) return "";
  const hash = createHash("md5").update(trimmed).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=${size}`;
}

function mapAdminBookingRow(
  r: AdminBookingDbRow,
  assignedTeamCleanerIds?: string[]
): AdminBookingRow {
  return {
    id: r.id,
    ref: r.booking_ref,
    customerName: r.customer_name,
    service: r.service,
    date: r.date,
    time: r.time,
    status: toDashboardStatus(r.status, r.date, r.time),
    statusRaw: r.status,
    total: Number(r.total),
    cleanerId: r.cleaner_id ?? null,
    teamId: r.team_id ?? null,
    address: r.address,
    instructions: r.instructions,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    propertyType: r.property_type,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    workingArea: r.working_area,
    extras: Array.isArray(r.extras) ? r.extras : [],
    subtotal: Number(r.subtotal),
    discountAmount: Number(r.discount_amount),
    tipAmount: Number(r.tip_amount),
    paymentMethod: r.payment_method,
    paymentRef: r.payment_ref,
    paymentStatus: r.payment_status ?? "paid",
    customerAvatarUrl: gravatarUrl(r.customer_email),
    assignedTeamCleanerIds,
  };
}

/** Filter params for admin bookings list. */
export interface AdminBookingFilters {
  status?: string;
  payment_status?: string;
  service?: string;
  date_from?: string;
  date_to?: string;
}

export async function getBookingsAdmin(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  payment_status?: string;
  service?: string;
  date_from?: string;
  date_to?: string;
}): Promise<AdminBookingRow[]> {
  try {
    const supabase = createServerSupabase();
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    let query = supabase
      .from("bookings")
      .select(
        "id, booking_ref, service, date, time, total, customer_name, status, cleaner_id, team_id, address, instructions, customer_email, customer_phone, property_type, bedrooms, bathrooms, working_area, extras, subtotal, discount_amount, tip_amount, payment_method, payment_ref, payment_status"
      )
      .order("created_at", { ascending: false });
    if (options?.status) query = query.eq("status", options.status);
    if (options?.payment_status) query = query.eq("payment_status", options.payment_status);
    if (options?.service) query = query.eq("service", options.service);
    if (options?.date_from) query = query.gte("date", options.date_from);
    if (options?.date_to) query = query.lte("date", options.date_to);
    const { data, error } = await query.range(offset, offset + limit - 1);
    if (error) return [];
    const rows = (data ?? []) as AdminBookingDbRow[];
    const bookingIds = rows.map((r) => r.id);
    let assignmentMap: Record<string, string[]> = {};
    if (bookingIds.length > 0) {
      const { data: assignData } = await supabase
        .from("booking_assignments")
        .select("booking_id, cleaner_id")
        .in("booking_id", bookingIds);
      for (const r of (assignData ?? []) as { booking_id: string; cleaner_id: string }[]) {
        if (!assignmentMap[r.booking_id]) assignmentMap[r.booking_id] = [];
        assignmentMap[r.booking_id].push(r.cleaner_id);
      }
    }
    return rows.map((r) => mapAdminBookingRow(r, assignmentMap[r.id]));
  } catch {
    return [];
  }
}

/** Public: list of cleaners for the booking form (from profiles, no auth required). */
export interface CleanerForBooking {
  id: string;
  name: string;
  avatar: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
}

export async function getCleanersForBooking(): Promise<CleanerForBooking[]> {
  try {
    const supabase = createServerSupabase();
    const { data: rows, error } = await supabase
      .from("profiles")
      .select("id, name, avatar, cleaner_id, verification_status")
      .eq("role", "cleaner")
      .order("name");

    if (error || !rows?.length) return [];

    const status = (s: string | null): "pending" | "verified" | "rejected" =>
      s === "verified" || s === "rejected" ? s : "pending";

    return (rows as { id: string; name: string | null; avatar: string | null; cleaner_id: string | null; verification_status: string | null }[]).map(
      (r) => ({
        id: r.cleaner_id ?? r.id,
        name: r.name?.trim() || "Cleaner",
        avatar: r.avatar ?? null,
        verificationStatus: status(r.verification_status),
      })
    );
  } catch {
    return [];
  }
}

export interface AdminStats {
  totalRevenue: number;
  activeCleaners: number;
  pendingBookings: number;
  customerSatisfaction: number;
}

/** Auth-aware: returns bookings for the currently signed-in customer, or [] if not customer. */
export async function getMyBookings(): Promise<DashboardBooking[]> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "customer") return [];
  return getBookingsByCustomerEmail(profile.email);
}

/** Auth-aware: returns jobs for the currently signed-in cleaner, or [] if not cleaner. */
export async function getMyCleanerJobs(options?: { date?: string }): Promise<CleanerJob[]> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "cleaner") return [];
  return getBookingsByCleanerId((profile as CleanerProfile).id, options);
}

/** Earnings and balance for a cleaner: from bookings and payouts. */
export interface CleanerEarningsAndBalance {
  totalEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  completedJobs: number;
}

export async function getCleanerEarningsAndBalance(
  profileId: string,
  cleanerId: string
): Promise<CleanerEarningsAndBalance> {
  try {
    const supabase = createServerSupabase();

    const payoutsRes = await supabase
      .from("payouts")
      .select("amount, status")
      .eq("profile_id", profileId)
      .eq("status", "success");

    let bookings: { earnings: number; status: string }[];
    const bookingsWithEarnings = await supabase
      .from("bookings")
      .select("cleaner_earnings, total, status")
      .eq("cleaner_id", cleanerId)
      .neq("status", "cancelled");

    if (bookingsWithEarnings.error) {
      // Column cleaner_earnings may not exist yet (migration not run); fall back to total
      const fallback = await supabase
        .from("bookings")
        .select("total, status")
        .eq("cleaner_id", cleanerId)
        .neq("status", "cancelled");
      if (fallback.error) throw fallback.error;
      bookings = (fallback.data ?? []).map((b: { total: number; status: string }) => ({
        earnings: Number(b.total ?? 0),
        status: b.status,
      }));
    } else {
      const rows = (bookingsWithEarnings.data ?? []) as {
        cleaner_earnings?: number;
        total?: number;
        status: string;
      }[];
      bookings = rows.map((b) => ({
        earnings: Number(b.cleaner_earnings ?? b.total ?? 0),
        status: b.status,
      }));
    }

    const { data: assignmentRows } = await supabase
      .from("booking_assignments")
      .select("booking_id, earnings")
      .eq("cleaner_id", cleanerId);
    if (assignmentRows?.length) {
      const assignmentBookingIds = (assignmentRows as { booking_id: string; earnings: number }[]).map(
        (r) => r.booking_id
      );
      const { data: assignmentBookings } = await supabase
        .from("bookings")
        .select("id, status")
        .in("id", assignmentBookingIds)
        .neq("status", "cancelled");
      const statusByBookingId: Record<string, string> = {};
      for (const b of (assignmentBookings ?? []) as { id: string; status: string }[]) {
        statusByBookingId[b.id] = b.status;
      }
      for (const r of assignmentRows as { booking_id: string; earnings: number }[]) {
        const status = statusByBookingId[r.booking_id];
        if (status) {
          bookings.push({ earnings: Number(r.earnings), status });
        }
      }
    }

    const payouts = (payoutsRes.data ?? []) as { amount: number; status: string }[];

    let totalEarnings = 0;
    let pendingEarnings = 0;
    let completedJobs = 0;
    for (const b of bookings) {
      if (b.status === "completed") {
        totalEarnings += b.earnings;
        completedJobs += 1;
      } else {
        pendingEarnings += b.earnings;
      }
    }
    const paidOut = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
    const availableBalance = Math.max(0, totalEarnings - paidOut);

    return {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      pendingEarnings: Math.round(pendingEarnings * 100) / 100,
      availableBalance: Math.round(availableBalance * 100) / 100,
      completedJobs,
    };
  } catch {
    return {
      totalEarnings: 0,
      pendingEarnings: 0,
      availableBalance: 0,
      completedJobs: 0,
    };
  }
}

/** Auth-aware: returns admin stats only if the current user is admin. */
export async function getAdminStatsForSession(): Promise<AdminStats | null> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return null;
  return getAdminStats();
}

/** Auth-aware: returns admin bookings list only if the current user is admin. */
export async function getAdminBookingsForSession(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  payment_status?: string;
  service?: string;
  date_from?: string;
  date_to?: string;
}): Promise<AdminBookingRow[]> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return [];
  return getBookingsAdmin(options);
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const supabase = createServerSupabase();
    const today = new Date().toISOString().slice(0, 10);

    const [bookingsRes, pendingRes, crewRes] = await Promise.all([
      supabase.from("bookings").select("total"),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("date", today)
        .neq("status", "cancelled"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "cleaner").eq("verification_status", "verified"),
    ]);

    const rows = (bookingsRes.data ?? []) as { total: number }[];
    let totalRevenue = 0;
    for (const r of rows) {
      totalRevenue += Number(r.total);
    }

    return {
      totalRevenue: Math.round(totalRevenue),
      activeCleaners: crewRes.count ?? 0,
      pendingBookings: pendingRes.count ?? 0,
      customerSatisfaction: 4.8,
    };
  } catch {
    return {
      totalRevenue: 0,
      activeCleaners: 0,
      pendingBookings: 0,
      customerSatisfaction: 4.8,
    };
  }
}
