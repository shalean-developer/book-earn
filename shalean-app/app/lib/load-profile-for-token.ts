/**
 * Load profile by access token only. Used by the API route so we don't rely on
 * server action context or cookies. No "use server" - plain server-side module.
 * Validates the JWT with the anon client, then uses the service role for profile
 * read/upsert so RLS cannot block (e.g. when PostgREST doesn't receive the token).
 */
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCleanerEarningsAndBalance } from "@/app/actions/dashboard";
import { getCleanerAverageRating } from "@/app/actions/ratings";
import type { UserProfile, CleanerProfile, AdminProfile } from "@/lib/dashboard-types";
import { getTierFromPoints } from "@/lib/dashboard-types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type ProfileRow = {
  id: string;
  role: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  cleaner_id: string | null;
  paystack_recipient_code: string | null;
  verification_status: string | null;
  verification_notes: string | null;
  verified_at: string | null;
  points: number | null;
};

const VALID_ROLES = ["customer", "cleaner", "admin"] as const;
const PROFILE_COLS =
  "id, role, name, email, phone, address, avatar, cleaner_id, paystack_recipient_code, verification_status, verification_notes, verified_at, points";

function mapRowToProfile(row: ProfileRow): UserProfile | CleanerProfile | AdminProfile {
  const points = Math.max(0, Number(row.points ?? 0));
  const tier = getTierFromPoints(row.role === "customer" ? points : 0);
  const base = {
    role: row.role as "customer" | "cleaner" | "admin",
    name: row.name ?? "",
    email: row.email,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    avatar: row.avatar ?? undefined,
    bookings: [],
    points: row.role === "customer" ? points : 0,
    tier,
  };

  if (row.role === "cleaner") {
    const status = (row.verification_status === "verified" || row.verification_status === "rejected"
      ? row.verification_status
      : "pending") as "pending" | "verified" | "rejected";
    return {
      ...base,
      role: "cleaner",
      id: row.cleaner_id ?? row.id,
      rating: 0,
      completedJobs: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
      availableBalance: 0,
      paystackRecipientCode: row.paystack_recipient_code ?? undefined,
      todayBookings: [],
      verificationStatus: status,
      verifiedAt: row.verified_at ?? undefined,
      verificationNotes: row.verification_notes ?? undefined,
    } as CleanerProfile;
  }

  if (row.role === "admin") {
    return {
      ...base,
      role: "admin",
      stats: {
        totalRevenue: 0,
        activeCleaners: 0,
        pendingBookings: 0,
        customerSatisfaction: 0,
      },
    } as AdminProfile;
  }

  return { ...base, role: "customer" } as UserProfile;
}

export type LoadProfileResult =
  | { profile: UserProfile | CleanerProfile | AdminProfile; error?: undefined }
  | { profile: null; error: string };

export async function loadProfileForAccessToken(
  accessToken: string
): Promise<LoadProfileResult> {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[loadProfileForAccessToken] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
      return { profile: null, error: "Server configuration error: missing Supabase URL or anon key." };
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local for profile loading to work.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      console.error("[loadProfileForAccessToken] getUser failed:", userError?.message ?? "no user");
      return {
        profile: null,
        error: userError?.message === "JWT expired" || userError?.message?.includes("expired")
          ? "Your session expired. Please sign in again."
          : "Invalid or expired session. Please sign in again.",
      };
    }

    const supabaseAdmin = createServerSupabase();
    let { data: row, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(PROFILE_COLS)
      .eq("id", user.id)
      .single();

    if (profileError || !row) {
      console.error("[loadProfileForAccessToken] profile select failed:", profileError?.message ?? "no row");
      const meta = user.user_metadata ?? {};
      const role = VALID_ROLES.includes(meta.role as (typeof VALID_ROLES)[number])
        ? meta.role
        : "customer";
      const name = meta.name ?? meta.full_name ?? "";
      const { error: upsertError } = await supabaseAdmin.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? "",
          name: name || null,
          role,
        },
        { onConflict: "id" }
      );
      if (upsertError) {
        console.error("[loadProfileForAccessToken] profile upsert failed:", upsertError.message);
        return {
          profile: null,
          error: `Profile could not be created: ${upsertError.message}. Check that the profiles table exists and has the expected columns.`,
        };
      }
      const ret = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_COLS)
        .eq("id", user.id)
        .single();
      row = ret.data as ProfileRow | null;
      if (ret.error || !row) {
        console.error("[loadProfileForAccessToken] profile re-select after upsert failed:", ret.error?.message);
        return {
          profile: null,
          error: ret.error?.message ?? "Profile was created but could not be read. Please sign in again.",
        };
      }
    }

    const mapped = mapRowToProfile(row);
    if (mapped.role === "cleaner") {
      try {
        const cleanerId = row.cleaner_id ?? row.id;
        const [earnings, rating] = await Promise.all([
          getCleanerEarningsAndBalance(row.id, cleanerId),
          getCleanerAverageRating(cleanerId),
        ]);
        return {
          profile: {
            ...mapped,
            totalEarnings: earnings.totalEarnings,
            pendingEarnings: earnings.pendingEarnings,
            availableBalance: earnings.availableBalance,
            completedJobs: earnings.completedJobs,
            rating,
          } as CleanerProfile,
        };
      } catch (earningsErr) {
        console.error("[loadProfileForAccessToken] getCleanerEarningsAndBalance failed:", earningsErr);
        return {
          profile: null,
          error: "Profile loaded but earnings data failed. Please try again.",
        };
      }
    }
    return { profile: mapped };
  } catch (err) {
    console.error("[loadProfileForAccessToken]", err);
    return {
      profile: null,
      error: err instanceof Error ? err.message : "Something went wrong. Please try again.",
    };
  }
}
