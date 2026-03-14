import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Tag, Calendar, ArrowRight } from "lucide-react";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Current offers – Shalean Cleaning Services",
  description:
    "View current promotions and offers on Shalean cleaning services in Cape Town.",
  alternates: { canonical: `${SITE_URL}/promotions` },
  openGraph: {
    url: `${SITE_URL}/promotions`,
    title: "Current offers – Shalean Cleaning Services",
    description:
      "View current promotions and offers on Shalean cleaning services in Cape Town.",
    type: "website",
  },
};

export default function PromotionsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
          >
            <Image
              src="/logo.png"
              alt="Shalean"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="font-bold tracking-wide">Shalean</span>
          </Link>
          <Link
            href="/booking/your-cleaning-plan"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Book a clean
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 text-slate-500 mb-4">
          <Tag className="w-4 h-4" />
          <span className="text-sm font-medium">Offers</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Current promotions
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl">
          Check this page for seasonal discounts and promo codes on Shalean
          cleaning services in Cape Town. Enter any valid code at checkout when
          you book.
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <p className="text-slate-600 mb-6">
            We don’t have any active promotions right now. New offers are added
            from time to time — bookmark this page or follow us for updates.
          </p>
          <Link
            href="/booking/your-cleaning-plan"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700"
          >
            <Calendar className="w-4 h-4" />
            Book a clean
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
