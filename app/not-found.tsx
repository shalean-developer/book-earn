import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found – Shalean Cleaning Services",
  description: "The page you're looking for doesn't exist or has been moved.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center max-w-md">
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <p className="mb-2 text-xl text-muted-foreground">
          Page not found
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or has been moved. Head back to the home page to continue.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

