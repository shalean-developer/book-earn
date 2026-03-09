"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Star,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  MapPin,
  User,
  Zap,
  Tag,
  Award,
  CalendarClock,
  RotateCcw,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserProfile } from "@/lib/dashboard-types";
import {
  getNextTier,
  getTierProgressPercent,
  getPointsToNextTier,
} from "@/lib/dashboard-types";
import type { DashboardBooking } from "@/app/actions/dashboard";
import { updateBookingDateTimeForCustomer, getRebookPayload } from "@/app/actions/booking";
import { initializePaystackTransaction } from "@/app/actions/paystack";
import { redeemReward } from "@/app/actions/rewards";
import { getRatedBookingIdsForCustomer, submitBookingRating } from "@/app/actions/ratings";
import { PersonalDetailsModal } from "@/components/PersonalDetailsModal";
import { BOOKING_BASE, SERVICE_SLUGS } from "@/lib/booking-routes";
import type { ServiceType } from "@/lib/booking-routes";

export type CustomerDashboardTab = "overview" | "bookings" | "profile" | "rewards";

const TIME_SLOTS = ["08:00", "10:00", "13:00", "15:00"];

export const CustomerDashboard = ({
  user,
  onLogout,
  onNewBooking,
  onRefreshUser,
  onRefreshBookings,
  activeTab: controlledTab,
  onTabChange,
}: {
  user: UserProfile;
  onLogout: () => void;
  onNewBooking: () => void;
  onRefreshUser?: () => void;
  onRefreshBookings?: () => void;
  activeTab?: CustomerDashboardTab;
  onTabChange?: (tab: CustomerDashboardTab) => void;
}) => {
  const router = useRouter();
  const [internalTab, setInternalTab] = useState<CustomerDashboardTab>("overview");
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState<"r50" | "deep" | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<DashboardBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [ratedBookingIds, setRatedBookingIds] = useState<Set<string>>(new Set());
  const [rateCleanerBooking, setRateCleanerBooking] = useState<DashboardBooking | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [rebookBooking, setRebookBooking] = useState<DashboardBooking | null>(null);
  const [rebookDate, setRebookDate] = useState("");
  const [rebookTime, setRebookTime] = useState("");
  const [rebookLoading, setRebookLoading] = useState(false);
  const [rebookError, setRebookError] = useState<string | null>(null);
  const isControlled = controlledTab !== undefined && onTabChange !== undefined;
  const activeTab = isControlled ? controlledTab! : internalTab;
  const setActiveTab = isControlled ? onTabChange! : setInternalTab;

  useEffect(() => {
    if (user.role === "customer") {
      getRatedBookingIdsForCustomer().then(setRatedBookingIds);
    }
  }, [user.role]);
  const tabs = [
    { id: "overview" as const, label: "Overview", icon: <Layers className="w-5 h-5" /> },
    { id: "bookings" as const, label: "Bookings", icon: <Calendar className="w-5 h-5" /> },
    { id: "rewards" as const, label: "Rewards", icon: <Zap className="w-5 h-5" /> },
    { id: "profile" as const, label: "Profile", icon: <User className="w-5 h-5" /> },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "upcoming":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  /** User-facing status label; for upcoming shows lifecycle (e.g. On my way) when statusRaw is set. */
  const getStatusDisplayLabel = (booking: DashboardBooking): string => {
    const fallback = booking.status || "—";
    if (booking.status !== "upcoming" || !booking.statusRaw) return fallback;
    const raw = (booking.statusRaw ?? "").toLowerCase();
    if (raw === "on_my_way") return "On my way";
    if (raw === "arrived") return "Arrived";
    if (raw === "started") return "Started";
    if (raw === "confirmed") return "Confirmed";
    return fallback;
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 md:px-0">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-1.5">
              Hello, {user.name.split(" ")[0]}
            </h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium">Welcome back to Shalean.</p>
          </div>
          <button
            onClick={onLogout}
            className="md:hidden p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isControlled && (
        <div className="hidden md:flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
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
            <span className="text-[9px] font-black uppercase tracking-tight">
              {tab.label.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 md:space-y-10"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm hover:border-blue-100 transition-colors">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                  <Calendar className="w-5 h-5 md:w-5 md:h-5" />
                </div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">
                  Bookings
                </p>
                <p className="text-xl md:text-3xl font-black text-slate-900">{user.bookings.length}</p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm hover:border-emerald-100 transition-colors">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                  <CheckCircle2 className="w-5 h-5 md:w-5 md:h-5" />
                </div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">
                  Hours
                </p>
                <p className="text-xl md:text-3xl font-black text-slate-900">{user.totalHours ?? 0}</p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm hover:border-indigo-100 col-span-2 md:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Tag className="w-5 h-5 md:w-5 md:h-5" />
                  </div>
                  <span className="md:hidden text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                    {user.tier} Tier
                  </span>
                </div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">
                  Points
                </p>
                <p className="text-xl md:text-3xl font-black text-slate-900">{user.points}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Recent Activity
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRefreshBookings?.()}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    title="Refresh bookings"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
                  >
                    See All
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                {user.bookings.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm font-medium">
                    No bookings yet. Click New Booking to get started.
                  </div>
                ) : (
                  user.bookings.map((booking: DashboardBooking) => (
                    <div
                      key={booking.id}
                      className="border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <div
                        className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer"
                        onClick={() =>
                          setExpandedBookingId((id) => (id === booking.id ? null : booking.id))
                        }
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                            {booking.service === "standard" ? (
                              <Sparkles className="w-5 h-5" />
                            ) : (
                              <Layers className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {booking.service.charAt(0).toUpperCase() + booking.service.slice(1)} Clean
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter md:tracking-normal">
                              {booking.date} • {booking.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider ${getStatusColor(booking.status)}`}
                          >
                            {getStatusDisplayLabel(booking)}
                          </span>
                          <p className="text-sm font-black text-slate-900">R{booking.total}</p>
                          {expandedBookingId === booking.id ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </div>
                      {expandedBookingId === booking.id && (
                        <div
                          className="px-4 pb-4 md:px-6 md:pb-6 pt-0 bg-slate-50/30 space-y-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Details
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs text-slate-700">
                            <p><span className="font-semibold">Ref:</span> {booking.ref}</p>
                            <p><span className="font-semibold">Service:</span> {booking.service.charAt(0).toUpperCase() + booking.service.slice(1)} Clean</p>
                            <p><span className="font-semibold">Date & time:</span> {booking.date} at {booking.time}</p>
                            <p><span className="font-semibold">Address:</span> {booking.address ?? "—"}</p>
                            <p><span className="font-semibold">Instructions:</span> {booking.instructions ?? "—"}</p>
                            <p><span className="font-semibold">Bedrooms:</span> {booking.bedrooms ?? "—"}</p>
                            <p><span className="font-semibold">Bathrooms:</span> {booking.bathrooms ?? "—"}</p>
                            <p><span className="font-semibold">Extra rooms:</span> {booking.extraRooms ?? "—"}</p>
                            <p><span className="font-semibold">Extras:</span> {booking.extras?.length ? booking.extras.join(", ") : "—"}</p>
                            <p><span className="font-semibold">Cleaner:</span> {booking.cleanerName ?? "Not yet assigned"}</p>
                            <p><span className="font-semibold">Total:</span> R{booking.total}</p>
                            <p><span className="font-semibold">Status:</span> {getStatusDisplayLabel(booking)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            {booking.status === "upcoming" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRescheduleBooking(booking);
                                  setRescheduleDate(booking.date);
                                  setRescheduleTime(booking.time);
                                  setRescheduleError(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                <CalendarClock className="w-3.5 h-3.5" />
                                Reschedule
                              </button>
                            )}
                            {booking.status === "completed" && (
                              <>
                                {!ratedBookingIds.has(booking.id) && (
                                  <button
                                    type="button"
                                    onClick={() => setRateCleanerBooking(booking)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                    Rate cleaner
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRebookBooking(booking);
                                    setRebookDate("");
                                    setRebookTime("");
                                    setRebookError(null);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Rebook
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "bookings" && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Your bookings
              </h3>
              <button
                type="button"
                onClick={() => onRefreshBookings?.()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Refresh bookings"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
            {user.bookings.length === 0 ? (
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center text-slate-500">
                No bookings yet. <button onClick={onNewBooking} className="text-blue-600 font-black underline">Book a clean</button> to get started.
              </div>
            ) : (
              user.bookings.map((booking: DashboardBooking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() =>
                      setExpandedBookingId((id) => (id === booking.id ? null : booking.id))
                    }
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Ref: {booking.ref}
                          </p>
                          <h4 className="text-lg font-black text-slate-900 capitalize">
                            {booking.service} Clean
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(booking.status)}`}
                        >
                          {getStatusDisplayLabel(booking)}
                        </span>
                        {expandedBookingId === booking.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <p className="text-xs font-bold text-slate-600">
                          {booking.date} at {booking.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <p className="text-xs font-bold text-slate-600 truncate">
                          {booking.address ?? "—"}
                        </p>
                      </div>
                    </div>
                    {(booking.cleanerName || booking.total) && (
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200" />
                          <p className="text-xs font-bold text-slate-600">
                            Assigned:{" "}
                            <span className="text-slate-900 font-black">
                              {booking.cleanerName ?? "Not yet assigned"}
                            </span>
                          </p>
                        </div>
                        <p className="text-lg font-black text-blue-600">R{booking.total}</p>
                      </div>
                    )}
                  </div>
                    {expandedBookingId === booking.id && (
                    <div
                      className="px-6 pb-6 pt-0 space-y-4 bg-slate-50/30 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        More details
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs text-slate-700">
                        <p><span className="font-semibold">Address:</span> {booking.address ?? "—"}</p>
                        <p><span className="font-semibold">Instructions:</span> {booking.instructions ?? "—"}</p>
                        <p><span className="font-semibold">Bedrooms:</span> {booking.bedrooms ?? "—"}</p>
                        <p><span className="font-semibold">Bathrooms:</span> {booking.bathrooms ?? "—"}</p>
                        <p><span className="font-semibold">Extra rooms:</span> {booking.extraRooms ?? "—"}</p>
                        <p><span className="font-semibold">Extras:</span> {booking.extras?.length ? booking.extras.join(", ") : "—"}</p>
                        <p><span className="font-semibold">Cleaner:</span> {booking.cleanerName ?? "Not yet assigned"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                        {booking.status === "upcoming" && (
                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleBooking(booking);
                              setRescheduleDate(booking.date);
                              setRescheduleTime(booking.time);
                              setRescheduleError(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            Reschedule
                          </button>
                        )}
                        {booking.status === "completed" && (
                          <>
                            {!ratedBookingIds.has(booking.id) && (
                              <button
                                type="button"
                                onClick={() => setRateCleanerBooking(booking)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100"
                              >
                                <Star className="w-3.5 h-3.5" />
                                Rate cleaner
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setRebookBooking(booking);
                                setRebookDate("");
                                setRebookTime("");
                                setRebookError(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Rebook
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {rebookBooking && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6">
              <h3 className="text-lg font-black text-slate-900 mb-2">Rebook – choose new date and time</h3>
              <p className="text-sm text-slate-600 mb-4">
                Same {rebookBooking.service} clean at {rebookBooking.address ?? "your address"}. Pick a new date and time, then continue to payment.
              </p>
              {rebookError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
                  {rebookError}
                </div>
              )}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={rebookDate}
                    onChange={(e) => setRebookDate(e.target.value)}
                    disabled={rebookLoading}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Time
                  </label>
                  <select
                    value={rebookTime}
                    onChange={(e) => setRebookTime(e.target.value)}
                    disabled={rebookLoading}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold bg-white"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={rebookLoading || !rebookDate || !rebookTime}
                  onClick={async () => {
                    if (!rebookBooking) return;
                    setRebookLoading(true);
                    setRebookError(null);
                    const result = await getRebookPayload(rebookBooking.id, {
                      date: rebookDate,
                      time: rebookTime,
                    });
                    if (!result.ok) {
                      setRebookError(result.error ?? "Something went wrong.");
                      setRebookLoading(false);
                      return;
                    }
                    const payResult = await initializePaystackTransaction(result.payload);
                    setRebookLoading(false);
                    if (payResult.ok) {
                      window.location.href = payResult.authorization_url;
                      return;
                    }
                    setRebookError(payResult.error ?? "Payment could not be started.");
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {rebookLoading ? "Redirecting…" : "Continue to payment"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRebookBooking(null);
                    setRebookError(null);
                  }}
                  disabled={rebookLoading}
                  className="px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {rescheduleBooking && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6">
              <h3 className="text-lg font-black text-slate-900 mb-2">Reschedule booking</h3>
              <p className="text-sm text-slate-600 mb-4">
                Ref: {rescheduleBooking.ref} — choose new date and time.
              </p>
              {rescheduleError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
                  {rescheduleError}
                </div>
              )}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    disabled={rescheduleLoading}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Time
                  </label>
                  <select
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    disabled={rescheduleLoading}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold bg-white"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={rescheduleLoading}
                  onClick={async () => {
                    setRescheduleLoading(true);
                    setRescheduleError(null);
                    const result = await updateBookingDateTimeForCustomer(rescheduleBooking.id, {
                      date: rescheduleDate,
                      time: rescheduleTime,
                    });
                    setRescheduleLoading(false);
                    if (result.ok) {
                      setRescheduleBooking(null);
                      onRefreshBookings?.();
                    } else {
                      setRescheduleError(result.error ?? "Something went wrong.");
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {rescheduleLoading ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRescheduleBooking(null);
                    setRescheduleError(null);
                  }}
                  disabled={rescheduleLoading}
                  className="px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {rateCleanerBooking && (
          <RateCleanerModal
            bookingId={rateCleanerBooking.id}
            cleanerName={rateCleanerBooking.cleanerName ?? "your cleaner"}
            onClose={() => setRateCleanerBooking(null)}
            onSubmitted={() => {
              setRateCleanerBooking(null);
              getRatedBookingIdsForCustomer().then(setRatedBookingIds);
              onRefreshBookings?.();
            }}
          />
        )}

        {activeTab === "rewards" && (() => {
          const progressPercent = getTierProgressPercent(user.points, user.tier);
          const nextTier = getNextTier(user.tier);
          const pointsToNext = getPointsToNextTier(user.points, user.tier);
          const canRedeemR50 = user.points >= 500;
          const canRedeemDeep = user.points >= 2500;
          const handleRedeem = async (rewardId: "r50_off" | "free_deep_clean") => {
            setRedeemError(null);
            setRedeemLoading(rewardId === "r50_off" ? "r50" : "deep");
            const result = await redeemReward(rewardId);
            setRedeemLoading(null);
            if (!result.ok) setRedeemError(result.error);
          };
          return (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-8 rounded-[40px] text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-2">
                    {user.tier} Tier Member
                  </p>
                  <h3 className="text-4xl font-black mb-6">{user.points} Points</h3>
                  <div className="w-full h-2 bg-white/20 rounded-full mb-3 overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(progressPercent * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-blue-100">
                    {nextTier && pointsToNext !== null
                      ? `${pointsToNext} points until ${nextTier} tier rewards`
                      : "You've reached the top tier."}
                  </p>
                </div>
                <Zap className="absolute top-[-20px] right-[-20px] w-48 h-48 text-white/10 rotate-12" />
              </div>

              {redeemError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                  {redeemError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm ${!canRedeemR50 ? "opacity-60" : ""}`}
                >
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <Tag className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-2">R50 Off Next Clean</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Redeem 500 points for an instant discount.
                  </p>
                  <button
                    onClick={() => handleRedeem("r50_off")}
                    disabled={!canRedeemR50 || redeemLoading !== null}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {redeemLoading === "r50" ? "Redeeming…" : canRedeemR50 ? "Redeem Now" : "Need 500 points"}
                  </button>
                </div>
                <div
                  className={`bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm ${!canRedeemDeep ? "opacity-60" : ""}`}
                >
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-2">Free Deep Clean</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Redeem 2500 points for a full deep clean.
                  </p>
                  <button
                    onClick={() => handleRedeem("free_deep_clean")}
                    disabled={!canRedeemDeep || redeemLoading !== null}
                    className={`w-full py-3 rounded-xl text-xs font-black ${
                      canRedeemDeep
                        ? "bg-slate-900 text-white shadow-lg"
                        : "bg-slate-100 text-slate-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {redeemLoading === "deep" ? "Redeeming…" : canRedeemDeep ? "Redeem Now" : "Locked (2500 pts)"}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-blue-50 bg-slate-100 flex items-center justify-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      className="w-full h-full object-cover"
                      alt={user.name}
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {user.tier} Member
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700">
                    {user.name || "—"}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700">
                    {user.email}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Phone Number
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700">
                    {user.phone ?? "—"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditProfileModalOpen(true)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all mt-4"
                >
                  Edit Profile Info
                </button>
              </div>
              {editProfileModalOpen && (
                <PersonalDetailsModal
                  name={user.name}
                  email={user.email}
                  phone={user.phone ?? ""}
                  address={user.address ?? ""}
                  avatar={user.avatar ?? ""}
                  onClose={() => setEditProfileModalOpen(false)}
                  onSuccess={() => {
                    setEditProfileModalOpen(false);
                    onRefreshUser?.();
                  }}
                />
              )}
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

function RateCleanerModal({
  bookingId,
  cleanerName,
  onClose,
  onSubmitted,
}: {
  bookingId: string;
  cleanerName: string;
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
    const res = await submitBookingRating(bookingId, "customer", rating, comment.trim() || null);
    setLoading(false);
    if (res.ok) onSubmitted();
    else setError(res.error);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-900">Rate your cleaner</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4">How was your experience with {cleanerName}?</p>
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
