import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of service – Shalean Cleaning Services",
  description:
    "Terms of service for using Shalean cleaning and booking services in Cape Town.",
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    url: `${SITE_URL}/terms`,
    title: "Terms of service – Shalean Cleaning Services",
    description:
      "Terms of service for using Shalean cleaning and booking services in Cape Town.",
    type: "website",
  },
};

export default function TermsPage() {
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
          Terms of service
        </h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: March 2025</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              1. Agreement to terms
            </h2>
            <p>
              By using the Shalean website and booking or receiving cleaning
              services, you agree to these terms of service and our{" "}
              <Link
                href="/cancellation-policy"
                className="text-blue-600 font-medium hover:underline"
              >
                cancellation policy
              </Link>
              . If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              2. Services
            </h2>
            <p>
              Shalean connects customers with vetted cleaning professionals in
              Cape Town and surrounding areas. We facilitate booking, scheduling
              and payment. The actual cleaning is performed by independent
              cleaners engaged through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              3. Booking and payment
            </h2>
            <p>
              When you book a clean, you agree to pay the quoted price (including
              any applicable taxes and fees). Payment is collected in advance or
              as otherwise stated at checkout. Refunds and cancellations are
              governed by our cancellation policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              4. Your responsibilities
            </h2>
            <p>
              You are responsible for providing accurate contact and address
              details, ensuring safe access for the cleaner, and communicating
              any special requirements. You must not use our services for any
              illegal or improper purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              5. Limitation of liability
            </h2>
            <p>
              Shalean’s liability is limited to the extent permitted by law. We
              are not liable for indirect, consequential or incidental damages
              arising from use of our platform or cleaning services. For
              disputes about a specific clean, please contact us and we will
              work to resolve the issue.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              6. Contact
            </h2>
            <p>
              For questions about these terms, contact us via the details on our
              website or at the contact information provided in your booking
              confirmation.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-slate-500">
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Shalean home
          </Link>
        </p>
      </main>
    </div>
  );
}
