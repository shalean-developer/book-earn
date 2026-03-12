 "use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Star,
  LogOut,
  CheckCircle2,
  MessageSquare,
  Navigation,
  Award,
  Smartphone,
  ShieldCheck,
  Sparkles,
  X,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type CleanerTab = "today" | "schedule" | "earnings" | "chat";

type ApiJob = {
  id: string;
  customer: string;
  address: string | null;
  time: string;
  service: string;
  status: string | null;
  totalAmount: number;
  date: string;
};

type CleanerDashboardPayload = {
  cleaner: {
    name: string;
    rating: number | null;
    reviews: number;
    jobsCompleted: number;
  };
  today: {
    assignedCount: number;
    jobs: ApiJob[];
  };
  earnings: {
    pendingPayout: number;
    recentDays: {
      date: string;
      total: number;
      jobs: number;
    }[];
  };
};

type Job = {
  id: string;
  customer: string;
  address: string;
  time: string;
  service: string;
  duration: string;
  status: "assigned" | "in-progress" | "completed";
  earnings: string;
  notes?: string;
};

const formatCurrency = (amount: number) =>
  `R${(amount ?? 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const JobCard = ({ job }: { job: Job }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
      <div className="p-5 flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{job.customer}</h3>
            <p className="text-slate-500 text-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {job.time} ({job.duration})
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-black text-slate-900 text-lg">{job.earnings}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Est. Earnings
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3">
        <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-600 font-medium">{job.address}</p>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            <Navigation className="w-4 h-4" /> Directions
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 bg-slate-50 text-slate-500 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
          >
            {isExpanded ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2"
            >
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
                  Service: {job.service}
                </p>
                {job.notes && (
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    “{job.notes}”
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all">
          START JOB
        </button>
      </div>
    </div>
  );
};

export const CleanerDashboard = ({ onBack }: { onBack: () => void }) => {
  const { status, data } = useSession();
  const [activeTab, setActiveTab] = useState<CleanerTab>("today");
  const [payload, setPayload] = useState<CleanerDashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/cleaner/dashboard");
        if (!res.ok) {
          throw new Error("Failed to load cleaner dashboard");
        }
        const json = (await res.json()) as CleanerDashboardPayload;
        if (!cancelled) {
          setPayload(json);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading your cleaner session…</p>
      </div>
    );
  }

  const sessionUser = data?.user as
    | (typeof data.user & { role?: string; phone?: string })
    | undefined;

  if (!sessionUser || sessionUser.role !== "cleaner") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          You must be logged in as a cleaner to view this dashboard.
        </p>
      </div>
    );
  }

  const displayName =
    payload?.cleaner.name ||
    sessionUser.name ||
    (sessionUser.phone ? `Cleaner ${sessionUser.phone}` : "Cleaner");

  const rating = payload?.cleaner.rating ?? null;
  const reviews = payload?.cleaner.reviews ?? 0;

  const todayJobs: Job[] =
    payload?.today.jobs.map((j) => ({
      id: j.id,
      customer: j.customer,
      address: j.address || "Customer address",
      time: j.time,
      service: j.service || "Cleaning",
      duration: "3 Hours",
      status: "assigned",
      earnings: formatCurrency(j.totalAmount),
      notes: undefined,
    })) ?? [];

  const assignedCount = payload?.today.assignedCount ?? todayJobs.length;
  const pendingPayout = payload?.earnings.pendingPayout ?? 0;
  const recentDays = payload?.earnings.recentDays ?? [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      <header className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 border-b border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold border border-emerald-200">
              {displayName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-lg leading-none">
                Hello, {displayName}!
              </h1>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-amber-400 fill-current" />
                <span className="text-xs font-bold text-slate-500">
                  {rating ? rating.toFixed(1) : "New"} (
                  {reviews === 1 ? "1 review" : `${reviews} reviews`})
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 text-slate-400 rounded-full"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab("today")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "today"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "schedule"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab("earnings")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "earnings"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Earnings
          </button>
        </div>
      </header>

      <main className="px-6 py-8">
        {loading && (
          <p className="text-sm text-slate-500 mb-4">
            Loading your jobs and earnings…
          </p>
        )}
        {error && (
          <p className="text-sm text-red-500 mb-4">
            {error} Please try again in a moment.
          </p>
        )}

        {activeTab === "today" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">
                Your Jobs Today
              </h2>
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                {assignedCount} Assigned
              </span>
            </div>

            {todayJobs.length === 0 && !loading ? (
              <div className="text-center py-12 space-y-3">
                <Calendar className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="font-bold text-slate-900">No jobs today</p>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                  You don’t have any bookings assigned for today yet. We’ll
                  notify you as soon as something comes in.
                </p>
              </div>
            ) : (
              todayJobs.map((job) => <JobCard key={job.id} job={job} />)
            )}

            <div className="mt-8 p-6 bg-blue-600 rounded-2xl text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-200" />
                <h3 className="font-bold">Cleaner Safety Protocol</h3>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                Remember to wear your Shalean ID badge at all times and log your
                start/end times precisely to ensure accurate payments.
              </p>
              <button className="w-full bg-white/20 py-2 rounded-lg text-xs font-bold backdrop-blur-sm border border-white/30">
                Read Full Guidelines
              </button>
            </div>
          </>
        )}

        {activeTab === "schedule" && (
          <div className="text-center py-20 space-y-4">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto" />
            <h3 className="font-bold text-slate-900">Weekly Schedule</h3>
            <p className="text-slate-400 text-sm max-w-[200px] mx-auto">
              Upcoming shifts and availability management module.
            </p>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total Payout Pending
              </p>
              <h2 className="text-4xl font-black text-slate-900 mb-2">
                {formatCurrency(pendingPayout)}
              </h2>
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                <CheckCircle2 className="w-3 h-3" /> Payout processed weekly
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm">
                  Recent Earnings
                </h3>
              </div>
              <div className="divide-y divide-slate-50">
                {recentDays.length === 0 && !loading ? (
                  <div className="p-4 text-sm text-slate-400">
                    No recent earnings yet.
                  </div>
                ) : (
                  recentDays.map((item, idx) => (
                    <div
                      key={`${item.date}-${idx}`}
                      className="p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {item.date}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">
                          {item.jobs} {item.jobs === 1 ? "job" : "jobs"}
                        </p>
                      </div>
                      <p className="font-black text-slate-700">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="space-y-4">
            <div className="text-center py-10 space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-900">Chat coming soon</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                A secure in-app chat between you and customers will appear here.
              </p>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-4 flex justify-between items-center z-50">
        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`flex flex-col items-center gap-1 ${
            activeTab === "today" ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <Smartphone className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Home
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={`flex flex-col items-center gap-1 ${
            activeTab === "chat" ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Chat
          </span>
        </button>
        <div className="relative -top-9">
          <button
            type="button"
            className="w-16 h-16 bg-blue-600 rounded-full shadow-xl border-4 border-slate-50 flex items-center justify-center text-white"
          >
            <Navigation className="w-8 h-8" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab("earnings")}
          className={`flex flex-col items-center gap-1 ${
            activeTab === "earnings" ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <Award className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Trophies
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("schedule")}
          className={`flex flex-col items-center gap-1 ${
            activeTab === "schedule" ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Account
          </span>
        </button>
      </nav>
    </div>
  );
}

