import type { ServiceType } from "@/lib/booking-routes";
import type { DashboardBooking } from "@/app/actions/dashboard";
import type { CleanerJob } from "@/app/actions/dashboard";

export type RewardTier = "Bronze" | "Silver" | "Gold" | "Platinum";

/** Points required to reach each tier (Bronze = 0). Used for progress and "points until next tier". */
export const REWARD_TIER_POINTS: Record<RewardTier, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 1500,
  Platinum: 4000,
};

const REWARD_TIER_ORDER: RewardTier[] = ["Bronze", "Silver", "Gold", "Platinum"];

/** Next tier after the given one, or null if already Platinum. */
export function getNextTier(tier: RewardTier): RewardTier | null {
  const i = REWARD_TIER_ORDER.indexOf(tier);
  return i < 0 || i >= REWARD_TIER_ORDER.length - 1 ? null : REWARD_TIER_ORDER[i + 1];
}

/** Progress within current tier (0–1). Points and current tier. */
export function getTierProgressPercent(points: number, tier: RewardTier): number {
  const currentStart = REWARD_TIER_POINTS[tier];
  const next = getNextTier(tier);
  if (!next) return 1;
  const nextStart = REWARD_TIER_POINTS[next];
  const range = nextStart - currentStart;
  if (range <= 0) return 1;
  const progress = (points - currentStart) / range;
  return Math.min(1, Math.max(0, progress));
}

/** Points needed to reach the next tier; null if already Platinum. */
export function getPointsToNextTier(points: number, tier: RewardTier): number | null {
  const next = getNextTier(tier);
  if (!next) return null;
  return Math.max(0, REWARD_TIER_POINTS[next] - points);
}

/** Derive tier from points (Bronze 0, Silver 500, Gold 1500, Platinum 4000). */
export function getTierFromPoints(points: number): RewardTier {
  const p = Math.max(0, points);
  if (p >= REWARD_TIER_POINTS.Platinum) return "Platinum";
  if (p >= REWARD_TIER_POINTS.Gold) return "Gold";
  if (p >= REWARD_TIER_POINTS.Silver) return "Silver";
  return "Bronze";
}

export interface UserProfile {
  role: "customer" | "cleaner" | "admin";
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  bookings: DashboardBooking[];
  points: number;
  tier: RewardTier;
  /** Total cleaned hours (e.g. from completed bookings). Optional; defaults to 0 in UI. */
  totalHours?: number;
}

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface CleanerProfile extends UserProfile {
  role: "cleaner";
  id: string; // profile id or profiles.cleaner_id for API
  rating: number;
  completedJobs: number;
  totalEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  todayBookings: CleanerJob[];
  paystackRecipientCode?: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt?: string | null;
  verificationNotes?: string | null; // only for admin
}

export interface AdminProfile extends UserProfile {
  role: "admin";
  stats: {
    totalRevenue: number;
    activeCleaners: number;
    pendingBookings: number;
    customerSatisfaction: number;
  };
}

/** Dev/storybook only; real auth uses Supabase session + profiles table. */
export const MOCK_USER: UserProfile = {
  role: "customer",
  name: "Alex Johnson",
  email: "alex.j@example.com",
  phone: "+27 82 123 4567",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  bookings: [],
  points: 850,
  tier: "Silver",
};

export const MOCK_CLEANER: CleanerProfile = {
  role: "cleaner",
  id: "mock-cleaner-id",
  name: "Demo Cleaner",
  email: "demo.cleaner@example.com",
  phone: "+27 00 000 0000",
  avatar: undefined,
  bookings: [],
  points: 0,
  tier: "Bronze",
  rating: 4.9,
  completedJobs: 142,
  totalEarnings: 12450,
  pendingEarnings: 850,
  availableBalance: 2450,
  todayBookings: [],
  verificationStatus: "verified",
};

export const MOCK_ADMIN: AdminProfile = {
  role: "admin",
  name: "Sarah Admin",
  email: "admin@shalean.co.za",
  avatar:
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
  bookings: [],
  points: 0,
  tier: "Platinum",
  stats: {
    totalRevenue: 842500,
    activeCleaners: 24,
    pendingBookings: 12,
    customerSatisfaction: 4.8,
  },
};
