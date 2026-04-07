/**
 * Shalean dynamic pricing engine.
 *
 * Final ≈ (lineSubtotal + peakCharge + weekendCharge) × areaMultiplier
 *         − frequencyDiscount − promoDiscount + tip
 *
 * Peak / weekend charges apply to the pre-multiplier line subtotal (excluding tip).
 */

export const PEAK_SURCHARGE_RATE = 0.15;
export const WEEKEND_SURCHARGE_RATE = 0.1;

/** Default frequency discounts when not overridden by pricing_config */
export const DEFAULT_FREQUENCY_RATES: Record<string, number> = {
  weekly: 0.2,
  bi_weekly: 0.15,
  monthly: 0.1,
  multi_week: 0.15,
  once: 0,
};

/** Peak: 07:00–10:00 and 15:00–18:00 (slot start time, HH:mm 24h) */
export function isPeakHour(timeStr: string | undefined): boolean {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(h)) return false;
  const minutes = h * 60 + (Number.isFinite(m) ? m : 0);
  const inMorning = minutes >= 7 * 60 && minutes < 10 * 60;
  const inAfternoon = minutes >= 15 * 60 && minutes <= 18 * 60;
  return inMorning || inAfternoon;
}

export function isWeekendDate(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Optional regional multiplier (1.0 = baseline). Premium suburbs can be > 1.
 */
export function getAreaMultiplier(workingArea: string | undefined): number {
  if (!workingArea) return 1;
  const premium = new Set([
    "Camps Bay",
    "Constantia",
    "Sea Point",
    "Green Point",
  ]);
  return premium.has(workingArea) ? 1.05 : 1;
}

export interface PricingEngineInput {
  /** Sum of base + room/add-on line items + extras + service fee + equipment, before surcharges */
  lineSubtotal: number;
  cleaningFrequency: string;
  /** Optional override rates from pricing_config (fractions, e.g. 0.2) */
  weeklyDiscount?: number | null;
  multiWeekDiscount?: number | null;
  biWeeklyDiscount?: number | null;
  monthlyDiscount?: number | null;
  date?: string;
  time?: string;
  workingArea?: string;
  promoDiscountAmount?: number;
  tipAmount?: number;
}

export interface PricingEngineResult {
  lineSubtotal: number;
  peakCharge: number;
  weekendCharge: number;
  preMultiplierSubtotal: number;
  areaMultiplier: number;
  afterAreaSubtotal: number;
  frequencyDiscountAmount: number;
  promoDiscountAmount: number;
  discountAmount: number;
  tipAmount: number;
  total: number;
}

export function computeDynamicPricing(input: PricingEngineInput): PricingEngineResult {
  const lineSubtotal = Math.max(0, input.lineSubtotal);
  const tipAmount = Math.max(0, input.tipAmount ?? 0);
  const promoDiscountAmount = Math.max(0, input.promoDiscountAmount ?? 0);

  const peak = isPeakHour(input.time) ? Math.round(lineSubtotal * PEAK_SURCHARGE_RATE) : 0;
  const weekend = isWeekendDate(input.date)
    ? Math.round(lineSubtotal * WEEKEND_SURCHARGE_RATE)
    : 0;

  const preMultiplierSubtotal = lineSubtotal + peak + weekend;
  const areaMultiplier = getAreaMultiplier(input.workingArea);
  const afterAreaSubtotal = Math.round(preMultiplierSubtotal * areaMultiplier);

  const f = (input.cleaningFrequency ?? "once").toLowerCase();

  const freqRate =
    f === "weekly"
      ? input.weeklyDiscount ?? DEFAULT_FREQUENCY_RATES.weekly
      : f === "bi_weekly"
        ? input.biWeeklyDiscount ?? DEFAULT_FREQUENCY_RATES.bi_weekly
        : f === "monthly"
          ? input.monthlyDiscount ?? DEFAULT_FREQUENCY_RATES.monthly
          : f === "multi_week"
            ? input.multiWeekDiscount ?? DEFAULT_FREQUENCY_RATES.multi_week
            : 0;

  const frequencyDiscountAmount =
    freqRate > 0 ? Math.round(afterAreaSubtotal * freqRate) : 0;

  const discountAmount = Math.min(
    afterAreaSubtotal,
    frequencyDiscountAmount + promoDiscountAmount
  );

  const total = Math.max(0, afterAreaSubtotal - discountAmount) + tipAmount;

  return {
    lineSubtotal,
    peakCharge: peak,
    weekendCharge: weekend,
    preMultiplierSubtotal,
    areaMultiplier,
    afterAreaSubtotal,
    frequencyDiscountAmount,
    promoDiscountAmount,
    discountAmount,
    tipAmount,
    total,
  };
}
