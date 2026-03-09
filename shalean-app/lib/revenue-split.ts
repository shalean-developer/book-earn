/**
 * Income sharing: cleaner vs company. Single source of truth for revenue split.
 * Cleaner gets 70% of total customer pay minus a deduction; tips 100% to cleaner.
 * - Standard/Airbnb: (total × 70%) − R50.
 * - Deep/Move in-out/Carpet: (total × 70%) − R250.
 *
 * Note: pricing_config has service_fee (e.g. R40) and can be used to drive
 * serviceFeeAmount via getServiceFeeFromPricingConfig(); this module keeps
 * R50/R250 as defaults for backward compatibility and migration backfill.
 */

export const CLEANER_PERCENT = 0.7;
/** Deduction from cleaner share: R50 for standard/airbnb. */
export const DEDUCTION_STANDARD_AIRBNB = 50;
/** Deduction from cleaner share: R250 for deep, move in/out, carpet. */
export const DEDUCTION_DEEP_MOVE_CARPET = 250;

export const STANDARD_AIRBNB_SERVICES = ["standard", "airbnb"] as const;
export const DEDUCTION_SERVICES = ["deep", "move", "carpet"] as const;

/**
 * Compute service fee (R50 for standard/airbnb only, for reporting) and cleaner earnings.
 * Formula: 70% of total minus R50 (standard/airbnb) or R250 (deep/move/carpet), plus tips.
 * Used when creating a booking and must stay in sync with migration backfill logic.
 */
export function computeCleanerEarnings(
  service: string,
  total: number,
  tipAmount: number
): { serviceFeeAmount: number; cleanerEarnings: number } {
  const totalNum = Number(total) || 0;
  const tipNum = Number(tipAmount) || 0;
  const svc = String(service).toLowerCase();

  const serviceFeeAmount =
    STANDARD_AIRBNB_SERVICES.includes(svc as (typeof STANDARD_AIRBNB_SERVICES)[number])
      ? DEDUCTION_STANDARD_AIRBNB
      : 0;

  let deduction: number;
  if (STANDARD_AIRBNB_SERVICES.includes(svc as (typeof STANDARD_AIRBNB_SERVICES)[number])) {
    deduction = DEDUCTION_STANDARD_AIRBNB;
  } else if (DEDUCTION_SERVICES.includes(svc as (typeof DEDUCTION_SERVICES)[number])) {
    deduction = DEDUCTION_DEEP_MOVE_CARPET;
  } else {
    deduction = 0;
  }

  const cleanerShare = Math.max(0, totalNum * CLEANER_PERCENT - deduction);
  const cleanerEarnings = Math.round((cleanerShare + tipNum) * 100) / 100;

  return {
    serviceFeeAmount,
    cleanerEarnings,
  };
}
