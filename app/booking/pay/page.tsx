"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle } from "lucide-react";

function PayPageInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "redirect" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref") || searchParams.get("reference");

    if (!ref) {
      setError("Missing payment link. Please use the link from your email.");
      setStatus("error");
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch(
          `/api/booking/pay-by-reference?reference=${encodeURIComponent(ref)}`
        );
        const data = (await res.json()) as { authorizationUrl?: string; error?: string };

        if (cancelled) return;

        if (!res.ok) {
          setError(data.error || "Could not start payment. The link may have expired.");
          setStatus("error");
          return;
        }

        if (data.authorizationUrl) {
          setStatus("redirect");
          window.location.href = data.authorizationUrl;
        } else {
          setError("Invalid response. Please try again or contact support.");
          setStatus("error");
        }
      } catch {
        if (!cancelled) {
          setError("Something went wrong. Please check your connection and try again.");
          setStatus("error");
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Payment link invalid</h1>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <Image
          src="/logo.png"
          alt="Shalean"
          width={48}
          height={48}
          className="mx-auto mb-4"
        />
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">
            {status === "redirect" ? "Redirecting to payment…" : "Preparing payment…"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <PayPageInner />
    </Suspense>
  );
}
