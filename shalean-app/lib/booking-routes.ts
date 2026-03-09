/**
 * SEO-friendly booking URL helpers and slug mapping.
 * Base path: /booking
 * Steps: :serviceSlug | schedule | cleaner | details | payment | confirmation/:ref
 */

export type ServiceType =
  | "standard"
  | "deep"
  | "move"
  | "airbnb"
  | "carpet";

export const SERVICE_SLUGS: Record<ServiceType, string> = {
  standard: "standard-cleaning",
  deep: "deep-cleaning",
  move: "move-in-out-cleaning",
  airbnb: "airbnb-cleaning",
  carpet: "carpet-cleaning",
};

const SLUG_TO_SERVICE_ENTRIES = Object.entries(
  SERVICE_SLUGS
) as [ServiceType, string][];
export const SLUG_TO_SERVICE: Record<string, ServiceType> = Object.fromEntries(
  SLUG_TO_SERVICE_ENTRIES.map(([id, slug]) => [slug, id])
);

export const DEFAULT_SERVICE: ServiceType = "standard";
export const BOOKING_BASE = "/booking";

/** Step index 1–5 for main flow; 6 = confirmation (handled separately) */
export const STEP_SEGMENTS = [
  "", // step 1: no extra segment (just serviceSlug)
  "schedule",
  "cleaner",
  "details",
  "payment",
] as const;

export type StepIndex = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Build path for a given service and step (1–5). Step 6 (confirmation) uses getConfirmationPath.
 */
export function getBookingPath(
  service: ServiceType,
  step: StepIndex,
  _options?: { areaSlug?: string }
): string {
  if (step === 6) {
    return `${BOOKING_BASE}/confirmation/PLACEHOLDER`; // use getConfirmationPath(ref) for step 6
  }
  const slug = SERVICE_SLUGS[service];
  if (step === 1) return `${BOOKING_BASE}/${slug}`;
  const path = [BOOKING_BASE, slug, "schedule"];
  if (step >= 3) path.push("cleaner");
  if (step >= 4) path.push("details");
  if (step >= 5) path.push("payment");
  return path.join("/");
}

/**
 * Path for confirmation page (step 6).
 */
export function getConfirmationPath(ref: string): string {
  return `${BOOKING_BASE}/confirmation/${encodeURIComponent(ref)}`;
}

export interface ParsedBookingPath {
  kind: "confirmation";
  ref: string;
}

export interface ParsedBookingFlow {
  kind: "flow";
  service: ServiceType;
  step: StepIndex;
}

export type ParsedPath = ParsedBookingPath | ParsedBookingFlow;

/**
 * Parse pathname (e.g. /booking/deep-cleaning/schedule/cleaner) into service and step.
 * Handles /booking, /booking/confirmation/:ref, and /booking/:serviceSlug/...
 */
export function parseBookingPath(pathname: string): ParsedPath | null {
  const base = BOOKING_BASE;
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length).replace(/^\//, "") || "";
  const segments = rest ? rest.split("/").filter(Boolean) : [];

  if (segments[0] === "confirmation") {
    const raw = segments[1];
    const ref = raw ? decodeURIComponent(raw) : undefined;
    if (ref) return { kind: "confirmation", ref };
    return null;
  }

  const serviceSlug = segments[0];
  if (!serviceSlug) return null;
  const service = SLUG_TO_SERVICE[serviceSlug];
  if (!service) return null;

  const hasSchedule = segments.includes("schedule");
  const hasCleaner = segments.includes("cleaner");
  const hasDetails = segments.includes("details");
  const hasPayment = segments.includes("payment");

  let step: StepIndex = 1;
  if (hasPayment) step = 5;
  else if (hasDetails) step = 4;
  else if (hasCleaner) step = 3;
  else if (hasSchedule) step = 2;

  return { kind: "flow", service, step };
}

/**
 * Validate service slug; return default if invalid.
 */
export function serviceFromSlug(slug: string | undefined): ServiceType {
  if (!slug) return DEFAULT_SERVICE;
  return SLUG_TO_SERVICE[slug] ?? DEFAULT_SERVICE;
}

/** Human-readable service title from URL slug (e.g. "deep-cleaning" -> "Deep Cleaning") */
export function serviceTitleFromSlug(slug: string): string {
  const service = SLUG_TO_SERVICE[slug];
  if (!service) return "Cleaning";
  const titles: Record<ServiceType, string> = {
    standard: "Standard Cleaning",
    deep: "Deep Cleaning",
    move: "Move In/Out Cleaning",
    airbnb: "Airbnb Cleaning",
    carpet: "Carpet Cleaning",
  };
  return titles[service];
}

/** Result for metadata: flow with serviceSlug + step, or confirmation with ref */
export type ParsedSegmentsResult =
  | { kind: "flow"; serviceSlug: string; step: StepIndex }
  | { kind: "confirmation"; ref: string };

/**
 * Parse segments array (e.g. from Next.js params) for metadata/routing.
 */
export function parseBookingPathFromSegments(segments: string[]): ParsedSegmentsResult | null {
  if (segments.length === 0) return null;
  if (segments[0] === "confirmation") {
    const raw = segments[1];
    const ref = raw ? decodeURIComponent(raw) : undefined;
    return ref ? { kind: "confirmation", ref } : null;
  }
  const serviceSlug = segments[0];
  if (!serviceSlug || !SLUG_TO_SERVICE[serviceSlug]) return null;
  const hasSchedule = segments.includes("schedule");
  const hasCleaner = segments.includes("cleaner");
  const hasDetails = segments.includes("details");
  const hasPayment = segments.includes("payment");
  let step: StepIndex = 1;
  if (hasPayment) step = 5;
  else if (hasDetails) step = 4;
  else if (hasCleaner) step = 3;
  else if (hasSchedule) step = 2;
  return { kind: "flow", serviceSlug, step };
}
