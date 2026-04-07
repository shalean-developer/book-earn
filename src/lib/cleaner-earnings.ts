/**
 * Cleaner earnings (must match sql/cleaner_earnings.sql).
 *
 * Rules:
 * - Standard & Airbnb: 70% of (total customer pays − service fee), excluding equipment.
 * - Carpets, Deep, Move in/out: R250 per cleaner per job.
 * - Equipment: never part of cleaner earnings.
 * - Discounts: total_amount is already after discount; 70% is applied to that amount (no extra handling).
 * - Tip: cleaner gets full amount; for Deep/Move/Carpet team jobs, pass teamSize > 1 to share tip.
 */

const FLAT_EARNINGS_RANDS = 250;

function isStandardOrAirbnb(service: string): boolean {
  const s = (service ?? "").toLowerCase().trim();
  return (
    s.includes("standard") ||
    s === "airbnb" ||
    s.includes("airbnb") ||
    s === "laundry" ||
    s.includes("laundry")
  );
}

function isCarpetDeepOrMove(service: string): boolean {
  const s = (service ?? "").toLowerCase().trim();
  return s.includes("carpet") || s.includes("deep") || s.includes("move");
}

export interface BookingEarningsInput {
  service?: string | null;
  total_amount?: number | null;
  tip_amount?: number | null;
  service_fee_amount?: number | null;
  equipment_charge_amount?: number | null;
}

/**
 * Compute cleaner earnings for one completed booking.
 * @param booking - Row with service, total_amount, tip_amount, service_fee_amount, equipment_charge_amount
 * @param teamSize - Number of cleaners on this job (for tip split on Deep/Move/Carpet). Default 1.
 */
export function getCleanerEarningsForBooking(
  booking: BookingEarningsInput,
  teamSize: number = 1
): number {
  const total = Number(booking.total_amount ?? 0);
  const tip = Number(booking.tip_amount ?? 0);
  const serviceFee = Number(booking.service_fee_amount ?? 0);
  const equipment = Number(booking.equipment_charge_amount ?? 0);
  const service = booking.service ?? "";

  const tipShare = teamSize > 0 ? tip / teamSize : 0;

  if (isStandardOrAirbnb(service)) {
    const baseForPercent = Math.max(0, total - equipment - serviceFee);
    return Math.round((baseForPercent * 0.7 + tipShare) * 100) / 100;
  }

  if (isCarpetDeepOrMove(service)) {
    return Math.round((FLAT_EARNINGS_RANDS + tipShare) * 100) / 100;
  }

  // Fallback: treat as Standard
  const baseForPercent = Math.max(0, total - equipment - serviceFee);
  return Math.round((baseForPercent * 0.7 + tipShare) * 100) / 100;
}
