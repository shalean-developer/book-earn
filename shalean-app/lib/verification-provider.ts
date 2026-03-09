/**
 * Adapter for third-party identity/background verification (e.g. Yoti, LexisNexis).
 * Implement startVerification and handleCallback when a provider is chosen.
 * DB columns: verification_provider, verification_external_id, verification_result, verification_requested_at.
 */

export type StartVerificationResult =
  | { ok: true; redirectUrl?: string; externalId?: string }
  | { ok: false; error: string };

/**
 * Start a verification flow for a cleaner. When a provider is integrated:
 * - Create verification request with provider API
 * - Store verification_provider, verification_external_id on profile; set verification_requested_at
 * - Return redirectUrl for the cleaner to complete the flow
 */
export async function startVerification(_profileId: string): Promise<StartVerificationResult> {
  // Stub: no provider configured. When integrating, call provider API and return redirect URL.
  return { ok: false, error: "Verification provider not configured. Admin can verify you manually." };
}

export type CallbackPayload = Record<string, unknown>;

export type HandleCallbackResult =
  | { ok: true; profileId: string }
  | { ok: false; error: string };

/**
 * Handle webhook/callback from provider when verification completes.
 * Look up profile by verification_external_id, parse result, update verification_status and verification_result.
 */
export async function handleCallback(
  _provider: string,
  _payload: CallbackPayload
): Promise<HandleCallbackResult> {
  // Stub: no provider configured.
  return { ok: false, error: "Verification callback not configured." };
}
