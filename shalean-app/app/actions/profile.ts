"use server";

import { createClient } from "@supabase/supabase-js";
import { createServerClient, createServerSupabase } from "@/lib/supabase/server";
import { getCleanerEarningsAndBalance } from "@/app/actions/dashboard";
import { getCleanerAverageRating } from "@/app/actions/ratings";
import type { UserProfile, CleanerProfile, AdminProfile } from "@/lib/dashboard-types";
import { getTierFromPoints } from "@/lib/dashboard-types";

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

function mapProfileRowToUI(
  row: ProfileRow
): UserProfile | CleanerProfile | AdminProfile {
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

const VALID_ROLES = ["customer", "cleaner", "admin"] as const;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const PROFILE_COLS =
  "id, role, name, email, phone, avatar, cleaner_id, paystack_recipient_code, verification_status, verification_notes, verified_at, points";

/**
 * Returns the current user's profile from the session cookie (or from the given JWT), or null if not signed in.
 * If the user exists in auth but no profile row exists (e.g. trigger not run or timing),
 * creates the profile from auth user metadata and returns it.
 * When accessToken is passed (e.g. right after sign-in/sign-up), validates JWT then uses service role for profile so RLS cannot block.
 */
export async function getProfileForSession(accessToken?: string): Promise<
  UserProfile | CleanerProfile | AdminProfile | null
> {
  try {
    if (accessToken && supabaseUrl && supabaseAnonKey) {
      const anonSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false },
      });
      const {
        data: { user },
        error: userError,
      } = await anonSupabase.auth.getUser(accessToken);
      if (userError || !user) return null;

      const supabaseAdmin = createServerSupabase();
      let { data: row, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_COLS)
        .eq("id", user.id)
        .single();

      if (profileError || !row) {
        const meta = user.user_metadata ?? {};
        const role = VALID_ROLES.includes(meta.role as (typeof VALID_ROLES)[number])
          ? meta.role
          : "customer";
        const name = meta.name ?? meta.full_name ?? "";
        await supabaseAdmin.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? "",
            name: name || null,
            role,
          },
          { onConflict: "id" }
        );
        const ret = await supabaseAdmin
          .from("profiles")
          .select(PROFILE_COLS)
          .eq("id", user.id)
          .single();
        row = ret.data as ProfileRow | null;
      }

      if (!row) return null;

      const mapped = mapProfileRowToUI(row as ProfileRow);
      if (mapped.role === "cleaner") {
        const cleanerId = (row as ProfileRow).cleaner_id ?? row.id;
        const [earnings, rating] = await Promise.all([
          getCleanerEarningsAndBalance(row.id, cleanerId),
          getCleanerAverageRating(cleanerId),
        ]);
        return {
          ...mapped,
          totalEarnings: earnings.totalEarnings,
          pendingEarnings: earnings.pendingEarnings,
          availableBalance: earnings.availableBalance,
          completedJobs: earnings.completedJobs,
          rating,
        } as CleanerProfile;
      }
      return mapped;
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return null;

    let { data: row, error: profileError } = await supabase
      .from("profiles")
      .select(PROFILE_COLS)
      .eq("id", user.id)
      .single();

    if (profileError || !row) {
      const meta = user.user_metadata ?? {};
      const role = VALID_ROLES.includes(meta.role as (typeof VALID_ROLES)[number])
        ? meta.role
        : "customer";
      const name = meta.name ?? meta.full_name ?? "";
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? "",
          name: name || null,
          role,
        },
        { onConflict: "id" }
      );
      const ret = await supabase
        .from("profiles")
        .select(PROFILE_COLS)
        .eq("id", user.id)
        .single();
      row = ret.data as ProfileRow | null;
    }

    if (!row) return null;

    const mapped = mapProfileRowToUI(row as ProfileRow);
    if (mapped.role === "cleaner") {
      const cleanerId = (row as ProfileRow).cleaner_id ?? row.id;
      const [earnings, rating] = await Promise.all([
        getCleanerEarningsAndBalance(row.id, cleanerId),
        getCleanerAverageRating(cleanerId),
      ]);
      return {
        ...mapped,
        totalEarnings: earnings.totalEarnings,
        pendingEarnings: earnings.pendingEarnings,
        availableBalance: earnings.availableBalance,
        completedJobs: earnings.completedJobs,
        rating,
      } as CleanerProfile;
    }
    return mapped;
  } catch {
    return null;
  }
}

export type UpdateProfileInput = {
  name?: string;
  phone?: string;
  address?: string;
  avatar?: string;
};

/**
 * Updates the current user's profile (name, phone, address, avatar). Email is read-only from auth.
 */
export async function updateProfileForSession(
  input: UpdateProfileInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return { ok: false, error: "Not signed in." };

    const updates: { name?: string | null; phone?: string | null; address?: string | null; avatar?: string | null } = {};
    if (input.name !== undefined) updates.name = input.name.trim() || null;
    if (input.phone !== undefined) updates.phone = input.phone.trim() || null;
    if (input.address !== undefined) updates.address = input.address.trim() || null;
    if (input.avatar !== undefined) updates.avatar = input.avatar.trim() || null;

    if (Object.keys(updates).length === 0) return { ok: true };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2MB
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * Uploads a profile photo to the avatars bucket and returns the public URL.
 * Call with FormData containing an "avatar" file (image only, max 2MB).
 */
export async function uploadProfilePhoto(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return { ok: false, error: "Not signed in." };

    const file = formData.get("avatar");
    if (!file || !(file instanceof File)) return { ok: false, error: "No photo selected." };
    if (file.size > AVATAR_MAX_BYTES) return { ok: false, error: "Photo must be 2MB or smaller." };
    if (!AVATAR_ALLOWED_TYPES.includes(file.type))
      return { ok: false, error: "Use a JPEG, PNG, GIF, or WebP image." };

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpeg", "jpg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
    const path = `${user.id}/${Date.now()}-avatar.${safeExt}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) return { ok: false, error: error.message };

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    return { ok: true, url: urlData.publicUrl };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}
