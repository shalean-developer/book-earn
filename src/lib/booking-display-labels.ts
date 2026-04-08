/**
 * Human-readable labels for booking fields stored as ids in the database.
 * Kept in sync with BookingSystem.tsx option labels.
 */

export const SERVICE_LABELS: Record<string, string> = {
  standard: "Standard cleaning",
  deep: "Deep cleaning",
  move: "Move-in / move-out cleaning",
  airbnb: "Airbnb cleaning",
  laundry: "Laundry & ironing",
  carpet: "Carpet cleaning",
};

export const FREQUENCY_LABELS: Record<string, string> = {
  once: "One-time",
  weekly: "Weekly",
  bi_weekly: "Bi-weekly",
  monthly: "Monthly",
  multi_week: "Custom days (multiple visits per week)",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  office: "Office",
};

export const OFFICE_SIZE_LABELS: Record<string, string> = {
  small: "Small (0–100m²)",
  medium: "Medium (100–250m²)",
  large: "Large (250m²+)",
  xlarge: "XL (500m²+)",
};

/** Extra id → display label (all services). */
export const EXTRA_LABELS: Record<string, string> = {
  fridge: "Inside fridge",
  oven: "Inside oven",
  windows: "Interior windows",
  cabinets: "Inside cabinets",
  walls: "Interior walls",
  laundry_load: "Laundry (per load)",
  ironing: "Ironing (per item)",
  extra_cleaner: "Extra cleaner",
  balcony: "Balcony cleaning",
  carpet_deep: "Carpet cleaning",
  ceiling: "Ceiling cleaning",
  couch: "Couch cleaning",
  garage: "Garage cleaning",
  mattress: "Mattress cleaning",
  outside_windows: "Exterior windows",
  linen_refresh: "Full linen change",
  guest_supplies: "Guest supplies restock",
  delicates: "Delicates (per item)",
  stain_treatment: "Stain treatment",
};

export function labelService(id: string | undefined | null): string {
  if (!id) return "—";
  return SERVICE_LABELS[id] ?? id;
}

export function labelFrequency(id: string | undefined | null): string {
  if (!id) return "—";
  return FREQUENCY_LABELS[id] ?? id;
}

export function labelPropertyType(id: string | undefined | null): string {
  if (!id) return "—";
  return PROPERTY_TYPE_LABELS[id] ?? id;
}

export function labelOfficeSize(id: string | undefined | null): string {
  if (!id) return "—";
  return OFFICE_SIZE_LABELS[id] ?? id;
}

/**
 * Groups duplicate extra ids (quantity extras) and maps to labels.
 */
export function formatExtrasList(extras: string[] | null | undefined): string {
  if (!extras?.length) return "";
  const counts = new Map<string, number>();
  for (const id of extras) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const parts: string[] = [];
  for (const [id, n] of counts) {
    const label = EXTRA_LABELS[id] ?? id;
    parts.push(n > 1 ? `${label} ×${n}` : label);
  }
  return parts.join(", ");
}

export function formatCleaningDays(
  days: string[] | null | undefined
): string {
  if (!days || !Array.isArray(days) || days.length === 0) return "";
  return days.join(", ");
}
