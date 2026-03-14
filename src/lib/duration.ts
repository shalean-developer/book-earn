/**
 * Estimated cleaning duration: minimum 3.5 hours, with added time for
 * each item the customer selects (bedrooms, bathrooms, extras, etc.).
 * Used in Order Summary, dashboards, and confirmation emails.
 */

const MIN_DURATION_MINUTES = 3.5 * 60; // 210 minutes

/** Minutes to add per extra (per occurrence for quantity extras). */
const EXTRA_DURATION_MINUTES: Record<string, number> = {
  fridge: 20,
  oven: 20,
  windows: 25,
  cabinets: 25,
  walls: 20,
  extra_cleaner: 60,
  equipment: 15,
  balcony: 45,
  carpet_deep: 40,
  ceiling: 45,
  couch: 30,
  garage: 45,
  mattress: 35,
  outside_windows: 50,
};

export interface BookingDurationInput {
  service: string;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  propertyType: string;
  officeSize: string;
  privateOffices: number;
  meetingRooms: number;
  carpetedRooms: number;
  looseRugs: number;
  carpetExtraCleaners: number;
  extras: string[];
}

/**
 * Compute estimated duration in minutes for a booking.
 * Minimum is 3.5 hours; every selected item adds time.
 */
export function computeEstimatedDurationMinutes(
  input: BookingDurationInput
): number {
  let total = MIN_DURATION_MINUTES;

  const service = (input.service ?? "").toLowerCase();
  const propType = (input.propertyType ?? "").toLowerCase();

  if (service === "carpet") {
    total += (input.carpetedRooms ?? 0) * 25;
    total += (input.looseRugs ?? 0) * 15;
    total += (input.carpetExtraCleaners ?? 0) * 60;
  } else if (propType === "office") {
    const size = (input.officeSize ?? "").toLowerCase();
    if (size === "small") total += 30;
    else if (size === "medium") total += 60;
    else if (size === "large") total += 90;
    else if (size === "xlarge") total += 120;
    total += (input.privateOffices ?? 0) * 20;
    total += (input.meetingRooms ?? 0) * 25;
  } else {
    total += Math.max(0, (input.bedrooms ?? 1) - 1) * 20;
    total += Math.max(0, (input.bathrooms ?? 1) - 1) * 15;
    total += Math.max(0, input.extraRooms ?? 0) * 25;
  }

  const extras = input.extras ?? [];
  for (const id of extras) {
    const mins = EXTRA_DURATION_MINUTES[id] ?? 15;
    total += mins;
  }

  return Math.max(MIN_DURATION_MINUTES, Math.round(total));
}

/**
 * Format duration for display (e.g. "3h 30min", "4 hours").
 */
export function formatEstimatedDuration(minutes: number): string {
  if (minutes <= 0) return "3h 30min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) {
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  if (h === 0) return `${m} min`;
  return `${h}h ${m}min`;
}
