/**
 * Canonical base URL for the app (used for redirects, callbacks, etc.).
 */
export function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  return url.startsWith("http") ? url : `https://${url}`;
}
