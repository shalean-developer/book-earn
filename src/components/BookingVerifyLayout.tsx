"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const STEP_LABELS = [
  "Service",
  "Preferences",
  "Schedule",
  "Cleaner",
  "Details",
  "Pay",
] as const;

/** Past step 6 so every step shows completed (green check). */
const STEPPER_ALL_DONE_ACTIVE_INDEX = 6;

export function BookingVerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-[#EFF6FF]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2563EB] border-b border-white/15 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 text-white">
            <span className="font-bold tracking-tight text-base sm:text-lg">
              Shalean.
            </span>
          </Link>

          <div className="flex-1 flex justify-center min-w-0">
            <div
              className="hidden sm:flex items-center justify-center gap-1 sm:gap-2 max-w-xl w-full"
              role="list"
              aria-label="Booking steps"
            >
              {STEP_LABELS.map((label, idx) => {
                const current = idx === STEPPER_ALL_DONE_ACTIVE_INDEX;
                const completed = idx < STEPPER_ALL_DONE_ACTIVE_INDEX;
                return (
                  <React.Fragment key={label}>
                    <div
                      className="flex flex-col items-center gap-1 flex-1 min-w-0"
                      role="listitem"
                    >
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black transition-all ${
                          current
                            ? "bg-white text-[#2563EB]"
                            : completed
                              ? "bg-teal-500 text-white border border-teal-500"
                              : "bg-white/10 text-white/70 border border-white/15"
                        }`}
                        aria-label={label}
                      >
                        {completed && !current ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.5] text-white" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className="hidden lg:block text-[8px] font-bold uppercase tracking-[0.12em] text-white/50 text-center truncate max-w-[4.5rem]">
                        {label}
                      </span>
                    </div>
                    {idx < STEP_LABELS.length - 1 && (
                      <div className="h-px w-2 sm:w-4 md:w-6 bg-white/15 self-start mt-[13px] sm:mt-[15px] flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <Link
            href="/"
            className="hidden md:inline text-xs sm:text-sm font-medium text-white/80 hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
          >
            Back to home
          </Link>
        </div>
      </nav>

      <main className="flex-grow pt-24 md:pt-28 pb-10 px-3 sm:px-6">{children}</main>

      <footer className="flex h-20 items-center bg-[#0a0a0a] text-neutral-400 mt-auto">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 text-xs sm:text-sm">
          <span>© 2026 Shalean. All rights reserved</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="transition hover:text-white">
              Terms of service
            </Link>
            <Link href="/cancellation-policy" className="transition hover:text-white">
              Cancellation policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
