import type { SupabaseClient } from "@supabase/supabase-js";

const REFERRAL_BONUS_CENTS = 10000; // R100

/**
 * Decode the ref param from the referral link (same as CustomerDashboard: btoa(email)).
 * Returns the referrer's email in lowercase, or null if invalid.
 */
export function decodeRefParam(ref: string | null | undefined): string | null {
  if (!ref || typeof ref !== "string") return null;
  const trimmed = ref.trim();
  if (!trimmed) return null;
  try {
    const decoded = atob(trimmed);
    return decoded.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * When a booking is marked "completed", check if it was a referred booking and if this
 * is the referee's first completed clean. If so, grant R100 to both referrer and referee.
 */
export async function processReferralCompletion(
  supabase: SupabaseClient,
  bookingId: string
): Promise<{ granted: boolean; error?: string }> {
  const { data: booking, error: bookErr } = await supabase
    .from("bookings")
    .select("id, customer_email, referred_by_email, status")
    .eq("id", bookingId)
    .single();

  if (bookErr || !booking) {
    return { granted: false, error: "Booking not found" };
  }
  if (booking.status !== "completed") {
    return { granted: false };
  }

  const refereeEmail = (booking.customer_email || booking.email) as string | undefined;
  const referrerEmail = booking.referred_by_email as string | null | undefined;
  if (!refereeEmail || !referrerEmail) {
    return { granted: false };
  }

  const refereeEmailNorm = refereeEmail.trim().toLowerCase();
  const referrerEmailNorm = referrerEmail.trim().toLowerCase();
  if (refereeEmailNorm === referrerEmailNorm) {
    return { granted: false }; // no self-referral
  }

  // Find referrer profile
  const { data: referrerProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", referrerEmailNorm)
    .eq("role", "customer")
    .maybeSingle();
  if (!referrerProfile?.id) {
    return { granted: false };
  }

  // Check if we already granted for this referee (any completed referral with this referee_email)
  const { data: existing } = await supabase
    .from("referrals")
    .select("id")
    .eq("referee_email", refereeEmailNorm)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { granted: false };
  }

  // Find or create referral row (pending) so we can mark it completed and attach first_booking_id
  let referralId: string;
  const { data: pendingReferral } = await supabase
    .from("referrals")
    .select("id")
    .eq("referrer_id", referrerProfile.id)
    .eq("referee_email", refereeEmailNorm)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (pendingReferral?.id) {
    referralId = pendingReferral.id;
    await supabase
      .from("referrals")
      .update({
        status: "completed",
        first_booking_id: bookingId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", referralId);
  } else {
    const { data: newReferral, error: insertRefErr } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrerProfile.id,
        referee_email: refereeEmailNorm,
        first_booking_id: bookingId,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (insertRefErr || !newReferral?.id) {
      return { granted: false, error: "Failed to create referral record" };
    }
    referralId = newReferral.id;
  }

  // Referee profile (may not exist if they only booked as guest)
  const { data: refereeProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", refereeEmailNorm)
    .eq("role", "customer")
    .maybeSingle();

  // Grant R100 to referrer
  const { error: referrerCreditErr } = await supabase
    .from("customer_wallet_credits")
    .insert({
      profile_id: referrerProfile.id,
      amount_cents: REFERRAL_BONUS_CENTS,
      reason: "referral_bonus",
      reference_type: "referral",
      reference_id: referralId,
    });
  if (referrerCreditErr) {
    console.error("Referral: failed to add referrer credit", referrerCreditErr);
    return { granted: false, error: "Failed to grant referrer credit" };
  }

  // Grant R100 to referee if they have a profile
  if (refereeProfile?.id) {
    const { error: refereeCreditErr } = await supabase
      .from("customer_wallet_credits")
      .insert({
        profile_id: refereeProfile.id,
        amount_cents: REFERRAL_BONUS_CENTS,
        reason: "referral_bonus",
        reference_type: "referral",
        reference_id: referralId,
      });
    if (refereeCreditErr) {
      console.error("Referral: failed to add referee credit", refereeCreditErr);
    }
  }

  return { granted: true };
}
