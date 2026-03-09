"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getProfileForSession } from "@/app/actions/profile";
import { getCleanerEarningsAndBalance } from "@/app/actions/dashboard";
import type { VerificationStatus } from "@/lib/dashboard-types";

export interface AdminCleanerRow {
  id: string;
  profileId: string;
  name: string;
  email: string;
  cleanerId: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verificationNotes: string | null;
  verificationProvider: string | null;
  completedJobs: number;
  totalEarnings: number;
  avatar: string | null;
}

/** Auth-aware: returns list of cleaners for admin Crew tab. Only if current user is admin. */
export async function getCleanersForAdmin(): Promise<AdminCleanerRow[]> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return [];

  try {
    const supabase = createServerSupabase();
    const { data: rows, error } = await supabase
      .from("profiles")
      .select("id, name, email, avatar, cleaner_id, verification_status, verification_notes, verified_at, verification_provider")
      .eq("role", "cleaner")
      .order("name");

    if (error || !rows?.length) return [];

    const status = (s: string | null): VerificationStatus =>
      s === "verified" || s === "rejected" ? s : "pending";

    const result: AdminCleanerRow[] = await Promise.all(
      rows.map(async (row: Record<string, unknown>) => {
        const profileId = row.id as string;
        const cleanerId = (row.cleaner_id as string) ?? profileId;
        const earnings = await getCleanerEarningsAndBalance(profileId, cleanerId);
        return {
          id: cleanerId,
          profileId,
          name: (row.name as string) ?? "",
          email: (row.email as string) ?? "",
          cleanerId,
          verificationStatus: status(row.verification_status as string | null),
          verifiedAt: (row.verified_at as string | null) ?? null,
          verificationNotes: (row.verification_notes as string | null) ?? null,
          verificationProvider: (row.verification_provider as string | null) ?? null,
          completedJobs: earnings.completedJobs,
          totalEarnings: earnings.totalEarnings,
          avatar: (row.avatar as string | null) ?? null,
        };
      })
    );
    return result;
  } catch {
    return [];
  }
}

export interface PayoutStatsForAdmin {
  totalPaidOut: number;
  countSuccess: number;
  countPending: number;
  totalPending: number;
  countFailed: number;
}

export interface AdminPayoutRow {
  id: string;
  profileId: string;
  cleanerName: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

/** Admin-only: payout stats (total paid out, counts by status). */
export async function getPayoutStatsForAdmin(): Promise<PayoutStatsForAdmin | null> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return null;
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("payouts")
      .select("amount, status");
    if (error) return null;
    const rows = (data ?? []) as { amount: number; status: string }[];
    let totalPaidOut = 0;
    let countSuccess = 0;
    let countPending = 0;
    let totalPending = 0;
    let countFailed = 0;
    for (const r of rows) {
      const amt = Number(r.amount);
      if (r.status === "success") {
        totalPaidOut += amt;
        countSuccess++;
      } else if (r.status === "pending") {
        totalPending += amt;
        countPending++;
      } else if (r.status === "failed" || r.status === "reversed") {
        countFailed++;
      }
    }
    return {
      totalPaidOut: Math.round(totalPaidOut * 100) / 100,
      countSuccess,
      countPending,
      totalPending: Math.round(totalPending * 100) / 100,
      countFailed,
    };
  } catch {
    return null;
  }
}

/** Admin-only: list payouts with cleaner name. */
export async function getPayoutsForAdmin(options?: {
  limit?: number;
  offset?: number;
}): Promise<AdminPayoutRow[]> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return [];
  try {
    const supabase = createServerSupabase();
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const { data: payoutRows, error: payoutsError } = await supabase
      .from("payouts")
      .select("id, profile_id, amount, currency, status, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (payoutsError || !payoutRows?.length) return [];
    const profileIds = [...new Set((payoutRows as { profile_id: string }[]).map((r) => r.profile_id))];
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", profileIds);
    const nameByProfileId: Record<string, string> = {};
    for (const p of profileRows ?? []) {
      const row = p as { id: string; name: string | null };
      nameByProfileId[row.id] = row.name ?? "—";
    }
    return (payoutRows as { id: string; profile_id: string; amount: number; currency: string; status: string; created_at: string }[]).map(
      (r) => ({
        id: r.id,
        profileId: r.profile_id,
        cleanerName: nameByProfileId[r.profile_id] ?? "—",
        amount: Number(r.amount),
        currency: String(r.currency ?? "ZAR"),
        status: r.status,
        created_at: r.created_at,
      })
    );
  } catch {
    return [];
  }
}

export interface PlatformScaleForAdmin {
  periodLabels: string[];
  values: number[];
  growthPercent: number | null;
}

const PLATFORM_SCALE_WEEKS = 10;

/** Admin-only: revenue by week for the last N weeks (by booking date), and period-over-period growth. */
export async function getPlatformScaleForAdmin(): Promise<PlatformScaleForAdmin | null> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return null;
  try {
    const supabase = createServerSupabase();
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 7 * PLATFORM_SCALE_WEEKS);
    const startDateStr = start.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("bookings")
      .select("date, total")
      .gte("date", startDateStr)
      .neq("status", "cancelled");

    if (error) return null;

    const rows = (data ?? []) as { date: string; total: number }[];
    const weekStarts: string[] = [];
    for (let i = 0; i < PLATFORM_SCALE_WEEKS; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - 7 * (PLATFORM_SCALE_WEEKS - i));
      d.setHours(0, 0, 0, 0);
      weekStarts.push(d.toISOString().slice(0, 10));
    }

    const values = new Array<number>(PLATFORM_SCALE_WEEKS).fill(0);
    for (const r of rows) {
      const dateStr = r.date;
      for (let i = 0; i < PLATFORM_SCALE_WEEKS; i++) {
        const weekStart = weekStarts[i];
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekEndStr = weekEnd.toISOString().slice(0, 10);
        if (dateStr >= weekStart && dateStr < weekEndStr) {
          values[i] += Number(r.total);
          break;
        }
      }
    }

    const periodLabels = weekStarts.map((d) => {
      const dt = new Date(d);
      return `${dt.getDate()}/${dt.getMonth() + 1}`;
    });

    let growthPercent: number | null = null;
    if (values.length >= 2 && values[values.length - 2] > 0) {
      growthPercent =
        ((values[values.length - 1] - values[values.length - 2]) / values[values.length - 2]) * 100;
    }

    return {
      periodLabels,
      values,
      growthPercent,
    };
  } catch {
    return null;
  }
}

export type UpdateCleanerVerificationInput = {
  verification_status: VerificationStatus;
  verification_notes?: string | null;
};

/** Admin-only: set a cleaner's verification status and optional notes. Sets verified_at when status is verified. */
export async function updateCleanerVerification(
  profileId: string,
  input: UpdateCleanerVerificationInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Only admins can update verification." };
  }

  try {
    const supabase = createServerSupabase();
    const updates: Record<string, unknown> = {
      verification_status: input.verification_status,
      verification_notes: input.verification_notes ?? null,
      updated_at: new Date().toISOString(),
    };
    if (input.verification_status === "verified") {
      updates.verified_at = new Date().toISOString();
    } else {
      updates.verified_at = null;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profileId)
      .eq("role", "cleaner");

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

const ALLOWED_BOOKING_STATUS = ["confirmed", "on_my_way", "arrived", "started", "completed", "cancelled"] as const;
const ALLOWED_PAYMENT_STATUS = ["paid", "pending", "refunded"] as const;

/** Admin-only: update booking status and/or payment_status. */
export async function updateBookingStatusForAdmin(
  bookingId: string,
  updates: { status?: string; payment_status?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Only admins can update bookings." };
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.status !== undefined) {
    if (!ALLOWED_BOOKING_STATUS.includes(updates.status as (typeof ALLOWED_BOOKING_STATUS)[number])) {
      return { ok: false, error: "Invalid booking status." };
    }
    payload.status = updates.status;
  }
  if (updates.payment_status !== undefined) {
    if (!ALLOWED_PAYMENT_STATUS.includes(updates.payment_status as (typeof ALLOWED_PAYMENT_STATUS)[number])) {
      return { ok: false, error: "Invalid payment status." };
    }
    payload.payment_status = updates.payment_status;
  }

  if (Object.keys(payload).length <= 1) {
    return { ok: false, error: "No valid updates provided." };
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("bookings")
      .update(payload)
      .eq("id", bookingId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

const ALLOWED_TEAM_IDS = ["t1", "t2", "t3"] as const;

/** Admin-only: assign a cleaner or team to a booking. Pass cleaner_id to assign a cleaner (clears team_id). Pass team_id to assign a team (clears cleaner_id). Pass both null/empty to unassign. */
export async function updateBookingAssignmentForAdmin(
  bookingId: string,
  assignment: { cleaner_id?: string | null; team_id?: string | null }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Only admins can update booking assignment." };
  }

  const cleanerId = assignment.cleaner_id?.trim() || null;
  const teamId = assignment.team_id?.trim() || null;

  if (cleanerId) {
    const supabase = createServerSupabase();
    const { data: byId } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "cleaner")
      .eq("id", cleanerId)
      .maybeSingle();
    if (!byId) {
      const { data: byCleanerId, error: cleanerError } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "cleaner")
        .eq("cleaner_id", cleanerId)
        .maybeSingle();
      if (cleanerError || !byCleanerId) {
        return { ok: false, error: "Invalid cleaner ID." };
      }
    }
  }
  if (teamId && !ALLOWED_TEAM_IDS.includes(teamId as (typeof ALLOWED_TEAM_IDS)[number])) {
    return { ok: false, error: "Invalid team ID." };
  }

  try {
    const supabase = createServerSupabase();
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      cleaner_id: cleanerId,
      team_id: teamId,
    };
    const { error } = await supabase
      .from("bookings")
      .update(payload)
      .eq("id", bookingId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

const TEAM_SERVICES = ["deep", "move"] as const;
const TEAM_EARNING_PER_MEMBER = 250;

/** Admin-only: assign team members to a Deep or Move in/out booking. Replaces any existing team assignment. */
export async function updateBookingTeamAssignmentsForAdmin(
  bookingId: string,
  cleanerIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Only admins can update team assignments." };
  }

  const trimmedIds = cleanerIds.map((id) => id.trim()).filter(Boolean);
  const uniqueIds = [...new Set(trimmedIds)];

  try {
    const supabase = createServerSupabase();
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, service, tip_amount")
      .eq("id", bookingId)
      .single();
    if (fetchError || !booking) {
      return { ok: false, error: "Booking not found." };
    }
    const service = String(booking.service).toLowerCase();
    if (!TEAM_SERVICES.includes(service as (typeof TEAM_SERVICES)[number])) {
      return { ok: false, error: "Team assignment is only for Deep or Move in/out bookings." };
    }

    const tipAmount = Number(booking.tip_amount ?? 0) || 0;
    const n = uniqueIds.length;
    const tipPerMember = n > 0 ? Math.round((tipAmount / n) * 100) / 100 : 0;
    const earningsPerMember = TEAM_EARNING_PER_MEMBER + tipPerMember;

    await supabase.from("booking_assignments").delete().eq("booking_id", bookingId);

    if (uniqueIds.length > 0) {
      const rows = uniqueIds.map((cleaner_id) => ({
        booking_id: bookingId,
        cleaner_id,
        earnings: earningsPerMember,
      }));
      const { error: insertError } = await supabase.from("booking_assignments").insert(rows);
      if (insertError) return { ok: false, error: insertError.message };
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ cleaner_id: null, team_id: null, updated_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (updateError) return { ok: false, error: updateError.message };

    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

/** Admin-only: get assigned cleaner IDs for a booking (team Deep/Move). */
export async function getBookingAssignmentsForAdmin(
  bookingId: string
): Promise<{ cleanerId: string }[]> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return [];

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("booking_assignments")
      .select("cleaner_id")
      .eq("booking_id", bookingId)
      .order("cleaner_id");
    if (error) return [];
    return (data ?? []).map((r: { cleaner_id: string }) => ({ cleanerId: r.cleaner_id }));
  } catch {
    return [];
  }
}

/** Admin-only: get assigned cleaner IDs by booking id (for list view). */
export async function getBookingAssignmentsMapForAdmin(
  bookingIds: string[]
): Promise<Record<string, string[]>> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin" || bookingIds.length === 0) return {};

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("booking_assignments")
      .select("booking_id, cleaner_id")
      .in("booking_id", bookingIds);
    if (error) return {};
    const map: Record<string, string[]> = {};
    for (const id of bookingIds) map[id] = [];
    for (const r of (data ?? []) as { booking_id: string; cleaner_id: string }[]) {
      if (!map[r.booking_id]) map[r.booking_id] = [];
      map[r.booking_id].push(r.cleaner_id);
    }
    return map;
  } catch {
    return {};
  }
}

const TIME_SLOT_REGEX = /^\d{2}:\d{2}$/;

/** Admin-only: update booking date and time (reschedule). */
export async function updateBookingDateTimeForAdmin(
  bookingId: string,
  updates: { date: string; time: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Only admins can reschedule bookings." };
  }

  const date = String(updates.date ?? "").trim();
  const time = String(updates.time ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Invalid date format (use YYYY-MM-DD)." };
  }
  if (!TIME_SLOT_REGEX.test(time)) {
    return { ok: false, error: "Invalid time format (e.g. 08:00, 10:00)." };
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("bookings")
      .update({
        date,
        time,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

export interface PlatformSettingsForAdmin {
  booking_notifications_enabled: boolean;
  automatic_payouts_enabled: boolean;
  peak_season_pricing_enabled: boolean;
}

const PLATFORM_SETTINGS_ROW_ID = 1;

/** Admin-only: get global platform settings (single row id=1). */
export async function getPlatformSettingsForAdmin(): Promise<PlatformSettingsForAdmin | null> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return null;
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("booking_notifications_enabled, automatic_payouts_enabled, peak_season_pricing_enabled")
      .eq("id", PLATFORM_SETTINGS_ROW_ID)
      .single();
    if (error || !data) return null;
    const row = data as {
      booking_notifications_enabled: boolean;
      automatic_payouts_enabled: boolean;
      peak_season_pricing_enabled: boolean;
    };
    return {
      booking_notifications_enabled: Boolean(row.booking_notifications_enabled),
      automatic_payouts_enabled: Boolean(row.automatic_payouts_enabled),
      peak_season_pricing_enabled: Boolean(row.peak_season_pricing_enabled),
    };
  } catch {
    return null;
  }
}

/** Admin-only: update global platform settings. */
export async function updatePlatformSettingsForAdmin(updates: {
  booking_notifications_enabled?: boolean;
  automatic_payouts_enabled?: boolean;
  peak_season_pricing_enabled?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Only admins can update platform settings." };
  }
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.booking_notifications_enabled !== undefined) {
    payload.booking_notifications_enabled = updates.booking_notifications_enabled;
  }
  if (updates.automatic_payouts_enabled !== undefined) {
    payload.automatic_payouts_enabled = updates.automatic_payouts_enabled;
  }
  if (updates.peak_season_pricing_enabled !== undefined) {
    payload.peak_season_pricing_enabled = updates.peak_season_pricing_enabled;
  }
  if (Object.keys(payload).length <= 1) {
    return { ok: false, error: "No valid updates provided." };
  }
  try {
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("platform_settings")
      .update(payload)
      .eq("id", PLATFORM_SETTINGS_ROW_ID);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

// ─── Quote requests (admin) ─────────────────────────────────────────────────

export type QuoteRequestRowForAdmin = {
  id: string;
  service: string;
  property_type: string;
  office_size: string | null;
  bedrooms: number;
  bathrooms: number;
  extra_rooms: number;
  working_area: string;
  extras: string[];
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string | null;
  message: string | null;
  status: string;
  admin_notes: string | null;
  quoted_amount: number | null;
  created_at: string;
  updated_at: string;
};

/** Admin-only: list all quote requests, newest first. */
export async function getQuoteRequestsForAdmin(): Promise<QuoteRequestRowForAdmin[]> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return [];
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as QuoteRequestRowForAdmin[];
  } catch {
    return [];
  }
}

/** Admin-only: update status, admin_notes, quoted_amount for a quote request. */
export async function updateQuoteRequestForAdmin(
  id: string,
  updates: { status?: string; admin_notes?: string; quoted_amount?: number | null }
): Promise<{ ok: boolean; error?: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Unauthorized." };
  }
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.admin_notes !== undefined) payload.admin_notes = updates.admin_notes;
  if (updates.quoted_amount !== undefined) payload.quoted_amount = updates.quoted_amount;
  if (Object.keys(payload).length <= 1) {
    return { ok: false, error: "No valid updates provided." };
  }
  try {
    const supabase = createServerSupabase();
    const { error } = await supabase.from("quote_requests").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

// Map app service slug to pricing_config service_type
const SERVICE_SLUG_TO_TYPE: Record<string, string> = {
  standard: "Standard",
  deep: "Deep",
  move: "Move In/Out",
  airbnb: "Airbnb",
  carpet: "Carpet",
};

// Map form extra id/label to pricing_config item_name (for price_type = 'extra')
const EXTRA_TO_ITEM_NAME: Record<string, string> = {
  balcony: "Balcony Cleaning",
  carpet_cleaning: "Carpet Cleaning",
  ceiling: "Ceiling Cleaning",
  couch: "Couch Cleaning",
  garage: "Garage Cleaning",
  mattress: "Mattress Cleaning",
  outside_windows: "Outside Window Cleaning",
  fridge: "Inside Fridge",
  oven: "Inside Oven",
  cabinets: "Inside Cabinets",
  windows: "Interior Windows",
  walls: "Interior Walls",
  laundry_ironing: "Laundry",
  laundry: "Laundry",
  ironing: "Ironing",
  equipment_supply: "Equipment & Supplies",
  property_to_move: "property_move",
  "balcony cleaning": "Balcony Cleaning",
  "ceiling cleaning": "Ceiling Cleaning",
  "couch cleaning": "Couch Cleaning",
  "garage cleaning": "Garage Cleaning",
  "mattress cleaning": "Mattress Cleaning",
  "outside window cleaning": "Outside Window Cleaning",
  "inside fridge": "Inside Fridge",
  "inside oven": "Inside Oven",
  "inside cabinets": "Inside Cabinets",
  "interior windows": "Interior Windows",
  "interior walls": "Interior Walls",
};

/** Admin-only: fetch active service_fee from pricing_config (single global row). Returns null if none. */
export async function getServiceFeeFromPricingConfig(): Promise<number | null> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return null;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("pricing_config")
      .select("price")
      .eq("price_type", "service_fee")
      .is("service_type", null)
      .eq("is_active", true)
      .lte("effective_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("effective_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return Number((data as { price: number }).price) || null;
  } catch {
    return null;
  }
}

export type SuggestedQuoteResult = { suggestedSubtotal: number; serviceFee: number } | { error: string };

/** Admin-only: compute suggested quote amount from pricing_config. */
export async function getSuggestedQuoteFromPricing(params: {
  service: string;
  bedrooms: number;
  bathrooms: number;
  extraRooms?: number;
  extras?: string[];
}): Promise<SuggestedQuoteResult> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") {
    return { error: "Unauthorized." };
  }
  const today = new Date().toISOString().slice(0, 10);
  try {
    const supabase = createServerSupabase();
    const { data: rows, error } = await supabase
      .from("pricing_config")
      .select("service_type, price_type, item_name, price, effective_date")
      .eq("is_active", true)
      .lte("effective_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (error) return { error: error.message };
    const config = (rows ?? []) as { service_type: string | null; price_type: string; item_name: string | null; price: number; effective_date: string }[];

    const serviceType = SERVICE_SLUG_TO_TYPE[params.service?.toLowerCase()] ?? params.service;
    const bedrooms = Math.max(0, Number(params.bedrooms) || 0);
    const bathrooms = Math.max(0, Number(params.bathrooms) || 0);
    const extraRooms = Math.max(0, Number(params.extraRooms) || 0);
    const extras = Array.isArray(params.extras) ? params.extras : [];

    const byService = (st: string | null) => config.filter((r) => (r.service_type ?? null) === (st ?? null));
    const byType = (arr: typeof config, pt: string) => arr.filter((r) => r.price_type === pt);
    const latest = (arr: typeof config) =>
      arr.length === 0 ? null : arr.sort((a, b) => (b.effective_date > a.effective_date ? 1 : -1))[0];

    const serviceRows = byService(serviceType);
    const baseRow = latest(byType(serviceRows, "base"));
    const bedroomRow = latest(byType(serviceRows, "bedroom"));
    const bathroomRow = latest(byType(serviceRows, "bathroom"));

    let subtotal = Number(baseRow?.price ?? 0);
    subtotal += Math.max(0, bedrooms - 1) * Number(bedroomRow?.price ?? 0);
    subtotal += Math.max(0, bathrooms - 1) * Number(bathroomRow?.price ?? 0);
    subtotal += extraRooms * 80;

    const extraRows = config.filter((r) => r.price_type === "extra" && (r.service_type === null || r.service_type === serviceType));
    for (const extraId of extras) {
      const key = extraId.toLowerCase().trim();
      const itemName = EXTRA_TO_ITEM_NAME[key] ?? extraId;
      const match = extraRows.find(
        (r) => r.item_name === itemName || (r.item_name && r.item_name.toLowerCase() === key)
      );
      if (match) subtotal += Number(match.price);
    }

    const serviceFeeRow = latest(config.filter((r) => r.price_type === "service_fee" && r.service_type == null));
    const serviceFee = Number(serviceFeeRow?.price ?? 0);

    return {
      suggestedSubtotal: Math.round(subtotal * 100) / 100,
      serviceFee,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

// ─── Pricing config management (admin) ────────────────────────────────────────

export type PricingConfigRowForAdmin = {
  id: string;
  service_type: string | null;
  price_type: string;
  item_name: string | null;
  price: number;
  effective_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
};

export type PricingConfigFilterForAdmin = {
  serviceType?: string | null;
  includeInactive?: boolean;
};

/** Admin-only: list pricing_config rows, optionally filtered. */
export async function getPricingConfigForAdmin(
  filters?: PricingConfigFilterForAdmin
): Promise<PricingConfigRowForAdmin[]> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") return [];

  const today = new Date().toISOString().slice(0, 10);

  try {
    const supabase = createServerSupabase();
    let query = supabase
      .from("pricing_config")
      .select(
        "id, service_type, price_type, item_name, price, effective_date, end_date, is_active, notes"
      )
      .order("service_type", { ascending: true })
      .order("price_type", { ascending: true })
      .order("item_name", { ascending: true })
      .order("effective_date", { ascending: false });

    if (filters?.serviceType !== undefined) {
      if (filters.serviceType === null) {
        query = query.is("service_type", null);
      } else {
        query = query.eq("service_type", filters.serviceType);
      }
    }

    if (!filters?.includeInactive) {
      query = query
        .eq("is_active", true)
        .lte("effective_date", today)
        .or(`end_date.is.null,end_date.gte.${today}`);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as PricingConfigRowForAdmin[];
  } catch {
    return [];
  }
}

export type UpsertPricingConfigInputForAdmin = {
  id?: string;
  service_type: string | null;
  price_type: string;
  item_name?: string | null;
  price: number;
  effective_date?: string;
  end_date?: string | null;
  is_active?: boolean;
  notes?: string | null;
};

/** Admin-only: create or update a pricing_config row. */
export async function upsertPricingConfigForAdmin(
  input: UpsertPricingConfigInputForAdmin
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Only admins can manage pricing." };
  }

  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Invalid price." };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const today = new Date().toISOString().slice(0, 10);
  const effectiveDate = input.effective_date ?? today;
  if (!dateRegex.test(effectiveDate)) {
    return { ok: false, error: "Invalid effective date (use YYYY-MM-DD)." };
  }
  let endDate: string | null = null;
  if (input.end_date) {
    if (!dateRegex.test(input.end_date)) {
      return { ok: false, error: "Invalid end date (use YYYY-MM-DD)." };
    }
    endDate = input.end_date;
  }

  const nowIso = new Date().toISOString();
  const payload: Record<string, unknown> = {
    service_type: input.service_type ?? null,
    price_type: input.price_type,
    item_name: input.item_name?.trim() || null,
    price,
    effective_date: effectiveDate,
    end_date: endDate,
    is_active: input.is_active ?? true,
    notes: input.notes?.trim() || null,
    updated_at: nowIso,
  };

  try {
    const supabase = createServerSupabase();
    if (input.id) {
      const { error } = await supabase
        .from("pricing_config")
        .update(payload)
        .eq("id", input.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("pricing_config").insert(payload);
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

/** Admin-only: deactivate a pricing_config row (set inactive and end_date). */
export async function deactivatePricingConfigForAdmin(
  id: string,
  endDate?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Only admins can manage pricing." };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  let endDateStr = endDate ?? new Date().toISOString().slice(0, 10);
  if (!dateRegex.test(endDateStr)) {
    return { ok: false, error: "Invalid end date (use YYYY-MM-DD)." };
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("pricing_config")
      .update({
        is_active: false,
        end_date: endDateStr,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}
