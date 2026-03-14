import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cancellation policy – Shalean Cleaning Services",
  description:
    "Cancellation and refund policy for Shalean cleaning bookings in Cape Town.",
  alternates: { canonical: `${SITE_URL}/cancellation-policy` },
  openGraph: {
    url: `${SITE_URL}/cancellation-policy`,
    title: "Cancellation policy – Shalean Cleaning Services",
    description:
      "Cancellation and refund policy for Shalean cleaning bookings in Cape Town.",
    type: "website",
  },
};

export default function CancellationPolicyPage() {
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
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Cancellation policy
        </h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: March 2025</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Cancelling your booking
            </h2>
            <p>
              You may cancel a booking through your Shalean account or by
              contacting us. How we handle the cancellation (including any
              refund) depends on how far in advance you cancel, as set out
              below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Refund guidelines
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>More than 24 hours before the clean:</strong> You
                receive a full refund to your original payment method (or
                account credit, if we have offered that option).
              </li>
              <li>
                <strong>Less than 24 hours before the clean:</strong> Cancellations
                may be subject to a fee or partial refund, as we have limited
                ability to reallocate the cleaner. We will communicate any
                non-refundable portion at the time of cancellation.
              </li>
              <li>
                <strong>No-show or same-day cancellation:</strong> Typically
                non-refundable. Exceptions may apply in cases of emergency;
                contact us to discuss.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Rescheduling
            </h2>
            <p>
              You can reschedule a booking to a new date/time (subject to
              availability) through your dashboard or by contacting us.
              Rescheduling is free when done with reasonable notice. If you
              need to change your booking, we recommend doing so as early as
              possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Cancellations by Shalean
            </h2>
            <p>
              In rare cases we may need to cancel or reschedule (e.g. cleaner
              illness or safety issue). If we cancel your booking, you will
              receive a full refund and we will help you rebook at a convenient
              time if you wish.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Contact</h2>
            <p>
              For cancellation requests or questions about this policy, use the
              contact details in your booking confirmation or on our website.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-slate-500">
          You can also review our{" "}
          <Link
            href="/terms"
            className="text-blue-600 hover:underline"
          >
            terms of service
          </Link>{" "}
          or{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            return to Shalean home
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
