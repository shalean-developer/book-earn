"use server";

import { getProfileForSession } from "@/app/actions/profile";
import { createServerClient } from "@/lib/supabase/server";
import { startVerification as startVerificationProvider } from "@/lib/verification-provider";

export type StartVerificationForSessionResult =
  | { ok: true; redirectUrl?: string }
  | { ok: false; error: string };

/** Start third-party verification for the current user (cleaner). Redirects to provider when configured. */
export async function startVerificationForSession(): Promise<StartVerificationForSessionResult> {
  const profile = await getProfileForSession();
  if (!profile || profile.role !== "cleaner") {
    return { ok: false, error: "Only cleaners can start verification." };
  }
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { ok: false, error: "Not signed in." };
  return startVerificationProvider(user.id);
}
