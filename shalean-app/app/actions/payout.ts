"use server";

import { createServerClient, createServerSupabase } from "@/lib/supabase/server";
import { getProfileForSession } from "@/app/actions/profile";
import { getCleanerEarningsAndBalance } from "@/app/actions/dashboard";
import type { CleanerProfile } from "@/lib/dashboard-types";
import type { Database } from "@/lib/database.types";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";

type PayoutsInsert = Database["public"]["Tables"]["payouts"]["Insert"];

const MIN_PAYOUT_ZAR = 50;

type ListBanksResult =
  | { ok: true; banks: { code: string; name: string }[] }
  | { ok: false; error: string };
type ValidateBankResult =
  | { ok: true; verified: boolean }
  | { ok: false; error: string };
type CreateRecipientResult =
  | { ok: true; recipientCode: string }
  | { ok: false; error: string };
type RequestPayoutResult =
  | { ok: true }
  | { ok: true; needsOtp: true; transferCode: string }
  | { ok: false; error: string };
type FinalizePayoutResult = { ok: true } | { ok: false; error: string };

export interface PayoutRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paystack_reference?: string | null;
}

/** List payouts for the signed-in cleaner (for Recent Payouts in dashboard). */
export async function listPayoutsForSession(): Promise<
  { ok: true; payouts: PayoutRow[] } | { ok: false; error: string }
> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "cleaner") {
    return { ok: false, error: "Only cleaners can list payouts." };
  }
  try {
    const authClient = await createServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in." };
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("payouts")
      .select("id, amount, currency, status, created_at, paystack_reference")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { ok: false, error: error.message };
    const payouts: PayoutRow[] = (data ?? []).map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      currency: String(row.currency ?? "ZAR"),
      status: String(row.status),
      created_at: String(row.created_at),
      paystack_reference: row.paystack_reference ?? undefined,
    }));
    return { ok: true, payouts };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** List banks for a currency (e.g. ZAR for South Africa). */
export async function listBanks(currency: string): Promise<ListBanksResult> {
  if (!PAYSTACK_SECRET) {
    return { ok: false, error: "Paystack is not configured." };
  }
  try {
    const res = await fetch(`${PAYSTACK_BASE}/bank?currency=${encodeURIComponent(currency)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await res.json();
    if (!data.status || !Array.isArray(data.data)) {
      return { ok: false, error: data.message || "Failed to fetch banks." };
    }
    const banks = (data.data as { code: string; name: string }[]).map((b) => ({
      code: b.code,
      name: b.name,
    }));
    return { ok: true, banks };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Validate South Africa bank account (ZAR). Costs ZAR 3 per successful request. */
export async function validateBankAccount(params: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  accountType: "personal" | "business";
  documentType: "identityNumber" | "passportNumber" | "businessRegistrationNumber";
  documentNumber: string;
}): Promise<ValidateBankResult> {
  if (!PAYSTACK_SECRET) {
    return { ok: false, error: "Paystack is not configured." };
  }
  try {
    const res = await fetch(`${PAYSTACK_BASE}/bank/validate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bank_code: params.bankCode,
        country_code: "ZA",
        account_number: params.accountNumber,
        account_name: params.accountName,
        account_type: params.accountType,
        document_type: params.documentType,
        document_number: params.documentNumber,
      }),
    });
    const data = await res.json();
    if (!data.status) {
      return { ok: false, error: data.message || "Validation failed." };
    }
    const verified = data.data?.verified === true;
    return { ok: true, verified };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Create or update Paystack transfer recipient for current cleaner; saves recipient_code to profile. */
export async function createOrUpdateCleanerRecipient(params: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}): Promise<CreateRecipientResult> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "cleaner") {
    return { ok: false, error: "Only cleaners can add bank details." };
  }
  if ((profile as CleanerProfile).verificationStatus !== "verified") {
    return { ok: false, error: "Account must be verified to add bank details and receive payouts." };
  }
  if (!PAYSTACK_SECRET) {
    return { ok: false, error: "Paystack is not configured." };
  }
  const { bankCode, accountNumber, accountName } = params;
  if (!bankCode?.trim() || !accountNumber?.trim() || !accountName?.trim()) {
    return { ok: false, error: "Bank code, account number, and account name are required." };
  }
  try {
    const res = await fetch(`${PAYSTACK_BASE}/transferrecipient`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "basa",
        name: accountName.trim(),
        account_number: accountNumber.trim(),
        bank_code: bankCode.trim(),
        currency: "ZAR",
      }),
    });
    const data = await res.json();
    if (!data.status || !data.data?.recipient_code) {
      return { ok: false, error: data.message || "Failed to create recipient." };
    }
    const recipientCode = data.data.recipient_code as string;
    const authClient = await createServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in." };
    const supabase = createServerSupabase();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        bank_code: bankCode.trim(),
        bank_account_number: accountNumber.trim(),
        bank_account_name: accountName.trim(),
        paystack_recipient_code: recipientCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateError) {
      return { ok: false, error: "Saved recipient but failed to update profile." };
    }
    return { ok: true, recipientCode };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Request a payout to the cleaner's bank. Returns needsOtp + transferCode if OTP required. */
export async function requestPayout(amount: number): Promise<RequestPayoutResult> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "cleaner") {
    return { ok: false, error: "Only cleaners can request payouts." };
  }
  const cleaner = profile as CleanerProfile;
  if (cleaner.verificationStatus !== "verified") {
    return { ok: false, error: "Account must be verified to receive payouts." };
  }
  const profileId = (await getProfileIdForSession()) ?? "";
  if (!profileId) return { ok: false, error: "Not signed in." };
  if (!PAYSTACK_SECRET) {
    return { ok: false, error: "Paystack is not configured." };
  }
  const amountNum = Number(amount);
  if (amountNum < MIN_PAYOUT_ZAR) {
    return { ok: false, error: `Minimum payout is R${MIN_PAYOUT_ZAR}.` };
  }
  const { availableBalance } = await getCleanerEarningsAndBalance(
    profileId,
    cleaner.id
  );
  if (amountNum > availableBalance) {
    return { ok: false, error: "Insufficient balance. Available: R" + availableBalance.toFixed(2) + "." };
  }
  const supabase = createServerSupabase();
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("paystack_recipient_code")
    .eq("id", profileId)
    .single();
  if (profileError || !profileRow?.paystack_recipient_code) {
    return { ok: false, error: "Add your bank details in Account → Banking Information first." };
  }
  const recipientCode = profileRow.paystack_recipient_code as string;
  const amountCents = Math.round(amountNum * 100);
  const reference = `payout-${profileId.slice(0, 8)}-${Date.now()}`;
  try {
    const res = await fetch(`${PAYSTACK_BASE}/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amountCents,
        recipient: recipientCode,
        reason: "Cleaner payout",
        currency: "ZAR",
        reference,
      }),
    });
    const data = await res.json();
    if (!data.status) {
      return { ok: false, error: data.message || "Transfer failed." };
    }
    const status = data.data?.status;
    const transferCode = data.data?.transfer_code;
    if (status === "otp" && transferCode) {
      return { ok: true, needsOtp: true, transferCode: String(transferCode) };
    }
    if (status === "pending" || status === "success") {
      const row: PayoutsInsert = {
        profile_id: profileId,
        amount: amountNum,
        currency: "ZAR",
        paystack_transfer_code: transferCode ?? null,
        paystack_reference: reference,
        status: status === "success" ? "success" : "pending",
      };
      await supabase.from("payouts").insert(row);
      return { ok: true };
    }
    return { ok: false, error: data.message || "Transfer could not be completed." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

async function getProfileIdForSession(): Promise<string | null> {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  return user?.id ?? null;
}

/** Finalize a transfer that required OTP. */
export async function finalizePayout(
  transferCode: string,
  otp: string
): Promise<FinalizePayoutResult> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "cleaner") {
    return { ok: false, error: "Only cleaners can finalize payouts." };
  }
  if ((profile as CleanerProfile).verificationStatus !== "verified") {
    return { ok: false, error: "Account must be verified to receive payouts." };
  }
  if (!PAYSTACK_SECRET) {
    return { ok: false, error: "Paystack is not configured." };
  }
  const profileId = await getProfileIdForSession();
  if (!profileId) return { ok: false, error: "Not signed in." };
  try {
    const res = await fetch(`${PAYSTACK_BASE}/transfer/finalize_transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transfer_code: transferCode.trim(),
        otp: String(otp).trim(),
      }),
    });
    const data = await res.json();
    if (!data.status) {
      return { ok: false, error: data.message || "Finalize failed." };
    }
    const status = data.data?.status;
    const amount = data.data?.amount;
    const reference = data.data?.reference;
    const code = data.data?.transfer_code;
    const amountZar = typeof amount === "number" ? amount / 100 : 0;
    const row: PayoutsInsert = {
      profile_id: profileId,
      amount: amountZar,
      currency: "ZAR",
      paystack_transfer_code: code ?? transferCode,
      paystack_reference: reference ?? null,
      status: status === "success" ? "success" : "pending",
    };
    const supabase = createServerSupabase();
    await supabase.from("payouts").insert(row);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
