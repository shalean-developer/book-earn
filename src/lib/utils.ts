import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Canonical site URL for metadata, OpenGraph, and schema. */
export const SITE_URL = "https://shalean.co.za";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Derive a stable 8-digit ref from a booking id, e.g. SC89745869 */
export function formatBookingCode(id: string): string {
  let hash = 7;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000000;
  }
  const numericPart = Math.abs(hash).toString().padStart(8, "0").slice(-8);
  return `SC${numericPart}`;
}
