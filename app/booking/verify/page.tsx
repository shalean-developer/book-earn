"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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
          setError(json.error || "Payment verification failed. If funds were deducted, please contact support.");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Shalean"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
        </div>
        {loading && (
          <div className="flex flex-col items-center text-center space-y-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Verifying your payment
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Please wait a moment while we confirm your booking.
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">
                Something went wrong
              </p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/booking/your-cleaning-plan")}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl text-sm hover:bg-slate-800 transition-colors"
            >
              Return to booking
            </button>
          </div>
        )}

        {!loading && !error && result && result.booking && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 mb-1">
                Booking confirmed
              </p>
              <p className="text-xs text-slate-500">
                We&apos;ve emailed your booking details and reference. Thank you for booking with Shalean.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference</span>
                <span className="font-mono font-semibold text-slate-900">
                  {result.booking.reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service</span>
                <span className="font-semibold text-slate-900">
                  {result.booking.service}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">When</span>
                <span className="font-semibold text-slate-900">
                  {result.booking.date} · {result.booking.time}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Total paid</span>
                <span className="font-black text-slate-900">
                  {result.booking.currency} {result.booking.total.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBookAnother}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm hover:bg-blue-700 transition-colors"
            >
              Book another clean
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 flex flex-col items-center text-center space-y-4">
        <Image src="/logo.png" alt="Shalean" width={48} height={48} className="h-12 w-12 object-contain" />
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Verifying your payment
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Please wait a moment while we confirm your booking.
          </p>
        </div>
      </div>
    </div>}>
      <VerifyBookingPageInner />
    </Suspense>
  );
}

