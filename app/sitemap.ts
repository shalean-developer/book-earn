import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";

const BOOKING_SLUGS = ["your-cleaning-plan", "schedule", "details", "payment"] as const;

const LOCATION_SLUGS = [
  "sea-point",
  "claremont",
  "durbanville",
  "observatory",
  "century-city",
  "table-view",
  "gardens",
  "constantia",
];

/** Public static paths (no dynamic segments). Private dashboards (/admin, /customer, /cleaner) are excluded. */
const STATIC_PATHS = [
  "",
  "/login",
  "/signup",
  "/about",
  "/blog",
  "/contact",
  "/terms",
  "/pricing",
  "/services",
  "/promotions",
  "/cancellation-policy",
  "/careers",
  "/locations",
  "/booking/verify",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path ? `${base}${path}` : base,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  const bookingEntries: MetadataRoute.Sitemap = BOOKING_SLUGS.map((slug) => ({
    url: `${base}/booking/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const locationEntries: MetadataRoute.Sitemap = LOCATION_SLUGS.map((slug) => ({
    url: `${base}/locations/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...bookingEntries, ...locationEntries];
}
