"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { BookingVerifyLayout } from "@/components/BookingVerifyLayout";

interface VerifyResult {
  status: string;
  booking?: {
    reference: string;
    date: string;
    time: string;
    service: string;
    total: number;
    currency: string;
  };
  error?: string;
}

const SERVICE_TITLES: Record<string, string> = {
  standard: "Standard Cleaning",
  deep: "Deep Cleaning",
  move: "Moving Cleaning",
  airbnb: "Airbnb Cleaning",
  laundry: "Laundry & Ironing Cleaning",
  carpet: "Carpet Cleaning",
};

function serviceTitle(raw: string) {
  const key = raw?.toLowerCase?.() ?? raw;
  return SERVICE_TITLES[key] ?? raw;
}

function formatWhen(dateStr: string, timeStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) {
    return `${dateStr} · ${timeStr}`;
  }
  const datePart = d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${datePart} · ${timeStr}`;
}

function VerifyBookingPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    const reference = searchParams.get("reference");

    if (!reference) {
      setError("Missing payment reference. Please contact support with your payment details.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/booking/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reference }),
        });

        const json = (await res.json()) as VerifyResult;

        if (!res.ok) {
          setError(
            json.error ||
              "Payment verification failed. If funds were deducted, please contact support."
          );
          setLoading(false);
          return;
        }

        setResult(json);
        setLoading(false);
      } catch {
        setError(
          "We could not verify your payment due to a network error. Please refresh this page or contact support."
        );
        setLoading(false);
      }
    };

    verify();
  }, [searchParams]);

  const handleBookAnother = () => {
    router.push("/booking/your-cleaning-plan");
  };

  const cardShell =
    "rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-8 lg:p-10 shadow-[0_1px_0_rgba(0,0,0,0.04)]";

  return (
    <BookingVerifyLayout>
      <div className="max-w-7xl mx-auto w-full">
        <div className="max-w-lg mx-auto">
          {loading && (
            <div className={`${cardShell} flex flex-col items-center text-center space-y-4`}>
              <div className="flex justify-center mb-2">
                <Image
                  src="/logo.png"
                  alt="Shalean"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain opacity-90"
                />
              </div>
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <div>
                <p className="text-base font-bold text-neutral-900">Verifying your payment</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Please wait a moment while we confirm your booking.
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className={`${cardShell} space-y-6 text-center`}>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <p className="text-base font-bold text-neutral-900 mb-1">Something went wrong</p>
                <p className="text-sm text-neutral-500">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/booking/your-cleaning-plan")}
                className="w-full bg-neutral-900 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/15"
              >
                Return to booking
              </button>
            </div>
          )}

          {!loading && !error && result && result.booking && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cardShell}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.12, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/80"
                >
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.5} />
                </motion.div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 mb-1.5">
                  You&apos;re all set!
                </h1>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Booking confirmed. We&apos;ve emailed your booking details and reference. Thank you
                  for booking with Shalean.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.35 }}
                className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 sm:p-5 mb-6"
              >
                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 text-left">
                  Booking summary
                </h2>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-neutral-500 shrink-0">Reference</span>
                    <span className="font-mono font-semibold text-blue-600 text-right">
                      {result.booking.reference}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-neutral-500 shrink-0">Service</span>
                    <span className="font-bold text-neutral-900 text-right">
                      {serviceTitle(result.booking.service)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-neutral-500 shrink-0">When</span>
                    <span className="font-semibold text-neutral-900 text-right flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" aria-hidden />
                      <span>
                        {formatWhen(result.booking.date, result.booking.time)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200 flex items-center justify-between">
                  <span className="text-neutral-500 text-sm font-medium">Total paid</span>
                  <span className="font-black text-neutral-900 text-lg tabular-nums">
                    R{result.booking.total.toFixed(2)}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="space-y-4"
              >
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 flex flex-col gap-1.5 text-left">
                  <p className="text-[11px] font-semibold text-neutral-700">What happens next?</p>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    We&apos;ll review your booking and confirm your professional within 2 hours.
                    You&apos;ll get an email with any updates before your clean.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBookAnother}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-neutral-900/15 transition-colors text-sm"
                >
                  Book another clean
                </button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </BookingVerifyLayout>
  );
}

export default function VerifyBookingPage() {
  return (
    <Suspense
      fallback={
        <BookingVerifyLayout>
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-lg mx-auto rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-8 shadow-[0_1px_0_rgba(0,0,0,0.04)] flex flex-col items-center text-center space-y-4">
              <Image
                src="/logo.png"
                alt="Shalean"
                width={40}
                height={40}
                className="h-10 w-10 object-contain opacity-90"
              />
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <div>
                <p className="text-base font-bold text-neutral-900">Verifying your payment</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Please wait a moment while we confirm your booking.
                </p>
              </div>
            </div>
          </div>
        </BookingVerifyLayout>
      }
    >
      <VerifyBookingPageInner />
    </Suspense>
  );
}
