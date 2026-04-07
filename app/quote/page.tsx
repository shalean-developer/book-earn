import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Instant quote – Bokkies",
  description:
    "Estimate pricing for home, office and Airbnb cleaning in Cape Town. Final price is confirmed at checkout with live surcharges and discounts.",
  alternates: { canonical: `${SITE_URL}/quote` },
  openGraph: {
    title: "Instant quote – Bokkies",
    description:
      "Estimate pricing for professional cleaning. Book online when you’re ready.",
    type: "website",
    url: `${SITE_URL}/quote`,
  },
};

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Get a quote
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
          The fastest way to see pricing is our live booking flow — it applies
          peak, weekend, area and frequency rules in real time, then shows your
          total before Paystack checkout.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/booking/your-cleaning-plan"
            className="inline-flex justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200/50 hover:bg-blue-700 transition-colors"
          >
            Start booking
          </Link>
          <Link
            href="/pricing"
            className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
          >
            View pricing list
          </Link>
        </div>
      </div>
    </div>
  );
}
