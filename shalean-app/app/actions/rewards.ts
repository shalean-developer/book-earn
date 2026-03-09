"use server";

import { getProfileForSession } from "@/app/actions/profile";

/** Reward redemption stub. Returns error until redemption (e.g. apply discount to next booking) is implemented. */
export async function redeemReward(
  _rewardId: "r50_off" | "free_deep_clean"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "customer") {
    return { ok: false, error: "Sign in as a customer to redeem rewards." };
  }
  return { ok: false, error: "Redemption coming soon. Your points are safe." };
}
