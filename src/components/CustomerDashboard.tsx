"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Home,
  Calendar,
  Clock,
  MapPin,
  User,
  Star,
  CreditCard,
  ChevronRight,
  ArrowLeft,
  LogOut,
  Settings,
  Bell,
  Download,
  MessageSquare,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Plus,
  History,
  ShieldCheck,
  Heart,
  Receipt,
  Copy,
  Mail,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatEstimatedDuration } from "@/lib/duration";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | string;

type CustomerBooking = {
  id: string;
  reference: string;
  service: string;
  status: BookingStatus | null;
  totalAmount: number;
  currency: string | null;
  date: string;
  time: string;
  address: string | null;
  createdAt: string | null;
  customerRating: number | null;
  customerComment: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  extraRooms?: number | null;
  instructions?: string | null;
  extras?: string[];
  cleanerId?: string | null;
  cleanerName?: string | null;
  estimatedDurationMinutes?: number | null;
};

type CustomerTab = "upcoming" | "history" | "settings" | "wallet";

type CustomerProfile = {
  name: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact_method: string | null;
  timezone: string | null;
  address_line1: string | null;
  address_city: string | null;
  address_region: string | null;
  address_postal_code: string | null;
};

type CustomerNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "upcoming" | "booking_update" | "payment" | "other";
};

interface Booking {
  id: string;
  bookingId: string;
  date: string;
  time: string;
  service: string;
  cleaner: string;
  status: BookingStatus;
  price: string;
  location: string;
  rating: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  extraRooms?: number | null;
  notes?: string | null;
  extras?: string[];
  estimatedDurationMinutes?: number | null;
}

function formatCurrency(amount: number, currency?: string | null) {
  if (!Number.isFinite(amount)) return "R0";
  const code = currency || "ZAR";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code === "ZAR" ? "R" : code + " "}${Math.round(amount).toLocaleString(
      "en-ZA",
    )}`;
  }
}

function formatDateLabel(date: string | null | undefined, time?: string | null) {
  if (!date) return "";
  const safeTime = time && time.trim() ? time : "09:00";
  const candidate = new Date(`${date}T${safeTime}`);
  if (Number.isNaN(candidate.getTime())) {
    const fallback = new Date(date);
    if (Number.isNaN(fallback.getTime())) return date;
    return fallback.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return candidate.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

function shortAddress(address: string | null | undefined) {
  if (!address) return "";
  const parts = address.split(",");
  if (parts.length <= 2) return address.trim();
  return `${parts[0].trim()}, ${parts[1].trim()}`;
}

function mapBookingToCard(b: CustomerBooking): Booking {
  // Create a human-friendly public reference like SC09383893
  const formatPublicReference = (raw: string | null | undefined) => {
    const value = (raw || "").trim();
    if (!value) return "";
    // If it's already in the correct format, keep it.
    if (/^SC\d{8}$/.test(value)) return value;
    // Try to build a numeric code from the raw id/reference.
    const digits = value.replace(/\D/g, "");
    const core = digits.slice(-8).padStart(8, "0");
    return `SC${core}`;
  };

  return {
    id: formatPublicReference(b.reference || b.id),
    bookingId: b.id,
    date: formatDateLabel(b.date, b.time),
    time: b.time || "",
    service: b.service || "Cleaning",
    cleaner: b.cleanerName ?? "Your Shalean Pro",
    status: (b.status as BookingStatus) || "pending",
    price: formatCurrency(b.totalAmount, b.currency),
    location: b.address || "To be confirmed",
    rating:
      typeof b.customerRating === "number" && Number.isFinite(b.customerRating)
        ? b.customerRating
        : null,
    bedrooms: b.bedrooms ?? null,
    bathrooms: b.bathrooms ?? null,
    extraRooms: b.extraRooms ?? null,
    notes: b.instructions ?? null,
    extras: Array.isArray(b.extras) ? b.extras : [],
    estimatedDurationMinutes: b.estimatedDurationMinutes ?? null,
  };
}

const BookingCard = ({
  booking,
  type,
  onRate,
  onRescheduleOrCancel,
  onViewDetails,
  onMessagePro,
}: {
  booking: Booking;
  type: "upcoming" | "history";
  onRate?: (booking: Booking) => void;
  onRescheduleOrCancel?: (booking: Booking) => void;
  onViewDetails?: (booking: Booking) => void;
  onMessagePro?: (booking: Booking) => void;
}) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            {booking.service.includes("Deep") ? (
              <Sparkles className="w-6 h-6" />
            ) : (
              <Home className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {booking.service}
            </h3>
            <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5" /> {booking.location}
            </p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          {/*
            Normalise status once so we can style and render the footer
            correctly for completed vs cancelled vs other historical states.
          */}
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          {(() => {
            const s = String(booking.status || "").toLowerCase();
            return (
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
              s === "completed"
                ? "bg-emerald-50 text-emerald-600"
                : s === "cancelled"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-blue-50 text-blue-600"
            }`}
          >
            {booking.status}
          </span>
            );
          })()}
          <p className="text-xl font-black text-slate-900">{booking.price}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-5 border-y border-slate-50">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
            Date
          </p>
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Calendar className="w-4 h-4 text-blue-500" /> {booking.date}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
            Time
          </p>
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Clock className="w-4 h-4 text-blue-500" /> {booking.time}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
            Est. duration
          </p>
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Clock className="w-4 h-4 text-blue-500" />{" "}
            {booking.estimatedDurationMinutes != null
              ? formatEstimatedDuration(booking.estimatedDurationMinutes)
              : "3h 30min"}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
            Pro Cleaner
          </p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
              {booking.cleaner
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <span className="text-slate-700 font-semibold text-sm">
              {booking.cleaner}
            </span>
            <div className="flex gap-0.5 ml-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-3 h-3 text-amber-400 fill-current"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center">
        {type === "upcoming" ? (
          <>
            <button
              className="text-slate-400 hover:text-rose-600 text-sm font-semibold transition-colors"
              onClick={() => onRescheduleOrCancel?.(booking)}
            >
              Reschedule / Cancel
            </button>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                onClick={() => onViewDetails?.(booking)}
              >
                View Details
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm"
                onClick={() => onMessagePro?.(booking)}
              >
                Message Pro
              </button>
            </div>
          </>
        ) : (
          (() => {
            const status = String(booking.status || "").toLowerCase();
            if (status === "completed") {
              return (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                      <CheckCircle className="w-4 h-4" /> Service Completed
                    </div>
                    {booking.rating ? (
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.round(booking.rating)
                                ? "fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-slate-500">
                          {booking.rating.toFixed(1)} / 5
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">
                      Get Invoice
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">
                      Book Again
                    </button>
                    {type === "history" && (
                      <button
                        className="px-4 py-2 border border-amber-200 rounded-lg text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100"
                        onClick={() => onRate?.(booking)}
                      >
                        {booking.rating ? "Update rating" : "Rate this clean"}
                      </button>
                    )}
                  </div>
                </>
              );
            }

            if (status === "cancelled") {
              return (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-rose-600 text-sm font-bold">
                      <AlertCircle className="w-4 h-4" /> Booking Cancelled
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">
                      Book Again
                    </button>
                  </div>
                </>
              );
            }

            // Fallback for other historical states like "failed"
            return (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                    <CheckCircle className="w-4 h-4" /> Booking Updated
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">
                    Book Again
                  </button>
                </div>
              </>
            );
          })()
        )}
      </div>
    </div>
  </div>
);

export const CustomerDashboard = ({
  onBack,
  onBookNew,
}: {
  onBack: () => void;
  onBookNew: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<CustomerTab>("upcoming");
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [manageBooking, setManageBooking] = useState<Booking | null>(null);
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
  const [manageSaving, setManageSaving] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageDate, setManageDate] = useState<string>("");
  const [manageTime, setManageTime] = useState<string>("");
  const [manageAddress, setManageAddress] = useState<string>("");
  const [manageService, setManageService] = useState<string>("");
  const [messageBooking, setMessageBooking] = useState<Booking | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messageSaving, setMessageSaving] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [walletBalanceCents, setWalletBalanceCents] = useState<number>(0);
  const [walletBalanceFormatted, setWalletBalanceFormatted] = useState<string>("R0");
  const [walletLoading, setWalletLoading] = useState(false);
  const [referralSheetOpen, setReferralSheetOpen] = useState(false);
  const [referralCopyFeedback, setReferralCopyFeedback] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingBookings(true);
        setBookingsError(null);
        const res = await fetch("/api/customer/bookings", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error || "Failed to load bookings");
        }
        const body = (await res.json()) as { bookings?: CustomerBooking[] };
        if (!cancelled) {
          setBookings(body.bookings ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading customer bookings", err);
          setBookingsError("We could not load your bookings right now.");
        }
      } finally {
        if (!cancelled) setLoadingBookings(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadNotifications() {
      try {
        setNotificationsLoading(true);
        setNotificationsError(null);
        const res = await fetch("/api/customer/notifications");
        if (!res.ok) {
          // Don’t block the dashboard if notifications fail.
          return;
        }
        const body = (await res.json()) as {
          notifications?: CustomerNotification[];
        };
        if (!cancelled && body.notifications) {
          setNotifications(
            body.notifications.map((n) => ({ ...n, read: n.read ?? false }))
          );
        }
      } catch (err) {
        console.error("Error loading customer notifications", err);
        if (!cancelled) {
          setNotificationsError("We couldn’t load alerts right now.");
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    }
    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const handleToggleNotifications = () => {
    setNotificationsOpen((open) => !open);
    setNotifications((current) =>
      current.map((n) => (n.read ? n : { ...n, read: true }))
    );
  };
  const handleMarkAllRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
  };
  const handleMarkOneRead = (id: string) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        setProfileError(null);
        const res = await fetch("/api/customer/profile");
        if (!res.ok) {
          // Silently ignore auth errors; user may be demo-logged in only.
          return;
        }
        const body = (await res.json()) as { profile?: CustomerProfile };
        if (!cancelled && body.profile) {
          setProfile(body.profile);
        }
      } catch (err) {
        console.error("Error loading customer profile", err);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load wallet on mount so Payments tab cards (Next Payment, This Month, Credits) show real data
  useEffect(() => {
    let cancelled = false;
    setWalletLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/customer/wallet", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          setWalletBalanceCents(0);
          setWalletBalanceFormatted("R0");
          return;
        }
        const body = (await res.json()) as {
          balanceCents?: number;
          balanceFormatted?: string;
        };
        setWalletBalanceCents(body.balanceCents ?? 0);
        setWalletBalanceFormatted(body.balanceFormatted ?? "R0");
      } catch {
        if (!cancelled) {
          setWalletBalanceCents(0);
          setWalletBalanceFormatted("R0");
        }
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingCards = useMemo(() => {
    const upcoming = bookings.filter((b) =>
      ["pending", "confirmed"].includes(String(b.status || "").toLowerCase()),
    );
    return upcoming.map(mapBookingToCard);
  }, [bookings]);

  const pastCards = useMemo(() => {
    const past = bookings.filter((b) =>
      ["completed", "cancelled", "failed"].includes(
        String(b.status || "").toLowerCase(),
      ),
    );
    return past.map(mapBookingToCard);
  }, [bookings]);

  const nextPayment = useMemo(() => {
    if (!bookings.length) return null;
    const upcoming = bookings.filter((b) =>
      ["pending", "confirmed"].includes(String(b.status || "").toLowerCase()),
    );
    if (!upcoming.length) return null;
    const soonest = [...upcoming].sort((a, b) => {
      const ad = new Date(`${a.date}T${a.time || "09:00"}`).getTime();
      const bd = new Date(`${b.date}T${b.time || "09:00"}`).getTime();
      return ad - bd;
    })[0];
    return {
      amount: formatCurrency(soonest.totalAmount, soonest.currency),
      dateLabel: formatDateLabel(soonest.date, soonest.time),
      time: soonest.time || "",
    };
  }, [bookings]);

  const monthlySummary = useMemo(() => {
    if (!bookings.length) return { total: 0, count: 0 };
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let total = 0;
    let count = 0;
    bookings.forEach((b) => {
      const status = String(b.status || "").toLowerCase();
      if (status !== "completed") return;
      const d = new Date(b.date || b.createdAt || "");
      if (Number.isNaN(d.getTime())) return;
      if (d.getMonth() === month && d.getFullYear() === year) {
        total += Number(b.totalAmount || 0);
        count += 1;
      }
    });
    return { total, count };
  }, [bookings]);

  const lifetimeSummary = useMemo(() => {
    if (!bookings.length) return { total: 0, count: 0 };
    let total = 0;
    let count = 0;
    bookings.forEach((b) => {
      const status = String(b.status || "").toLowerCase();
      if (status === "completed" || status === "confirmed") {
        total += Number(b.totalAmount || 0);
        count += 1;
      }
    });
    return { total, count };
  }, [bookings]);

  const invoices = useMemo(
    () =>
      pastCards.map((b) => ({
        id: b.id || "",
        date: b.date,
        amount: b.price,
        service: `${b.service} · ${shortAddress(b.location)}`,
        status: "Paid",
      })),
    [pastCards],
  );

  const customerName =
    profile?.name || session?.user?.name || (bookings[0]?.reference ? "Customer" : "Customer");
  const customerEmail = profile?.email || session?.user?.email || "";
  const initials =
    (profile?.name || session?.user?.name)
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "CU";

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Shalean"
              width={40}
              height={40}
              className="h-10 w-10 object-contain flex-shrink-0"
            />
            <div>
              <span className="font-black text-xl tracking-tight text-slate-900 block leading-none">
                SHALEAN
              </span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Customer Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all"
              onClick={onBookNew}
            >
              <Plus className="w-4 h-4" /> New Booking
            </button>
            <div className="relative">
              <button
                className="p-2 text-slate-400 hover:text-blue-600 relative rounded-full hover:bg-slate-100 transition-colors"
                onClick={handleToggleNotifications}
                aria-label={
                  unreadNotifications
                    ? `You have ${unreadNotifications} unread notifications`
                    : "Notifications"
                }
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                          Notifications
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {notificationsLoading
                            ? "Loading…"
                            : notificationsError
                            ? notificationsError
                            : unreadNotifications > 0
                            ? `${unreadNotifications} new ${unreadNotifications === 1 ? "alert" : "alerts"}`
                            : "You're all caught up"}
                        </p>
                      </div>
                      {!notificationsLoading &&
                        !notificationsError &&
                        notifications.some((n) => !n.read) && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Mark all read
                          </button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="px-4 py-6 text-xs text-slate-500">
                          Loading your latest alerts…
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-6 text-xs text-slate-500">
                          You&apos;re all caught up. We&apos;ll let you know about new
                          bookings and updates here.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id + n.time}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleMarkOneRead(n.id)}
                            onKeyDown={(e) =>
                              (e.key === "Enter" || e.key === " ") &&
                              handleMarkOneRead(n.id)
                            }
                            className={`px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/80 cursor-pointer transition-colors ${
                              n.read ? "bg-white" : "bg-blue-50/60"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {n.type === "upcoming" ? (
                                  <Calendar className="w-4 h-4 text-blue-500" />
                                ) : n.type === "payment" ? (
                                  <CreditCard className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-900">
                                  {n.title}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {n.description}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {n.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {notificationsError && (
                        <div className="px-4 py-2 text-[11px] text-rose-500 border-t border-rose-100 bg-rose-50/40">
                          {notificationsError}
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  // Toggle is handled by a focus-visible style + next click;
                  // wrapper div below uses :focus-within styles.
                }}
                className="flex items-center gap-3 p-1 hover:bg-slate-50 rounded-full border border-transparent hover:border-slate-100 transition-all focus:outline-none"
              >
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                  {initials}
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
              </button>
              <div className="absolute right-0 mt-2">
                <details className="relative group">
                  <summary className="list-none cursor-pointer absolute -top-9 right-0 w-9 h-9 rounded-full">
                    <span className="sr-only">Open account menu</span>
                  </summary>
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-500">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {customerEmail || "Customer"}
                      </p>
                    </div>
                    <div className="py-1 text-sm text-slate-700">
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50"
                        onClick={onBack}
                      >
                        <Home className="w-4 h-4 text-slate-400" />
                        <span>Back to homepage</span>
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50"
                        onClick={() => setActiveTab("upcoming")}
                      >
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>My bookings</span>
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50"
                        onClick={() => setActiveTab("wallet")}
                      >
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span>Payments & invoices</span>
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50"
                        onClick={() => setActiveTab("settings")}
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Profile & preferences</span>
                      </button>
                    </div>
                    <div className="border-t border-slate-100">
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                        onClick={onBack}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </motion.div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            {customerName ? `Welcome back, ${customerName}!` : "Welcome back!"}
          </h1>
          <p className="text-slate-500">
            {loadingBookings
              ? "Loading your upcoming cleans..."
              : bookingsError
                ? bookingsError
                : upcomingCards.length
                  ? `You have ${upcomingCards.length} upcoming clean${
                      upcomingCards.length > 1 ? "s" : ""
                    } scheduled.`
                  : "You don’t have any upcoming cleans yet."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div
            className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer"
            onClick={onBookNew}
          >
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-32 h-32" />
            </div>
            <p className="text-blue-100 text-sm font-semibold mb-1">
              Need a shine?
            </p>
            <h3 className="text-xl font-bold mb-4">Book a new service</h3>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-md">
              Get started <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 transition-all"
            onClick={() => setReferralSheetOpen(true)}
          >
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Refer a Friend</h3>
            <p className="text-slate-500 text-sm">
              Give R100, get R100 for your next clean.
            </p>
          </div>

          <Sheet open={referralSheetOpen} onOpenChange={setReferralSheetOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-indigo-600" />
                  Refer a Friend
                </SheetTitle>
                <SheetDescription>
                  Share your link so friends can book their first clean. You both get R100 credit when they complete it.
                </SheetDescription>
              </SheetHeader>
              {(() => {
                const baseUrl =
                  typeof window !== "undefined" ? window.location.origin : "https://shalean.co.za";
                const refParam =
                  customerEmail && typeof btoa !== "undefined"
                    ? "?ref=" + encodeURIComponent(btoa(customerEmail.trim().toLowerCase()))
                    : "";
                const referralUrl = baseUrl + refParam;
                const name = customerName || "a friend";
                const message = `${name} would love to refer you to Shalean – premium home and office cleaning.\n\nUse my link to book your first clean:\n${referralUrl}\n\nGive R100, get R100 off your next clean.`;
                const hasNativeShare = typeof navigator !== "undefined" && !!(navigator as any).share;
                return (
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                        Your referral link
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={referralUrl}
                          className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator === "undefined") return;
                            navigator.clipboard.writeText(referralUrl).then(() => {
                              setReferralCopyFeedback(true);
                              setTimeout(() => setReferralCopyFeedback(false), 2000);
                            });
                          }}
                          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          {referralCopyFeedback ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Share via
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window === "undefined") return;
                            navigator.clipboard.writeText(referralUrl);
                            const mailto = `mailto:?subject=${encodeURIComponent(
                              "Clean with Shalean",
                            )}&body=${encodeURIComponent(message)}`;
                            window.location.href = mailto;
                          }}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window === "undefined") return;
                            const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                            window.open(waUrl, "_blank", "noopener,noreferrer");
                          }}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          WhatsApp
                        </button>
                        {hasNativeShare && (
                          <button
                            type="button"
                            onClick={() => {
                              (navigator as any)
                                .share({
                                  title: "Shalean referral",
                                  text: message,
                                  url: referralUrl,
                                })
                                .catch(() => {});
                            }}
                            className="col-span-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            Share (app or more options)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </SheetContent>
          </Sheet>

          <div
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 transition-all"
            onClick={() => setActiveTab("wallet")}
          >
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Member Status</h3>
            <p className="text-slate-500 text-sm">
              {lifetimeSummary.count > 0
                ? `You've completed ${lifetimeSummary.count} clean${
                    lifetimeSummary.count === 1 ? "" : "s"
                  } worth ${formatCurrency(lifetimeSummary.total)} with Shalean.`
                : "Book your first clean to start unlocking member benefits."}
            </p>
          </div>
        </div>

        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
          {[
            {
              id: "upcoming",
              label: "Upcoming",
              icon: <Calendar className="w-4 h-4" />,
            },
            {
              id: "history",
              label: "Past Bookings",
              icon: <History className="w-4 h-4" />,
            },
            {
              id: "wallet",
              label: "Payments",
              icon: <CreditCard className="w-4 h-4" />,
            },
            {
              id: "settings",
              label: "Profile Settings",
              icon: <Settings className="w-4 h-4" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CustomerTab)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50/30"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {manageBooking ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="space-y-1">
                  <button
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
                    onClick={() => {
                      setManageBooking(null);
                      setManageError(null);
                      setManageDate("");
                      setManageTime("");
                    }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to bookings
                  </button>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Manage booking
                  </p>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 lowercase first-letter:uppercase">
                    {manageBooking.service}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      {manageBooking.date} · {manageBooking.time}
                    </span>
                  </p>
                </div>
                <p className="hidden sm:block max-w-xs text-xs text-slate-500 text-right">
                  Update this booking’s date, time, service, address, or cancel it. Changes are
                  free up to 24 hours before your scheduled clean.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Choose a new date, time, service type, or home address. We&apos;ll send your
                    cleaner an updated schedule automatically.
                  </p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          New date
                        </label>
                        <input
                          type="date"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                          value={manageDate}
                          onChange={(e) => setManageDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          New time
                        </label>
                        <input
                          type="time"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                          value={manageTime}
                          onChange={(e) => setManageTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Service type
                        </label>
                        <select
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                          value={manageService}
                          onChange={(e) => setManageService(e.target.value)}
                        >
                          <option value="">Keep current</option>
                          <option value="Standard clean">Standard clean</option>
                          <option value="Deep clean">Deep clean</option>
                          <option value="Move-in / move-out clean">
                            Move-in / move-out clean
                          </option>
                          <option value="Office clean">Office clean</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Home address
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                          placeholder="Leave blank to keep current address"
                          value={manageAddress}
                          onChange={(e) => setManageAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2">
                    <button
                      className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={
                        manageSaving ||
                        (!manageDate &&
                          !manageTime &&
                          !manageAddress.trim() &&
                          !manageService.trim())
                      }
                      onClick={async () => {
                        if (!manageBooking) return;
                        try {
                          setManageSaving(true);
                          setManageError(null);
                          const res = await fetch(
                            `/api/customer/bookings/${encodeURIComponent(
                              manageBooking.bookingId,
                            )}/reschedule`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                date: manageDate || undefined,
                                time: manageTime || undefined,
                                address: manageAddress || undefined,
                                service: manageService || undefined,
                              }),
                            },
                          );
                          if (!res.ok) {
                            const body = (await res.json().catch(() => null)) as
                              | { error?: string }
                              | null;
                            throw new Error(
                              body?.error ||
                                "We could not reschedule this booking. Please try again.",
                            );
                          }
                          setBookings((prev) =>
                            prev.map((b) => {
                              if (b.id === manageBooking.bookingId) {
                                return {
                                  ...b,
                                  date: manageDate || b.date,
                                  time: manageTime || b.time,
                                  address: manageAddress || b.address,
                                  service: manageService || b.service,
                                };
                              }
                              return b;
                            }),
                          );
                          setManageBooking(null);
                          setManageDate("");
                          setManageTime("");
                          setManageAddress("");
                          setManageService("");
                        } catch (err) {
                          console.error("Failed to reschedule booking", err);
                          setManageError(
                            err instanceof Error
                              ? err.message
                              : "We could not reschedule this booking. Please try again.",
                          );
                        } finally {
                          setManageSaving(false);
                        }
                      }}
                    >
                      <span>{manageSaving ? "Updating…" : "Reschedule this booking"}</span>
                      <Calendar className="w-4 h-4 text-white" />
                    </button>
                    <button
                      className="w-full px-4 py-2 rounded-lg border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={manageSaving}
                      onClick={async () => {
                        if (!manageBooking) return;
                        try {
                          setManageSaving(true);
                          setManageError(null);
                          const res = await fetch(
                            `/api/customer/bookings/${encodeURIComponent(
                              manageBooking.bookingId,
                            )}/cancel`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                            },
                          );
                          if (!res.ok) {
                            const body = (await res.json().catch(() => null)) as
                              | { error?: string }
                              | null;
                            throw new Error(
                              body?.error ||
                                "We could not cancel this booking. Please try again.",
                            );
                          }
                          setBookings((prev) =>
                            prev.map((b) =>
                              b.id === manageBooking.bookingId
                                ? { ...b, status: "cancelled" as BookingStatus }
                                : b,
                            ),
                          );
                          setManageBooking(null);
                        } catch (err) {
                          console.error("Failed to cancel booking", err);
                          setManageError(
                            err instanceof Error
                              ? err.message
                              : "We could not cancel this booking. Please try again.",
                          );
                        } finally {
                          setManageSaving(false);
                        }
                      }}
                    >
                      <span>{manageSaving ? "Cancelling…" : "Cancel this booking"}</span>
                      <AlertCircle className="w-4 h-4" />
                    </button>
                    <div className="h-4 text-[11px] text-rose-600">
                      {manageError ? manageError : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-[11px] text-slate-500">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-2">
                    <p className="font-semibold text-slate-700 text-xs">
                      How changes & cancellations work
                    </p>
                    <p>
                      Free changes up to 24 hours before your scheduled clean. After that, a
                      late-change fee may apply.
                    </p>
                    <p>
                      If you&apos;re moving the booking to a different day or changing the
                      service type, pricing may update automatically based on your new plan.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2">
                    <p className="font-semibold text-slate-700 text-xs">
                      Current booking snapshot
                    </p>
                    <p>
                      <span className="font-semibold">Service:</span> {manageBooking.service}
                    </p>
                    <p>
                      <span className="font-semibold">When:</span> {manageBooking.date} ·{" "}
                      {manageBooking.time || "Time to be confirmed"}
                    </p>
                    <p>
                      <span className="font-semibold">Address:</span> {manageBooking.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : detailsBooking ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="space-y-1">
                  <button
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
                    onClick={() => setDetailsBooking(null)}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to bookings
                  </button>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Upcoming clean
                  </p>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 lowercase first-letter:uppercase">
                    {detailsBooking.service || "standard clean"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      {detailsBooking.date} · {detailsBooking.time}
                    </span>
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 capitalize">
                    {String(detailsBooking.status || "").toLowerCase()}
                  </span>
                  <p className="text-lg font-black text-slate-900">{detailsBooking.price}</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
                <div className="space-y-5">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-3">
                      What you booked
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Date & time
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>{detailsBooking.date}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>{detailsBooking.time || "Time to be confirmed"}</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Address
                        </p>
                        <p className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 w-3.5 h-3.5 text-blue-500" />
                          <span>
                            {detailsBooking.location ||
                              "Address will be confirmed with our team."}
                          </span>
                        </p>
                      </div>
                      {(detailsBooking.bedrooms != null || detailsBooking.bathrooms != null || detailsBooking.extraRooms != null) && (
                        <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1 border-t border-slate-100">
                          {detailsBooking.bedrooms != null && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Bedrooms
                              </p>
                              <p className="text-slate-700 font-medium">{detailsBooking.bedrooms}</p>
                            </div>
                          )}
                          {detailsBooking.bathrooms != null && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Bathrooms
                              </p>
                              <p className="text-slate-700 font-medium">{detailsBooking.bathrooms}</p>
                            </div>
                          )}
                          {detailsBooking.extraRooms != null && detailsBooking.extraRooms > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Extra rooms
                              </p>
                              <p className="text-slate-700 font-medium">{detailsBooking.extraRooms}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {(detailsBooking.notes || (detailsBooking.extras && detailsBooking.extras.length > 0)) && (
                    <div className="space-y-2 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-700">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Notes & extras
                      </p>
                      {detailsBooking.notes ? (
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 mb-0.5">Instructions</p>
                          <p className="text-slate-700 whitespace-pre-wrap">{detailsBooking.notes}</p>
                        </div>
                      ) : null}
                      {detailsBooking.extras && detailsBooking.extras.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 mb-1">Extras</p>
                          <ul className="flex flex-wrap gap-1.5">
                            {detailsBooking.extras.map((extra) => (
                              <li
                                key={extra}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-medium"
                              >
                                {extra}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="space-y-2 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Service overview
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        <Sparkles className="w-3 h-3" />
                        Premium clean
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {detailsBooking.service || "Standard home clean"} with a trusted Shalean
                      Pro.
                    </p>
                    <ul className="mt-1 space-y-1.5 text-[11px] text-slate-500">
                      <li className="flex items-start gap-1.5">
                        <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Dusting and wiping of surfaces</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Floors vacuumed and mopped</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Bathrooms and kitchen refreshed</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                        {detailsBooking.cleaner
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Your Shalean Pro
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {detailsBooking.cleaner}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Fully vetted and covered by our quality guarantee.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600 mb-1">
                        Before we arrive
                      </p>
                      <p className="text-[11px] text-amber-800">
                        Please ensure access instructions and parking details are up to date.
                        You can share extra notes from the manage booking screen.
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-[11px] text-slate-500">
                    <p>
                      Booking reference{" "}
                      <span className="font-semibold text-slate-800">
                        {detailsBooking.id}
                      </span>
                      . A receipt will be emailed to you once this clean is completed.
                    </p>
                    <p>
                      Need help? Reply to any email from us or message your pro directly from the
                      upcoming tab.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-[11px] text-slate-400">
                  Need to change anything? You can reschedule, update the address, or cancel this
                  clean up to 24 hours before the start time.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setDetailsBooking(null)}
                  >
                    Back to bookings
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm"
                    onClick={() => {
                      if (!detailsBooking) return;
                      setManageError(null);
                      setManageDate("");
                      setManageTime("");
                      setManageAddress(detailsBooking.location || "");
                      setManageService(detailsBooking.service || "");
                      setManageBooking(detailsBooking);
                      setDetailsBooking(null);
                    }}
                  >
                    Manage booking
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "upcoming" &&
                (loadingBookings ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                    <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                      Loading your upcoming cleans…
                    </p>
                  </div>
                ) : upcomingCards.length > 0 ? (
                  upcomingCards.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      type="upcoming"
                      onRescheduleOrCancel={(b) => {
                        setManageBooking(b);
                        setManageError(null);
                        setManageDate("");
                        setManageTime("");
                        setManageAddress(b.location || "");
                        setManageService(b.service || "");
                      }}
                      onViewDetails={(b) => setDetailsBooking(b)}
                      onMessagePro={(b) => {
                        setMessageBooking(b);
                        setMessageText("");
                        setMessageError(null);
                      }}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-900">No upcoming cleans</h3>
                    <p className="text-slate-500 text-sm mb-6">
                      Need a professional to sparkle your home?
                    </p>
                    <button
                      onClick={onBookNew}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all"
                    >
                      Book Now
                    </button>
                  </div>
                ))}

              {activeTab === "history" &&
                (loadingBookings ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                    <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Loading your past bookings…</p>
                  </div>
                ) : pastCards.length > 0 ? (
                  pastCards.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      type="history"
                      onViewDetails={(b) => setDetailsBooking(b)}
                      onRate={(b) => {
                        setRatingBooking(b);
                        setRatingValue(b.rating || 5);
                        setRatingComment("");
                        setRatingError(null);
                      }}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-900">No past bookings yet</h3>
                    <p className="text-slate-500 text-sm mb-6">
                      Once you&apos;ve completed a clean, it will show here.
                    </p>
                  </div>
                ))}

          {activeTab === "wallet" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Billing Summary
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        Your Shalean Wallet
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      Auto-billing active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1">
                        Next Payment
                      </p>
                      <p className="text-xl font-black text-slate-900 mb-1">
                        {nextPayment ? nextPayment.amount : "R0"}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {nextPayment
                          ? `${nextPayment.dateLabel}${
                              nextPayment.time ? `, ${nextPayment.time}` : ""
                            }`
                          : "No upcoming payments"}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1">
                        This Month
                      </p>
                      <p className="text-xl font-black text-slate-900 mb-1">
                        {formatCurrency(monthlySummary.total || 0)}
                      </p>
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3 rotate-180" />
                        {monthlySummary.count} clean
                        {monthlySummary.count === 1 ? "" : "s"} completed
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1">
                        Credits & Rewards
                      </p>
                      <p className="text-xl font-black text-emerald-600 mb-1">
                        {walletLoading ? "…" : walletBalanceFormatted}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400" />
                        Refer friends to earn R100 credit
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-xl divide-y divide-slate-100">
                    {invoices.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">
                        You don&apos;t have any completed invoices yet. Once a clean is
                        completed, you&apos;ll see the invoice here.
                      </div>
                    ) : (
                      invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-4 bg-white"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <Receipt className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">
                                {invoice.service}
                              </p>
                              <p className="text-xs text-slate-500">
                                {invoice.id} · {invoice.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900">
                                {invoice.amount}
                              </p>
                              <p className="text-[11px] font-semibold text-emerald-600">
                                {invoice.status}
                              </p>
                            </div>
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                              <Download className="w-3 h-3" />
                              Invoice
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Primary Card
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            Visa ending 3942
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        Default
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <span>Expires 08/27</span>
                      <span>Last charged 12 May</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Update Card
                      </button>
                      <button className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Add New
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">
                        Smart cancellations
                      </p>
                      <p className="text-xs text-slate-500 mb-2">
                        You can cancel free of charge up to 24 hours before your
                        scheduled clean.
                      </p>
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        View billing policy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Logged in as
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {customerEmail || "Customer"}
                        </p>
                      </div>
                    </div>
                    <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600">
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out of all devices
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Full name
                      </label>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 bg-slate-50"
                        value={profile?.name ?? ""}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...(prev ?? {
                              name: "",
                              email: session?.user?.email ?? null,
                              phone: "",
                              preferred_contact_method: null,
                              timezone: null,
                              address_line1: "",
                              address_city: "",
                              address_region: "",
                              address_postal_code: "",
                            }),
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Email
                      </label>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                        readOnly
                        value={profile?.email ?? session?.user?.email ?? ""}
                        aria-label="Account email (read-only)"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Account email cannot be changed here.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Mobile number
                      </label>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                        value={profile?.phone ?? ""}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...(prev ?? {
                              name: "",
                              email: session?.user?.email ?? null,
                              phone: "",
                              preferred_contact_method: null,
                              timezone: null,
                              address_line1: "",
                              address_city: "",
                              address_region: "",
                              address_postal_code: "",
                            }),
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Preferred contact method
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                        value={profile?.preferred_contact_method ?? ""}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...(prev ?? {
                              name: "",
                              email: session?.user?.email ?? null,
                              phone: "",
                              preferred_contact_method: null,
                              timezone: null,
                              address_line1: "",
                              address_city: "",
                              address_region: "",
                              address_postal_code: "",
                            }),
                            preferred_contact_method: e.target.value || null,
                          }))
                        }
                      >
                        <option value="">Select…</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Timezone
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                        value={profile?.timezone ?? "Africa/Johannesburg"}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...(prev ?? {
                              name: "",
                              email: session?.user?.email ?? null,
                              phone: "",
                              preferred_contact_method: null,
                              timezone: null,
                              address_line1: null,
                              address_city: null,
                              address_region: null,
                              address_postal_code: null,
                            }),
                            timezone: e.target.value,
                          }))
                        }
                      >
                        <option value="Africa/Johannesburg">
                          South Africa (GMT+2)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 mb-3">
                      Address
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Street address
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 bg-slate-50"
                          placeholder="e.g. 12 Beach Rd"
                          value={profile?.address_line1 ?? ""}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...(prev ?? {
                                name: "",
                                email: session?.user?.email ?? null,
                                phone: "",
                                preferred_contact_method: null,
                                timezone: null,
                                address_line1: null,
                                address_city: null,
                                address_region: null,
                                address_postal_code: null,
                              }),
                              address_line1: e.target.value || null,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Suburb / Region
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 bg-slate-50"
                          placeholder="e.g. Sea Point"
                          value={profile?.address_region ?? ""}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...(prev ?? {
                                name: "",
                                email: session?.user?.email ?? null,
                                phone: "",
                                preferred_contact_method: null,
                                timezone: null,
                                address_line1: null,
                                address_city: null,
                                address_region: null,
                                address_postal_code: null,
                              }),
                              address_region: e.target.value || null,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          City
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 bg-slate-50"
                          placeholder="e.g. Cape Town"
                          value={profile?.address_city ?? ""}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...(prev ?? {
                                name: "",
                                email: session?.user?.email ?? null,
                                phone: "",
                                preferred_contact_method: null,
                                timezone: null,
                                address_line1: null,
                                address_city: null,
                                address_region: null,
                                address_postal_code: null,
                              }),
                              address_city: e.target.value || null,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Postal code
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 bg-slate-50"
                          placeholder="e.g. 8005"
                          value={profile?.address_postal_code ?? ""}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...(prev ?? {
                                name: "",
                                email: session?.user?.email ?? null,
                                phone: "",
                                preferred_contact_method: null,
                                timezone: null,
                                address_line1: null,
                                address_city: null,
                                address_region: null,
                                address_postal_code: null,
                              }),
                              address_postal_code: e.target.value || null,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="text-xs text-rose-600 h-4">
                      {profileError ? profileError : null}
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      disabled={profileSaving}
                      onClick={async () => {
                        setProfileError(null);
                        try {
                          const res = await fetch("/api/customer/profile", {
                            credentials: "include",
                          });
                          if (!res.ok) return;
                          const body = (await res.json()) as {
                            profile?: CustomerProfile;
                          };
                          if (body.profile) setProfile(body.profile);
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={profileSaving}
                      onClick={async () => {
                        if (!profile) return;
                        try {
                          setProfileSaving(true);
                          setProfileError(null);
                          const res = await fetch("/api/customer/profile", {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              name: profile.name,
                              phone: profile.phone,
                              preferred_contact_method:
                                profile.preferred_contact_method,
                              timezone: profile.timezone,
                              address_line1: profile.address_line1 ?? undefined,
                              address_city: profile.address_city ?? undefined,
                              address_region: profile.address_region ?? undefined,
                              address_postal_code:
                                profile.address_postal_code ?? undefined,
                            }),
                          });
                          if (!res.ok) {
                            const body = (await res.json().catch(() => null)) as
                              | { error?: string }
                              | null;
                            throw new Error(body?.error || "Failed to save profile");
                          }
                          const body = (await res.json()) as {
                            profile?: CustomerProfile;
                          };
                          if (body.profile) {
                            setProfile(body.profile);
                          }
                        } catch (err) {
                          console.error("Failed to save customer profile", err);
                          setProfileError(
                            "We could not save your changes. Please try again.",
                          );
                        } finally {
                          setProfileSaving(false);
                        }
                      }}
                    >
                      {profileSaving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Home Details
                      </p>
                      <h3 className="text-sm font-bold text-slate-900">
                        Where we clean for you
                      </h3>
                    </div>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                      Add another address
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <Home className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Primary Home
                        </p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                          Default
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        {[
                          profile?.address_line1,
                          profile?.address_region,
                          profile?.address_city,
                          profile?.address_postal_code,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                          "Add your address in Profile Settings above."}
                      </p>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          2 bedrooms · 2 bathrooms
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          Preferred: Weekdays · 09:00–12:00
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Notifications
                  </p>
                  <div className="space-y-3 text-sm">
                    <label className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Booking reminders
                        </p>
                        <p className="text-xs text-slate-500">
                          Get notified 24 hours and 2 hours before each clean.
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="mt-1" />
                    </label>
                    <label className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Cleaner status updates
                        </p>
                        <p className="text-xs text-slate-500">
                          When your cleaner is on the way, arrived, or
                          finished.
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="mt-1" />
                    </label>
                    <label className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Offers & rewards
                        </p>
                        <p className="text-xs text-slate-500">
                          Occasional promotions and referral bonuses.
                        </p>
                      </div>
                      <input type="checkbox" className="mt-1" />
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">
                        Account safety
                      </p>
                      <p className="text-xs text-slate-500 mb-3">
                        Your data is encrypted and only used to keep your home
                        sparkling on schedule.
                      </p>
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Manage privacy & data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
        )}
        </div>
      </main>
      <AnimatePresence>
        {ratingBooking && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[80vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Rate your clean
                  </p>
                  <h3 className="text-lg font-bold text-slate-900">
                    {ratingBooking.service}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ratingBooking.date} · {ratingBooking.time}
                  </p>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-600"
                  onClick={() => {
                    setRatingBooking(null);
                    setRatingError(null);
                  }}
                >
                  ×
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="focus:outline-none"
                    onClick={() => setRatingValue(value)}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        value <= ratingValue
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Tell us more (optional)
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 min-h-[80px]"
                placeholder="What did you love? Anything we can improve?"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              />

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs text-rose-600 h-4">
                  {ratingError ? ratingError : null}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setRatingBooking(null);
                      setRatingError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={ratingSaving}
                    onClick={async () => {
                      if (!ratingBooking) return;
                      try {
                        setRatingSaving(true);
                        setRatingError(null);
                        const res = await fetch("/api/customer/ratings", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            bookingId: ratingBooking.bookingId,
                            rating: ratingValue,
                            comment: ratingComment,
                          }),
                        });
                        if (!res.ok) {
                          const body = (await res.json().catch(() => null)) as
                            | { error?: string }
                            | null;
                          throw new Error(
                            body?.error || "We could not save your rating.",
                          );
                        }
                        setBookings((prev) =>
                          prev.map((b) =>
                            b.id === ratingBooking.bookingId
                              ? {
                                  ...b,
                                  customerRating: ratingValue,
                                  customerComment: ratingComment || b.customerComment,
                                }
                              : b,
                          ),
                        );
                        setRatingBooking(null);
                      } catch (err) {
                        console.error("Failed to save rating", err);
                        setRatingError(
                          err instanceof Error
                            ? err.message
                            : "We could not save your rating. Please try again.",
                        );
                      } finally {
                        setRatingSaving(false);
                      }
                    }}
                  >
                    {ratingSaving ? "Submitting..." : "Submit rating"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {messageBooking && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[80vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Message your pro
                  </p>
                  <h3 className="text-lg font-bold text-slate-900">
                    {messageBooking.service}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {messageBooking.date} · {messageBooking.time}
                  </p>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-600"
                  onClick={() => {
                    setMessageBooking(null);
                    setMessageError(null);
                    setMessageText("");
                  }}
                >
                  ×
                </button>
              </div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Your message
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 min-h-[100px]"
                placeholder="Ask about access, parking, special instructions, or anything else you need."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <div className="mt-3 h-4 text-[11px] text-rose-600">
                {messageError ? messageError : null}
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setMessageBooking(null);
                    setMessageError(null);
                    setMessageText("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={messageSaving || !messageText.trim()}
                  onClick={async () => {
                    if (!messageBooking || !messageText.trim()) return;
                    try {
                      setMessageSaving(true);
                      setMessageError(null);
                      const res = await fetch("/api/customer/messages", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          bookingId: messageBooking.bookingId,
                          message: messageText.trim(),
                        }),
                      });
                      if (!res.ok) {
                        const body = (await res.json().catch(() => null)) as
                          | { error?: string }
                          | null;
                        throw new Error(
                          body?.error || "We could not send your message. Please try again.",
                        );
                      }
                      setMessageBooking(null);
                      setMessageText("");
                    } catch (err) {
                      console.error("Failed to send message", err);
                      setMessageError(
                        err instanceof Error
                          ? err.message
                          : "We could not send your message. Please try again.",
                      );
                    } finally {
                      setMessageSaving(false);
                    }
                  }}
                >
                  {messageSaving ? "Sending…" : "Send message"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


