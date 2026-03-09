"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CreditCard,
  Star,
  User,
  LogOut,
  MapPin,
  Sparkles,
  Download,
  Building2,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CleanerProfile } from "@/lib/dashboard-types";
import { PersonalDetailsModal } from "@/components/PersonalDetailsModal";
import { startVerificationForSession } from "@/app/actions/verification";
import { listPayoutsForSession, type PayoutRow } from "@/app/actions/payout";
import { updateBookingJobStatusForCleaner, type CleanerJob } from "@/app/actions/dashboard";
import { submitBookingRating, getCleanerReviews, getCleanerAverageRating, type CleanerReviewRow } from "@/app/actions/ratings";

async function requestPayoutApi(amount: number): Promise<
  { ok: true } | { ok: true; needsOtp: true; transferCode: string } | { ok: false; error: string }
> {
  const res = await fetch("/api/payout/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error ?? "Request failed" };
  if (data.needsOtp && data.transferCode) return { ok: true, needsOtp: true, transferCode: data.transferCode };
  return { ok: true };
}

async function finalizePayoutApi(transferCode: string, otp: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/payout/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transferCode, otp }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error ?? "Finalize failed" };
  return { ok: true };
}

async function listBanksApi(currency: string): Promise<{ ok: true; banks: { code: string; name: string }[] } | { ok: false; error: string }> {
  const res = await fetch(`/api/payout/banks?currency=${encodeURIComponent(currency)}`);
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error ?? "Failed to fetch banks" };
  return { ok: true, banks: data.banks ?? [] };
}

async function createRecipientApi(params: { bankCode: string; accountNumber: string; accountName: string }): Promise<
  { ok: true; recipientCode: string } | { ok: false; error: string }
> {
  const res = await fetch("/api/payout/recipient", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error ?? "Failed to save" };
  return { ok: true, recipientCode: data.recipientCode ?? "" };
}

function JobCardActions({
  job,
  statusUpdatingId,
  onStatusClick,
  onOpenMaps,
  onRateCustomer,
}: {
  job: CleanerJob;
  statusUpdatingId: string | null;
  onStatusClick: (newStatus: "on_my_way" | "arrived" | "started" | "completed") => Promise<void>;
  onOpenMaps: () => void;
  onRateCustomer: () => void;
}) {
  const busy = statusUpdatingId === job.id;
  if (job.status === "confirmed") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          onOpenMaps();
          await onStatusClick("on_my_way");
        }}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-60"
      >
        {busy ? "Updating…" : "Start Cleaning Journey"}
      </button>
    );
  }
  if (job.status === "on_my_way") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onStatusClick("arrived")}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-60"
      >
        {busy ? "Updating…" : "I've arrived"}
      </button>
    );
  }
  if (job.status === "arrived") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onStatusClick("started")}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-60"
      >
        {busy ? "Updating…" : "Start job"}
      </button>
    );
  }
  if (job.status === "started") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onStatusClick("completed")}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-60"
      >
        {busy ? "Updating…" : "Complete job"}
      </button>
    );
  }
  if (job.status === "completed") {
    if (job.hasCleanerRated) {
      return (
        <div className="w-full py-4 rounded-2xl font-black text-xs text-center text-slate-500 bg-slate-50">
          Thanks for your feedback
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={onRateCustomer}
        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
      >
        Rate customer
      </button>
    );
  }
  return null;
}

function RateCustomerModal({
  bookingId,
  customerName,
  onClose,
  onSubmitted,
}: {
  bookingId: string;
  customerName: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Please select a rating.");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await submitBookingRating(bookingId, "cleaner", rating, comment.trim() || null);
    setLoading(false);
    if (res.ok) onSubmitted();
    else setError(res.error);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-900">Rate customer</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4">How was your experience with {customerName}?</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  className={`w-10 h-10 rounded-xl font-black transition-all ${
                    rating >= i ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any notes..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating < 1}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type CleanerDashboardTab = "schedule" | "earnings" | "profile" | "settings";

export const CleanerDashboard = ({
  cleaner,
  onLogout,
  activeTab: controlledTab,
  onTabChange,
  onRefreshCleaner,
}: {
  cleaner: CleanerProfile;
  onLogout: () => void;
  activeTab?: CleanerDashboardTab;
  onTabChange?: (tab: CleanerDashboardTab) => void;
  onRefreshCleaner?: () => void;
}) => {
  const [internalTab, setInternalTab] = useState<CleanerDashboardTab>("schedule");
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutOtp, setPayoutOtp] = useState<{ transferCode: string } | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [bankingModalOpen, setBankingModalOpen] = useState(false);
  const [personalDetailsModalOpen, setPersonalDetailsModalOpen] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutsError, setPayoutsError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [rateCustomerBookingId, setRateCustomerBookingId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<CleanerReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  /** Average rating derived from loaded reviews when present; avoids stale profile.rating. */
  const [resolvedRating, setResolvedRating] = useState<number | undefined>(undefined);
  const isControlled = controlledTab !== undefined && onTabChange !== undefined;
  const activeTab = isControlled ? controlledTab! : internalTab;
  const setActiveTab = isControlled ? onTabChange! : setInternalTab;
  const displayRating = resolvedRating ?? cleaner.rating;
  const tabs = [
    { id: "schedule" as const, label: "Jobs", icon: <Calendar className="w-5 h-5" /> },
    { id: "earnings" as const, label: "Earnings", icon: <CreditCard className="w-5 h-5" /> },
    { id: "profile" as const, label: "Ratings", icon: <Star className="w-5 h-5" /> },
    { id: "settings" as const, label: "Account", icon: <User className="w-5 h-5" /> },
  ];

  useEffect(() => {
    getCleanerAverageRating(cleaner.id).then(setResolvedRating);
  }, [cleaner.id]);

  useEffect(() => {
    if (activeTab !== "profile") return;
    setReviewsLoading(true);
    getCleanerReviews(cleaner.id)
      .then((list) => {
        setReviews(list);
        if (list.length > 0) {
          const sum = list.reduce((a, r) => a + r.rating, 0);
          const avg = Math.round((sum / list.length) * 10) / 10;
          setResolvedRating(avg);
        }
      })
      .finally(() => setReviewsLoading(false));
  }, [activeTab, cleaner.id]);

  useEffect(() => {
    if (activeTab !== "earnings") return;
    setPayoutsLoading(true);
    setPayoutsError(null);
    listPayoutsForSession()
      .then((res) => {
        setPayoutsLoading(false);
        if (res.ok) setPayouts(res.payouts);
        else setPayoutsError(res.error);
      })
      .catch(() => {
        setPayoutsLoading(false);
        setPayoutsError("Failed to load payouts.");
      });
  }, [activeTab]);

  const refreshPayouts = () => {
    if (activeTab !== "earnings") return;
    listPayoutsForSession().then((res) => {
      if (res.ok) setPayouts(res.payouts);
    });
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-24 md:pb-0 px-1 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-1.5">
              Morning{(() => {
                const firstName = cleaner.name?.trim().split(/\s+/)[0];
                return firstName ? `, ${firstName}` : "";
              })()}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 font-black text-[10px] md:text-xs ${displayRating === 0 ? "text-slate-400" : "text-amber-500"}`}>
                <Star className={`w-3 h-3 md:w-3.5 md:h-3.5 ${displayRating === 0 ? "text-slate-200" : "fill-amber-500 text-amber-500"}`} />
                {displayRating === 0 ? "—" : displayRating}
              </span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase">
                {cleaner.completedJobs} Jobs Done
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="md:hidden p-2 text-slate-400 hover:text-red-500 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-3 p-4 md:p-0 bg-white md:bg-transparent rounded-[24px] shadow-sm md:shadow-none border md:border-none border-slate-100">
          <div className="flex flex-col md:items-end">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Today&apos;s Wallet
            </p>
            <p className="text-xl md:text-2xl font-black text-blue-600">R{cleaner.pendingEarnings}</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("earnings")}
            className="md:hidden p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            aria-label="Go to Earnings"
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isControlled && (
        <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-3 flex items-center justify-between md:hidden z-[100] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id ? "text-blue-600" : "text-slate-400"
            }`}
          >
            {tab.icon}
            <span className="text-[9px] font-black uppercase tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "schedule" && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Today&apos;s Schedule
              </h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  Active
                </span>
              </div>
            </div>
            {cleaner.todayBookings.length === 0 ? (
              <div className="bg-white p-8 rounded-[28px] border border-slate-100 shadow-sm text-center text-slate-500 text-sm">
                No jobs scheduled for today.
              </div>
            ) : (
              cleaner.todayBookings.map((job) => (
                <div
                  key={job.id}
                  className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4 hover:border-blue-100 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                          {job.time}
                        </p>
                        <p className="text-lg font-black text-slate-900 leading-tight">
                          {job.customerName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900 leading-none">R{job.price}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        My Earnings
                      </p>
                      {job.tipAmount > 0 && (
                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter mt-0.5">
                          + R{job.tipAmount} tip
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">{job.address}</p>
                  </div>
                  <JobCardActions
                    job={job}
                    statusUpdatingId={statusUpdatingId}
                    onStatusClick={async (newStatus) => {
                      setStatusUpdatingId(job.id);
                      const res = await updateBookingJobStatusForCleaner(job.id, newStatus);
                      setStatusUpdatingId(null);
                      if (res.ok) onRefreshCleaner?.();
                      else alert(res.error);
                    }}
                    onOpenMaps={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address)}`;
                      window.open(url, "_blank");
                    }}
                    onRateCustomer={() => setRateCustomerBookingId(job.id)}
                  />
                </div>
              ))
            )}
            {rateCustomerBookingId && (() => {
              const job = cleaner.todayBookings.find((j) => j.id === rateCustomerBookingId);
              return job ? (
                <RateCustomerModal
                  bookingId={job.id}
                  customerName={job.customerName}
                  onClose={() => setRateCustomerBookingId(null)}
                  onSubmitted={() => {
                    setRateCustomerBookingId(null);
                    onRefreshCleaner?.();
                  }}
                />
              ) : null;
            })()}
          </motion.div>
        )}

        {activeTab === "earnings" && (
          <motion.div
            key="earnings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Total Life Earnings
              </p>
              <h3 className="text-4xl font-black text-slate-900 mb-6">R{cleaner.totalEarnings}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Available</p>
                  <p className="text-xl font-black text-emerald-700">
                    R{typeof cleaner.availableBalance === "number" ? cleaner.availableBalance.toLocaleString("en-ZA", { minimumFractionDigits: 2 }) : "0.00"}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Pending</p>
                  <p className="text-xl font-black text-blue-700">R{cleaner.pendingEarnings}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!cleaner.paystackRecipientCode) {
                    setPayoutError("Add your bank details in Account → Banking Information first.");
                    setPayoutModalOpen(true);
                    return;
                  }
                  setPayoutError(null);
                  setPayoutAmount(String(cleaner.availableBalance ?? 0));
                  setPayoutOtp(null);
                  setOtpValue("");
                  setPayoutModalOpen(true);
                }}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl mt-6 hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-60"
              >
                Payout to Bank Account
              </button>
            </div>

            {payoutModalOpen && (
              <PayoutModal
                availableBalance={typeof cleaner.availableBalance === "number" ? cleaner.availableBalance : 0}
                hasBankDetails={!!cleaner.paystackRecipientCode}
                payoutAmount={payoutAmount}
                setPayoutAmount={setPayoutAmount}
                payoutLoading={payoutLoading}
                payoutError={payoutError}
                payoutOtp={payoutOtp}
                otpValue={otpValue}
                setOtpValue={setOtpValue}
                onClose={() => {
                  setPayoutModalOpen(false);
                  setPayoutError(null);
                  setPayoutOtp(null);
                  setOtpValue("");
                }}
                onConfirm={async () => {
                  setPayoutError(null);
                  setPayoutLoading(true);
                  try {
                    if (payoutOtp) {
                      const res = await finalizePayoutApi(payoutOtp.transferCode, otpValue);
                      setPayoutLoading(false);
                      if (res.ok) {
                        onRefreshCleaner?.();
                        refreshPayouts();
                        setPayoutModalOpen(false);
                        setPayoutOtp(null);
                        setOtpValue("");
                        return;
                      }
                      setPayoutError(res.error);
                      return;
                    }
                    const amount = parseFloat(payoutAmount);
                    if (Number.isNaN(amount) || amount <= 0) {
                      setPayoutError("Enter a valid amount.");
                      setPayoutLoading(false);
                      return;
                    }
                    const res = await requestPayoutApi(amount);
                    setPayoutLoading(false);
                    if (res.ok && "needsOtp" in res && res.needsOtp) {
                      setPayoutOtp({ transferCode: res.transferCode });
                      setPayoutError(null);
                      return;
                    }
                    if (res.ok) {
                      onRefreshCleaner?.();
                      refreshPayouts();
                      setPayoutModalOpen(false);
                      return;
                    }
                    setPayoutError(res.error);
                  } catch {
                    setPayoutLoading(false);
                    setPayoutError("Something went wrong.");
                  }
                }}
                onGoToAccount={() => {
                  setPayoutModalOpen(false);
                  setPayoutError(null);
                  setActiveTab("settings");
                }}
              />
            )}

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Recent Payouts
              </h3>
              <div className="space-y-3">
                {payoutsLoading ? (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center text-slate-500 text-sm">
                    Loading payouts…
                  </div>
                ) : payoutsError ? (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center text-red-600 text-sm">
                    {payoutsError}
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center text-slate-500 text-sm">
                    No payouts yet.
                  </div>
                ) : (
                  payouts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                          <Download className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {p.status === "success"
                              ? "Paid"
                              : p.status === "pending"
                                ? "Processing"
                                : p.status === "failed" || p.status === "reversed"
                                  ? "Failed"
                                  : p.status}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {new Date(p.created_at).toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-sm font-black ${
                          p.status === "success"
                            ? "text-emerald-600"
                            : p.status === "pending"
                              ? "text-blue-600"
                              : "text-slate-500"
                        }`}
                      >
                        {p.status === "success" ? "+" : ""}R{Number(p.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i <= Math.round(displayRating) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-1">
                {displayRating === 0 ? "—" : displayRating}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {displayRating === 0 ? "No ratings yet" : "Your average rating"}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Latest Reviews
              </h3>
              {reviewsLoading ? (
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center text-slate-500 text-sm">
                  Loading…
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center">
                  <p className="text-sm font-black text-slate-700 mb-1">No reviews yet</p>
                  <p className="text-xs text-slate-500">
                    Reviews from customers will appear here after they rate completed jobs.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                      </div>
                      {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(r.createdAt).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg bg-slate-100 flex items-center justify-center">
                  {cleaner.avatar ? (
                    <img
                      src={cleaner.avatar}
                      className="w-full h-full object-cover"
                      alt={cleaner.name}
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{cleaner.name}</h3>
                  <p className="text-xs font-bold text-slate-400">{cleaner.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setPersonalDetailsModalOpen(true)}
                  className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between group transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-black text-slate-600">Personal Details</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setBankingModalOpen(true)}
                  className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between group transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-black text-slate-600">Banking Information</span>
                  </div>
                </button>
                {bankingModalOpen && (
                  <BankingModal
                    verificationStatus={cleaner.verificationStatus}
                    hasBankDetails={!!cleaner.paystackRecipientCode}
                    onClose={() => setBankingModalOpen(false)}
                    onSuccess={() => {
                      setBankingModalOpen(false);
                      onRefreshCleaner?.();
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setSafetyModalOpen(true)}
                  className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between group transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-black text-slate-600">Safety & Verification</span>
                  </div>
                </button>
                {personalDetailsModalOpen && (
                  <PersonalDetailsModal
                    name={cleaner.name}
                    email={cleaner.email}
                    phone={cleaner.phone ?? ""}
                    address={cleaner.address ?? ""}
                    avatar={cleaner.avatar ?? ""}
                    onClose={() => setPersonalDetailsModalOpen(false)}
                    onSuccess={() => {
                      setPersonalDetailsModalOpen(false);
                      onRefreshCleaner?.();
                    }}
                  />
                )}
                {safetyModalOpen && (
                  <SafetyVerificationModal
                    verificationStatus={cleaner.verificationStatus}
                    verifiedAt={cleaner.verifiedAt}
                    onClose={() => setSafetyModalOpen(false)}
                  />
                )}
              </div>
              <button onClick={onLogout} className="w-full py-4 text-red-500 font-black text-sm">
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function PayoutModal({
  availableBalance,
  hasBankDetails,
  payoutAmount,
  setPayoutAmount,
  payoutLoading,
  payoutError,
  payoutOtp,
  otpValue,
  setOtpValue,
  onClose,
  onConfirm,
  onGoToAccount,
}: {
  availableBalance: number;
  hasBankDetails: boolean;
  payoutAmount: string;
  setPayoutAmount: (v: string) => void;
  payoutLoading: boolean;
  payoutError: string | null;
  payoutOtp: { transferCode: string } | null;
  otpValue: string;
  setOtpValue: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  onGoToAccount: () => void;
}) {
  const amount = parseFloat(payoutAmount);
  const invalidAmount = Number.isNaN(amount) || amount < 50 || amount > availableBalance;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-900">
            {payoutOtp ? "Confirm with OTP" : hasBankDetails ? "Payout to Bank Account" : "Bank details required"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {!hasBankDetails ? (
          <>
            <p className="text-sm text-slate-600 mb-4">{payoutError ?? "Add your bank details before requesting a payout."}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onGoToAccount}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Account
              </button>
            </div>
          </>
        ) : payoutOtp ? (
          <>
            <p className="text-xs text-slate-500 mb-3">Enter the OTP sent to your business phone.</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="OTP"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-mono tracking-widest"
            />
            {payoutError && <p className="text-sm text-red-600 mt-2">{payoutError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={payoutLoading || otpValue.length < 4}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              >
                {payoutLoading ? "Completing…" : "Complete"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-2">Available: R{availableBalance.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</p>
            <input
              type="number"
              min={50}
              max={availableBalance}
              step={1}
              placeholder="Amount (ZAR)"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 mb-2"
            />
            {payoutError && <p className="text-sm text-red-600 mb-2">{payoutError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={payoutLoading || !payoutAmount || invalidAmount}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              >
                {payoutLoading ? "Processing…" : "Confirm"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BankingModal({
  verificationStatus,
  hasBankDetails,
  onClose,
  onSuccess,
}: {
  verificationStatus: "pending" | "verified" | "rejected";
  hasBankDetails: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isVerified = verificationStatus === "verified";

  React.useEffect(() => {
    listBanksApi("ZAR").then((res) => {
      setLoadingBanks(false);
      if (res.ok) setBanks(res.banks);
      else setError(res.error);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await createRecipientApi({
        bankCode: bankCode.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });
      setLoading(false);
      if (res.ok) onSuccess();
      else setError(res.error);
    } catch {
      setLoading(false);
      setError("Something went wrong.");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-900">Banking Information</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {!isVerified && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
            Complete Safety &amp; Verification before adding bank details.
          </p>
        )}
        {hasBankDetails && (
          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-4">
            Bank account on file. You can update it below.
          </p>
        )}
        <p className="text-xs text-slate-500 mb-4">
          Add your South African bank account to receive payouts. We use Paystack (basa) for transfers.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Bank</label>
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              required
              disabled={loadingBanks || !isVerified}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">{loadingBanks ? "Loading…" : "Select bank"}</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Account number</label>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 0123456789"
              required
              disabled={!isVerified}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Account holder name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="As on bank statement"
              required
              disabled={!isVerified}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingBanks || !isVerified}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Saving…" : hasBankDetails ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StartVerificationButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const handleStart = async () => {
    setLoading(true);
    setMessage(null);
    const result = await startVerificationForSession();
    setLoading(false);
    if (result.ok && result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return;
    }
    if (!result.ok) setMessage(result.error);
  };
  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={handleStart}
        disabled={loading}
        className="w-full py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm"
      >
        {loading ? "Starting…" : "Start verification"}
      </button>
      {message && <p className="text-xs text-slate-500 mt-2">{message}</p>}
    </div>
  );
}

function SafetyVerificationModal({
  verificationStatus,
  verifiedAt,
  onClose,
}: {
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedAt?: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-900">Safety & Verification</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {verificationStatus === "verified" && (
          <>
            <p className="text-sm text-slate-600 mb-2">
              Your account is verified. Thank you for helping keep our community safe.
            </p>
            {verifiedAt && (
              <p className="text-xs text-slate-500 mb-6">
                Verified on {new Date(verifiedAt).toLocaleDateString()}.
              </p>
            )}
          </>
        )}
        {verificationStatus === "rejected" && (
          <p className="text-sm text-slate-600 mb-6">
            Verification was not approved for your account. If you have questions, please contact support.
          </p>
        )}
        {verificationStatus === "pending" && (
          <>
            <p className="text-sm text-slate-600 mb-2">
              Account verification helps keep our community safe. We may use this for identity or background checks. You will be notified when verification is available for your account.
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Your verification is in progress. We will notify you once it is complete. You can also start verification below if a provider is available.
            </p>
            <StartVerificationButton />
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 mt-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}
