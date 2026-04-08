 "use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
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
  Bell,
  History,
  XCircle,
  Banknote,
  Loader2,
  Building2,
  Save,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatEstimatedDuration } from "@/lib/duration";

type CleanerTab = "today" | "schedule" | "earnings" | "history" | "chat" | "account";

type BookingDetails = {
  bedrooms: number | null;
  bathrooms: number | null;
  extraRooms: number | null;
  propertyType: string | null;
  officeSize: string | null;
  privateOffices: number | null;
  meetingRooms: number | null;
  carpetedRooms: number | null;
  looseRugs: number | null;
  carpetExtraCleaners: number | null;
  extras: string[];
  instructions: string | null;
  apartmentUnit: string | null;
};

type ApiJob = {
  id: string;
  customer: string;
  address: string | null;
  time: string;
  service: string;
  status: string | null;
  totalAmount: number;
  date: string;
  estimatedDurationMinutes?: number | null;
  cleanerRating?: number | null;
  bookingDetails?: BookingDetails;
};

type CleanerNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "job_assigned" | "job_confirmed" | "job_update" | "other";
};

type ScheduleDay = {
  date: string;
  dateLabel: string;
  jobs: ApiJob[];
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
  schedule: ScheduleDay[];
  earnings: {
    pendingPayout: number;
    recentDays: {
      date: string;
      total: number;
      jobs: number;
    }[];
  };
  history: {
    completed: ApiJob[];
    cancelled: ApiJob[];
  };
};

type JobStatus =
  | "assigned"
  | "on_my_way"
  | "arrived"
  | "in-progress"
  | "completed"
  | "cancelled";

type Job = {
  id: string;
  customer: string;
  address: string;
  time: string;
  service: string;
  duration: string;
  status: JobStatus;
  earnings: string;
  notes?: string;
  cleanerRating?: number | null;
  bookingDetails?: BookingDetails | null;
  /** Set for history jobs so we can sort by date */
  date?: string;
};

const STATUS_BUTTON_LABEL: Record<JobStatus, string | null> = {
  assigned: "On My Way",
  on_my_way: "Arrived",
  arrived: "Start Job",
  "in-progress": "Complete Job",
  completed: null,
  cancelled: null,
};

function getNextStatus(status: JobStatus): string | null {
  switch (status) {
    case "assigned":
      return "on_my_way";
    case "on_my_way":
      return "arrived";
    case "arrived":
      return "in_progress";
    case "in-progress":
      return "completed";
    default:
      return null;
  }
}

const openDirections = (address: string) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

const formatCurrency = (amount: number) =>
  `R${(amount ?? 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

/** Format a YYYY-MM-DD date for earnings list: Today, Yesterday, or "Wed, 14 Mar" */
function formatEarningsDate(dateStr: string): string {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  if (dateStr === todayIso) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Extra id → display label for cleaner booking details */
const EXTRA_LABELS: Record<string, string> = {
  fridge: "Inside Fridge",
  oven: "Inside Oven",
  windows: "Interior Windows",
  cabinets: "Inside Cabinets",
  walls: "Wall Spot Cleaning",
  extra_cleaner: "Extra Cleaner",
  equipment: "Equipment Request",
  laundry_load: "Laundry (per load)",
  ironing: "Ironing",
  linen_refresh: "Full linen change",
  guest_supplies: "Guest supplies restock",
  delicates: "Delicates",
  stain_treatment: "Stain treatment",
  balcony: "Balcony Cleaning",
  carpet_deep: "Carpet Cleaning",
  ceiling: "Ceiling Cleaning",
  couch: "Couch Cleaning",
  garage: "Garage Cleaning",
  mattress: "Mattress Cleaning",
  outside_windows: "Exterior Windows",
};

function formatBookingSummary(d: BookingDetails | null | undefined): string[] {
  if (!d) return [];
  const lines: string[] = [];
  const pt = (d.propertyType ?? "").toLowerCase();
  const svc = ""; // service could be passed if needed for context

  if (pt === "office") {
    const size = d.officeSize ? ` (${d.officeSize})` : "";
    lines.push(`Office${size}`);
    if ((d.privateOffices ?? 0) > 0) lines.push(`${d.privateOffices} private office(s)`);
    if ((d.meetingRooms ?? 0) > 0) lines.push(`${d.meetingRooms} meeting room(s)`);
  } else if (pt === "apartment" || pt === "house" || !pt) {
    const beds = d.bedrooms ?? 0;
    const baths = d.bathrooms ?? 0;
    const extra = d.extraRooms ?? 0;
    const parts = [];
    if (beds > 0) parts.push(`${beds} bedroom(s)`);
    if (baths > 0) parts.push(`${baths} bathroom(s)`);
    if (extra > 0) parts.push(`${extra} extra room(s)`);
    if (parts.length) lines.push(parts.join(", "));
  }

  if ((d.carpetedRooms ?? 0) > 0 || (d.looseRugs ?? 0) > 0) {
    const carpetParts = [];
    if ((d.carpetedRooms ?? 0) > 0) carpetParts.push(`${d.carpetedRooms} carpeted room(s)`);
    if ((d.looseRugs ?? 0) > 0) carpetParts.push(`${d.looseRugs} loose rug(s)`);
    if (carpetParts.length) lines.push(carpetParts.join(", "));
  }
  if (d.apartmentUnit?.trim()) {
    lines.push(`Unit: ${d.apartmentUnit.trim()}`);
  }
  return lines;
}

type JobCardProps = {
  job: Job;
  onCardClick: () => void;
  onDirections: () => void;
  onStatusUpdate: () => void;
  onRateCustomer?: () => void;
  startJobLoading?: boolean;
};

const JobCard = ({
  job,
  onCardClick,
  onDirections,
  onStatusUpdate,
  onRateCustomer,
  startJobLoading = false,
}: JobCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const actionLabel = STATUS_BUTTON_LABEL[job.status];
  const isCompleted = job.status === "completed";
  const isCancelled = job.status === "cancelled";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        onCardClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (!(e.target as HTMLElement).closest("button")) {
            e.preventDefault();
            onCardClick();
          }
        }
      }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4 cursor-pointer hover:border-slate-200 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="p-5 flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDirections();
            }}
            className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 active:scale-[0.98] transition-all"
          >
            <Navigation className="w-4 h-4" /> Directions
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
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
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  Service: {job.service}
                </p>
                {formatBookingSummary(job.bookingDetails).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">What you&apos;ll do</p>
                    <ul className="text-sm text-slate-700 space-y-0.5">
                      {formatBookingSummary(job.bookingDetails).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {job.bookingDetails?.extras?.length ? (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Add-ons</p>
                    <ul className="text-sm text-slate-700 list-disc list-inside space-y-0.5">
                      {job.bookingDetails.extras.map((id) => (
                        <li key={id}>{EXTRA_LABELS[id] ?? id}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {(job.bookingDetails?.instructions?.trim() || job.notes) && (
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{job.bookingDetails?.instructions?.trim() || job.notes}&rdquo;
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {actionLabel && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate();
            }}
            disabled={startJobLoading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {startJobLoading ? "Updating…" : actionLabel}
          </button>
        )}
        {isCancelled && (
          <div className="w-full bg-slate-100 text-slate-500 py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
            <XCircle className="w-4 h-4" /> Cancelled
          </div>
        )}
        {isCompleted && (
          <div className="space-y-2">
            <div className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Completed
            </div>
            {onRateCustomer &&
              (job.cleanerRating != null ? (
                <div className="flex items-center justify-center gap-1 py-2 text-amber-500">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i <= (job.cleanerRating ?? 0) ? "fill-current" : ""}`}
                    />
                  ))}
                  <span className="text-xs font-semibold text-slate-500 ml-1">Rated</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRateCustomer();
                  }}
                  className="w-full bg-amber-50 text-amber-700 py-3 rounded-xl font-bold text-sm border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  Rate customer
                </button>
              ))}
          </div>
        )}
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
  const [notifications, setNotifications] = useState<CleanerNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [startJobLoadingId, setStartJobLoadingId] = useState<string | null>(null);
  const [ratingJob, setRatingJob] = useState<Job | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  type HistoryFilter = "all" | "completed" | "cancelled";
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [cashOutModalOpen, setCashOutModalOpen] = useState(false);
  const [cashOutLoading, setCashOutLoading] = useState(false);
  const [cashOutError, setCashOutError] = useState<string | null>(null);
  const [messageJob, setMessageJob] = useState<Job | null>(null);
  type MessageItem = {
    id: string;
    senderType: "customer" | "cleaner";
    body: string;
    createdAt: string;
    status?: "sent" | "delivered" | "read";
    deliveredAt?: string | null;
    readAt?: string | null;
  };
  const [messageList, setMessageList] = useState<MessageItem[]>([]);
  const [messageListLoading, setMessageListLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSaving, setMessageSaving] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  type CleanerProfile = {
    name: string | null;
    email: string | null;
    phone: string | null;
    bank_account_holder: string | null;
    bank_account_number: string | null;
    bank_branch_code: string | null;
    bank_name: string | null;
    bank_account_type: string | null;
  };
  const [cleanerProfile, setCleanerProfile] = useState<CleanerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileEdit, setProfileEdit] = useState<CleanerProfile>({
    name: "",
    email: "",
    phone: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_branch_code: "",
    bank_name: "",
    bank_account_type: "",
  });

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

  useEffect(() => {
    if (status !== "authenticated" || activeTab !== "account") return;
    let cancelled = false;
    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const res = await fetch("/api/cleaner/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const json = (await res.json()) as { profile: CleanerProfile };
        if (!cancelled) {
          const p = json.profile;
          setCleanerProfile(p);
          setProfileEdit({
            name: p.name ?? "",
            email: p.email ?? "",
            phone: p.phone ?? "",
            bank_account_holder: p.bank_account_holder ?? "",
            bank_account_number: p.bank_account_number ?? "",
            bank_branch_code: p.bank_branch_code ?? "",
            bank_name: p.bank_name ?? "",
            bank_account_type: p.bank_account_type ?? "",
          });
        }
      } catch (err) {
        if (!cancelled) setProfileError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };
    loadProfile();
    return () => { cancelled = true; };
  }, [status, activeTab]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    const loadNotifications = async () => {
      setNotificationsLoading(true);
      setNotificationsError(null);
      try {
        const res = await fetch("/api/cleaner/notifications");
        if (!res.ok) throw new Error("Failed to load notifications");
        const data: { notifications?: CleanerNotification[] } = await res.json();
        if (!cancelled)
          setNotifications(
            (data.notifications ?? []).map((n) => ({ ...n, read: n.read ?? false }))
          );
      } catch (err) {
        if (!cancelled)
          setNotificationsError("We couldn't load notifications.");
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    };
    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (!messageJob?.id) {
      setMessageList([]);
      return;
    }
    let cancelled = false;
    setMessageListLoading(true);
    setMessageError(null);
    fetch(`/api/cleaner/messages?bookingId=${encodeURIComponent(messageJob.id)}&markRead=1`)
      .then((res) => (res.ok ? res.json() : Promise.resolve({ messages: [] })))
      .then((data: { messages?: MessageItem[] }) => {
        if (!cancelled && Array.isArray(data.messages)) {
          setMessageList(data.messages);
        }
      })
      .catch(() => {
        if (!cancelled) setMessageList([]);
      })
      .finally(() => {
        if (!cancelled) setMessageListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [messageJob?.id]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadList = notifications.filter((n) => !n.read);
  const [allNotificationsOpen, setAllNotificationsOpen] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null);
  const handleToggleNotifications = () => {
    setNotificationsOpen((open) => !open);
  };
  const handleMarkAllRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
  };
  const handleMarkOneRead = (id: string) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const loadDashboard = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cleaner/dashboard");
      if (!res.ok) throw new Error("Failed to load cleaner dashboard");
      const json = (await res.json()) as CleanerDashboardPayload;
      setPayload(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [status]);

  const handleStatusUpdate = useCallback(
    async (job: Job) => {
      const nextStatus = getNextStatus(job.status);
      if (!nextStatus) return;
      setStartJobLoadingId(job.id);
      try {
        const res = await fetch(`/api/cleaner/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || "Failed to update job");
        }
        await loadDashboard();
        setSelectedJob(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not update job");
      } finally {
        setStartJobLoadingId(null);
      }
    },
    [loadDashboard],
  );

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  const handleSavePersonal = useCallback(async () => {
    setProfileSaveError(null);
    setProfileSaveSuccess(false);
    setProfileSaveLoading(true);
    try {
      const res = await fetch("/api/cleaner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileEdit.name.trim() || undefined,
          phone: profileEdit.phone.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileSaveError((data as { error?: string }).error || "Failed to save");
        return;
      }
      setCleanerProfile((data as { profile: CleanerProfile }).profile);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
      await loadDashboard();
    } catch {
      setProfileSaveError("Could not save. Please try again.");
    } finally {
      setProfileSaveLoading(false);
    }
  }, [profileEdit.name, profileEdit.phone, loadDashboard]);

  const handleSaveBank = useCallback(async () => {
    setProfileSaveError(null);
    setProfileSaveSuccess(false);
    setProfileSaveLoading(true);
    try {
      const res = await fetch("/api/cleaner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: profileEdit.bank_name.trim() || undefined,
          bank_account_holder: profileEdit.bank_account_holder.trim() || undefined,
          bank_account_number: profileEdit.bank_account_number.trim().replace(/\s/g, "") || undefined,
          bank_branch_code: profileEdit.bank_branch_code.trim().replace(/\s/g, "") || undefined,
          bank_account_type: profileEdit.bank_account_type.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileSaveError((data as { error?: string }).error || "Failed to save");
        return;
      }
      setCleanerProfile((data as { profile: CleanerProfile }).profile);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch {
      setProfileSaveError("Could not save. Please try again.");
    } finally {
      setProfileSaveLoading(false);
    }
  }, [profileEdit.bank_name, profileEdit.bank_account_holder, profileEdit.bank_account_number, profileEdit.bank_branch_code, profileEdit.bank_account_type]);

  const sessionUser = data?.user as
    | (typeof data.user & { role?: string; phone?: string })
    | undefined;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading your cleaner session…</p>
      </div>
    );
  }

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

  const mapApiStatus = (s: string | null): JobStatus => {
    if (!s) return "assigned";
    const lower = s.toLowerCase();
    if (lower === "on_my_way") return "on_my_way";
    if (lower === "arrived") return "arrived";
    if (lower === "in_progress") return "in-progress";
    if (lower === "completed") return "completed";
    if (lower === "cancelled") return "cancelled";
    return "assigned";
  };

  const todayJobs: Job[] =
    payload?.today.jobs.map((j) => ({
      id: j.id,
      customer: j.customer,
      address: j.address || "Customer address",
      time: j.time,
      service: j.service || "Cleaning",
      duration: formatEstimatedDuration(j.estimatedDurationMinutes ?? 210),
      status: mapApiStatus(j.status),
      earnings: formatCurrency(j.totalAmount),
      notes: undefined,
      cleanerRating: j.cleanerRating ?? null,
      bookingDetails: j.bookingDetails ?? null,
    })) ?? [];

  const assignedCount = payload?.today.assignedCount ?? todayJobs.length;
  const pendingPayout = payload?.earnings.pendingPayout ?? 0;
  const recentDays = payload?.earnings.recentDays ?? [];

  const historyCompleted: Job[] =
    (payload?.history?.completed ?? []).map((j) => ({
      id: j.id,
      customer: j.customer,
      address: j.address ?? "Customer address",
      time: j.time,
      service: j.service ?? "Cleaning",
      duration: formatEstimatedDuration(j.estimatedDurationMinutes ?? 210),
      status: "completed" as const,
      earnings: formatCurrency(j.totalAmount),
      notes: undefined,
      cleanerRating: j.cleanerRating ?? null,
      bookingDetails: j.bookingDetails ?? null,
      date: j.date,
    })) ?? [];
  const historyCancelled: Job[] =
    (payload?.history?.cancelled ?? []).map((j) => ({
      id: j.id,
      customer: j.customer,
      address: j.address ?? "Customer address",
      time: j.time,
      service: j.service ?? "Cleaning",
      duration: formatEstimatedDuration(j.estimatedDurationMinutes ?? 210),
      status: "cancelled" as const,
      earnings: formatCurrency(j.totalAmount),
      notes: undefined,
      cleanerRating: null,
      bookingDetails: j.bookingDetails ?? null,
      date: j.date,
    })) ?? [];
  const historyJobs =
    historyFilter === "completed"
      ? historyCompleted
      : historyFilter === "cancelled"
        ? historyCancelled
        : [...historyCompleted, ...historyCancelled].sort((a, b) => {
            const d = (a.date ?? "").localeCompare(b.date ?? "");
            if (d !== 0) return -d;
            return -(a.time ?? "").localeCompare(b.time ?? "");
          });

  const firstName = displayName.split(" ")[0] ?? displayName;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      <header className="bg-white px-4 sm:px-6 pt-6 sm:pt-12 pb-4 sm:pb-6 sticky top-0 z-50 border-b border-slate-200">
        <div className="flex justify-between items-center gap-2 min-h-[44px]">
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className="flex items-center rounded-xl p-2 -m-2 sm:p-1 sm:-m-1 hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Home"
          >
            <Image
              src="/logo.png"
              alt="Shalean"
              width={40}
              height={40}
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0"
            />
          </button>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleNotifications}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-blue-600 relative rounded-full hover:bg-slate-100 transition-colors touch-manipulation"
                aria-label={
                  unreadNotifications
                    ? `You have ${unreadNotifications} unread notifications`
                    : "Notifications"
                }
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-2 right-2 sm:top-1 sm:right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-lg z-20">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      <p className="text-[11px] text-slate-400">
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
                      unreadList.length > 0 && (
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
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        Loading notifications…
                      </div>
                    ) : notificationsError ? (
                      <div className="px-4 py-6 text-center text-xs text-rose-500">
                        {notificationsError}
                      </div>
                    ) : unreadList.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        You&apos;re all caught up. No new notifications.
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {unreadList.map((notification) => (
                          <li
                            key={notification.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleMarkOneRead(notification.id)}
                            onKeyDown={(e) =>
                              (e.key === "Enter" || e.key === " ") &&
                              handleMarkOneRead(notification.id)
                            }
                            className="px-4 py-3 text-sm cursor-pointer hover:bg-slate-50/80 transition-colors bg-blue-50/60"
                          >
                            <p className="font-semibold text-slate-900 text-xs">
                              {notification.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {notification.description}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {notification.time}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100 flex flex-col gap-1 text-center">
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        setNotificationsOpen(false);
                        setAllNotificationsOpen(true);
                      }}
                    >
                      View all notifications
                    </button>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
            <Sheet open={allNotificationsOpen} onOpenChange={setAllNotificationsOpen}>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>All notifications</SheetTitle>
                  <SheetDescription>
                    Read and expand messages. Read items are hidden from the bell dropdown.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => {
                      const isExpanded = expandedNotificationId === n.id;
                      return (
                        <div
                          key={n.id + n.time}
                          className={`rounded-xl border transition-colors ${
                            n.read ? "border-slate-100 bg-slate-50/50" : "border-blue-100 bg-blue-50/40"
                          }`}
                        >
                          <button
                            type="button"
                            className="w-full px-4 py-3 text-left flex items-start gap-3"
                            onClick={() => {
                              setExpandedNotificationId((id) => (id === n.id ? null : n.id));
                              handleMarkOneRead(n.id);
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 text-xs">{n.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {isExpanded ? n.description : n.description.length > 100 ? `${n.description.slice(0, 100)}…` : n.description}
                              </p>
                              {!isExpanded && n.description.length > 100 && (
                                <span className="text-[11px] text-blue-600 font-medium mt-1 inline-block">Click to expand</span>
                              )}
                              <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                            </div>
                            <span className={`flex-shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <button
              type="button"
              onClick={handleLogout}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 hover:text-slate-600 transition-colors touch-manipulation"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 sm:mt-5 mb-4 sm:mb-6">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold border border-blue-200 text-sm flex-shrink-0">
            {displayName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
              Hello, <span className="sm:hidden">{firstName}</span><span className="hidden sm:inline">{displayName}</span>!
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-current flex-shrink-0" />
              <span className="text-xs font-bold text-slate-500">
                {rating ? rating.toFixed(1) : "New"} (
                {reviews === 1 ? "1 review" : `${reviews} reviews`})
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 sm:gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab("today")}
            className={`flex-1 py-2.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all touch-manipulation min-h-[44px] ${
              activeTab === "today"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 py-2.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all touch-manipulation min-h-[44px] ${
              activeTab === "schedule"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab("earnings")}
            className={`flex-1 py-2.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all touch-manipulation min-h-[44px] ${
              activeTab === "earnings"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Earnings
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all touch-manipulation min-h-[44px] ${
              activeTab === "history"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            History
          </button>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 sm:py-8">
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
              todayJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onCardClick={() => setSelectedJob(job)}
                  onDirections={() => openDirections(job.address)}
                  onStatusUpdate={() => handleStatusUpdate(job)}
                  onRateCustomer={
                    job.status === "completed"
                      ? () => {
                          setRatingJob(job);
                          setRatingValue(5);
                          setRatingComment("");
                          setRatingError(null);
                        }
                      : undefined
                  }
                  startJobLoading={startJobLoadingId === job.id}
                />
              ))
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
              <button
                type="button"
                onClick={() => setGuidelinesOpen(true)}
                className="w-full bg-white/20 py-2 rounded-lg text-xs font-bold backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
              >
                Read Full Guidelines
              </button>
            </div>
          </>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-8">
            <h2 className="text-xl font-black text-slate-900">
              Weekly Schedule
            </h2>
            {(payload?.schedule ?? []).length === 0 && !loading ? (
              <div className="text-center py-12 space-y-3">
                <Calendar className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="font-bold text-slate-900">No upcoming jobs</p>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                  You don’t have any bookings in the next 7 days. We’ll notify you when new jobs are assigned.
                </p>
              </div>
            ) : (
              (payload?.schedule ?? []).map((day) => (
                <div key={day.date} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                      {day.dateLabel}
                    </h3>
                    {day.jobs.length > 0 && (
                      <span className="text-xs font-semibold text-slate-400">
                        {day.jobs.length} {day.jobs.length === 1 ? "job" : "jobs"}
                      </span>
                    )}
                  </div>
                  {day.jobs.length === 0 ? (
                    <p className="text-slate-400 text-sm pl-6">No jobs</p>
                  ) : (
                    day.jobs.map((apiJob) => {
                      const job: Job = {
                        id: apiJob.id,
                        customer: apiJob.customer,
                        address: apiJob.address ?? "Customer address",
                        time: apiJob.time,
                        service: apiJob.service ?? "Cleaning",
                        duration: formatEstimatedDuration(apiJob.estimatedDurationMinutes ?? 210),
                        status: mapApiStatus(apiJob.status),
                        earnings: formatCurrency(apiJob.totalAmount),
                        notes: undefined,
                        cleanerRating: apiJob.cleanerRating ?? null,
                        bookingDetails: apiJob.bookingDetails ?? null,
                      };
                      return (
                        <JobCard
                          key={job.id}
                          job={job}
                          onCardClick={() => setSelectedJob(job)}
                          onDirections={() => openDirections(job.address)}
                          onStatusUpdate={() => handleStatusUpdate(job)}
                          onRateCustomer={
                            job.status === "completed"
                              ? () => {
                                  setRatingJob(job);
                                  setRatingValue(5);
                                  setRatingComment("");
                                  setRatingError(null);
                                }
                              : undefined
                          }
                          startJobLoading={startJobLoadingId === job.id}
                        />
                      );
                    })
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Available to withdraw
              </p>
              <h2 className="text-4xl font-black text-slate-900 mb-2">
                {formatCurrency(pendingPayout)}
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Normal payout: free, paid weekly to your bank account.
              </p>
              <button
                type="button"
                disabled={pendingPayout < 6 || cashOutLoading}
                onClick={() => {
                  setCashOutError(null);
                  setCashOutModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cashOutLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Banknote className="w-4 h-4" />
                )}
                Early cash out (R5 fee)
              </button>
              {pendingPayout > 0 && pendingPayout < 6 && (
                <p className="text-[10px] text-slate-400 mt-2">
                  Min R6 needed for early cash out (R5 fee).
                </p>
              )}
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
                    No recent earnings yet. Completed jobs will appear here.
                  </div>
                ) : (
                  recentDays.map((item, idx) => (
                    <div
                      key={`${item.date}-${idx}`}
                      className="p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {formatEarningsDate(item.date)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">
                          {item.jobs} {item.jobs === 1 ? "job" : "jobs"} completed
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

        {activeTab === "history" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">
              Past jobs
            </h2>
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(["all", "completed", "cancelled"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setHistoryFilter(filter)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all capitalize ${
                    historyFilter === filter
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {filter === "all" ? "All" : filter === "completed" ? "Completed" : "Cancelled"}
                </button>
              ))}
            </div>
            {historyJobs.length === 0 && !loading ? (
              <div className="text-center py-12 space-y-3">
                <History className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="font-bold text-slate-900">
                  No {historyFilter === "all" ? "past" : historyFilter} jobs
                </p>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                  {historyFilter === "all"
                    ? "Completed and cancelled bookings will appear here (last 100)."
                    : historyFilter === "completed"
                      ? "Completed jobs will appear here."
                      : "Cancelled jobs will appear here."}
                </p>
              </div>
            ) : (
              historyJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onCardClick={() => setSelectedJob(job)}
                  onDirections={() => openDirections(job.address)}
                  onStatusUpdate={() => {}}
                  onRateCustomer={
                    job.status === "completed"
                      ? () => {
                          setRatingJob(job);
                          setRatingValue(5);
                          setRatingComment("");
                          setRatingError(null);
                        }
                      : undefined
                  }
                />
              ))
            )}
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

        {activeTab === "account" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900">
              Profile &amp; account
            </h2>
            {profileLoading ? (
              <div className="py-8 text-center text-slate-500 text-sm">Loading profile…</div>
            ) : profileError ? (
              <div className="py-4 px-4 rounded-xl bg-rose-50 text-rose-700 text-sm">{profileError}</div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl border border-blue-200 flex-shrink-0">
                      {(cleanerProfile?.name || displayName)
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-lg truncate">
                        {cleanerProfile?.name || displayName}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-amber-400 fill-current flex-shrink-0" />
                        <span className="text-sm font-bold text-slate-600">
                          {rating != null ? `${rating.toFixed(1)} (${reviews} ${reviews === 1 ? "review" : "reviews"})` : "New cleaner"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {payload?.cleaner.jobsCompleted ?? 0} jobs completed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-sm">Personal details</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Update your name and phone.</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full name</label>
                      <input
                        type="text"
                        value={profileEdit.name}
                        onChange={(e) => setProfileEdit((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                      <p className="text-slate-600 text-sm py-2">{cleanerProfile?.email || sessionUser?.email || "—"}</p>
                      <p className="text-[10px] text-slate-400">Email is managed by your login account and cannot be changed here.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                      <input
                        type="tel"
                        value={profileEdit.phone}
                        onChange={(e) => setProfileEdit((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. 0821234567"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={profileSaveLoading}
                      onClick={handleSavePersonal}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-70 transition-colors"
                    >
                      {profileSaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save personal details
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Bank account</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Payouts are sent to this account. Keep details up to date.</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bank name</label>
                      <input
                        type="text"
                        value={profileEdit.bank_name}
                        onChange={(e) => setProfileEdit((prev) => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="e.g. FNB, Standard Bank, Nedbank"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account holder name</label>
                      <input
                        type="text"
                        value={profileEdit.bank_account_holder}
                        onChange={(e) => setProfileEdit((prev) => ({ ...prev, bank_account_holder: e.target.value }))}
                        placeholder="Name as on bank account"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account number</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={profileEdit.bank_account_number}
                        onChange={(e) => setProfileEdit((prev) => ({ ...prev, bank_account_number: e.target.value.replace(/\D/g, "") }))}
                        placeholder="Account number"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Branch code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={profileEdit.bank_branch_code}
                        onChange={(e) => setProfileEdit((prev) => ({ ...prev, bank_branch_code: e.target.value.replace(/\D/g, "") }))}
                        placeholder="6-digit branch / universal code"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account type</label>
                      <select
                        value={profileEdit.bank_account_type}
                        onChange={(e) => setProfileEdit((prev) => ({ ...prev, bank_account_type: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select type</option>
                        <option value="current">Current</option>
                        <option value="savings">Savings</option>
                        <option value="transmission">Transmission</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={profileSaveLoading}
                      onClick={handleSaveBank}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-70 transition-colors"
                    >
                      {profileSaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save bank details
                    </button>
                  </div>
                </div>

                {profileSaveError && (
                  <p className="text-sm text-rose-600 px-2">{profileSaveError}</p>
                )}
                {profileSaveSuccess && (
                  <p className="text-sm text-blue-600 px-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Saved successfully.
                  </p>
                )}

                <div className="p-6 bg-blue-600 rounded-2xl text-white shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className="w-6 h-6 text-blue-200" />
                    <h3 className="font-bold">Cleaner Safety Protocol</h3>
                  </div>
                  <p className="text-blue-100 text-sm leading-relaxed mb-4">
                    Wear your Shalean ID badge at all times and log start/end times for accurate payments.
                  </p>
                  <button
                    type="button"
                    onClick={() => setGuidelinesOpen(true)}
                    className="w-full bg-white/20 py-2 rounded-lg text-xs font-bold backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
                  >
                    Read Full Guidelines
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* Job detail modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <h3 className="font-bold text-slate-900 text-lg">Job details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</p>
                  <p className="font-bold text-slate-900">{selectedJob.customer}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time & duration</p>
                  <p className="text-slate-700">{selectedJob.time} ({selectedJob.duration})</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</p>
                  <p className="text-slate-700">{selectedJob.address}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service</p>
                  <p className="text-slate-700">{selectedJob.service}</p>
                </div>
                {(formatBookingSummary(selectedJob.bookingDetails).length > 0 ||
                  (selectedJob.bookingDetails?.extras?.length ?? 0) > 0 ||
                  selectedJob.bookingDetails?.instructions?.trim()) && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">What the customer booked</p>
                    {formatBookingSummary(selectedJob.bookingDetails).length > 0 && (
                      <ul className="text-sm text-slate-700 space-y-0.5">
                        {formatBookingSummary(selectedJob.bookingDetails).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    )}
                    {selectedJob.bookingDetails?.extras?.length ? (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Add-ons</p>
                        <ul className="text-sm text-slate-700 list-disc list-inside space-y-0.5">
                          {selectedJob.bookingDetails.extras.map((id) => (
                            <li key={id}>{EXTRA_LABELS[id] ?? id}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {selectedJob.bookingDetails?.instructions?.trim() && (
                      <p className="text-sm text-slate-700 leading-relaxed italic">
                        &ldquo;{selectedJob.bookingDetails.instructions.trim()}&rdquo;
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. earnings</p>
                  <p className="font-black text-slate-900 text-xl">{selectedJob.earnings}</p>
                </div>
                <div className="flex gap-2 pt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openDirections(selectedJob.address)}
                    className="flex-1 min-w-[120px] bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" /> Directions
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageJob(selectedJob);
                      setMessageText("");
                      setMessageError(null);
                    }}
                    className="flex-1 min-w-[120px] bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200"
                  >
                    <MessageSquare className="w-4 h-4" /> Message customer
                  </button>
                  {STATUS_BUTTON_LABEL[selectedJob.status] && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedJob)}
                      disabled={startJobLoadingId === selectedJob.id}
                      className="flex-1 min-w-[120px] bg-blue-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-70"
                    >
                      {startJobLoadingId === selectedJob.id ? "Updating…" : STATUS_BUTTON_LABEL[selectedJob.status]}
                    </button>
                  )}
                  {selectedJob.status === "completed" && selectedJob.cleanerRating == null && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJob(null);
                        setRatingJob(selectedJob);
                        setRatingValue(5);
                        setRatingComment("");
                        setRatingError(null);
                      }}
                      className="w-full bg-amber-50 text-amber-700 py-3 rounded-xl font-bold text-sm border border-amber-200"
                    >
                      Rate customer
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guidelines modal */}
      <AnimatePresence>
        {guidelinesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setGuidelinesOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900">Cleaner Safety Protocol</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setGuidelinesOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto text-sm text-slate-700">
                <p>Wear your Shalean ID badge at all times when on duty.</p>
                <p>Log your start and end times precisely for each job to ensure accurate payments.</p>
                <p>If you feel unsafe at any location, leave and report to Shalean immediately.</p>
                <p>Use only approved cleaning products; do not bring unapproved chemicals onto client premises.</p>
                <p>Keep customer information confidential and do not share addresses or contact details.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rate customer modal */}
      <AnimatePresence>
        {ratingJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setRatingJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Rate customer</h3>
                <button
                  type="button"
                  onClick={() => setRatingJob(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">
                  How was your experience with {ratingJob.customer}?
                </p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRatingValue(value)}
                      className={`p-2 rounded-lg transition-colors ${
                        value <= ratingValue
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      <Star
                        className={`w-6 h-6 ${value <= ratingValue ? "fill-current" : ""}`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Optional comment"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none h-20"
                  maxLength={500}
                />
                {ratingError && (
                  <p className="text-sm text-rose-500">{ratingError}</p>
                )}
                <button
                  type="button"
                  disabled={ratingSaving}
                  onClick={async () => {
                    if (!ratingJob) return;
                    setRatingSaving(true);
                    setRatingError(null);
                    try {
                      const res = await fetch("/api/cleaner/ratings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          bookingId: ratingJob.id,
                          rating: ratingValue,
                          comment: ratingComment || undefined,
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setRatingError((data as { error?: string }).error || "Failed to save rating");
                        return;
                      }
                      await loadDashboard();
                      setRatingJob(null);
                    } catch (err) {
                      setRatingError("Could not save rating. Please try again.");
                    } finally {
                      setRatingSaving(false);
                    }
                  }}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-70"
                >
                  {ratingSaving ? "Submitting…" : "Submit rating"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message customer modal */}
      <AnimatePresence>
        {messageJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setMessageJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Message customer
                  </p>
                  <h3 className="text-lg font-bold text-slate-900">{messageJob.customer}</h3>
                  <p className="text-xs text-slate-500">
                    {messageJob.service} · {messageJob.time}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMessageJob(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 flex flex-col gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden flex flex-col min-h-[180px] max-h-[280px]">
                  <div className="p-3 overflow-y-auto flex-1 space-y-2">
                    {messageListLoading ? (
                      <p className="text-sm text-slate-400 text-center py-4">Loading messages…</p>
                    ) : messageList.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No messages yet. Send one below.</p>
                    ) : (
                      messageList.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.senderType === "cleaner" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                              m.senderType === "cleaner"
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                            }`}
                          >
                            {m.senderType === "customer" && (
                              <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Customer</p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className={`text-[10px] mt-1 ${m.senderType === "cleaner" ? "text-blue-200" : "text-slate-400"}`}>
                              {m.createdAt
                                ? new Date(m.createdAt).toLocaleString("en-ZA", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </p>
                            {m.senderType === "cleaner" && (
                              <p className="text-[10px] mt-0.5 text-blue-200/90">
                                {m.status === "read" ? "Read" : m.status === "delivered" ? "Delivered" : "Sent"}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <label className="block text-xs font-semibold text-slate-500">Your reply</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 min-h-[80px]"
                  placeholder="Reply to the customer…"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <div className="h-4 text-[11px] text-rose-600">{messageError ?? null}</div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMessageJob(null)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={messageSaving || !messageText.trim()}
                    onClick={async () => {
                      if (!messageJob || !messageText.trim()) return;
                      const text = messageText.trim();
                      setMessageSaving(true);
                      setMessageError(null);
                      try {
                        const res = await fetch("/api/cleaner/messages", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ bookingId: messageJob.id, message: text }),
                        });
                        const data = (await res.json().catch(() => ({}))) as { error?: string; messageId?: string };
                        if (!res.ok) {
                          setMessageError(data.error || "Could not send message");
                          return;
                        }
                        setMessageList((prev) => [
                          ...prev,
                          {
                            id: data.messageId ?? `temp-${Date.now()}`,
                            senderType: "cleaner",
                            body: text,
                            createdAt: new Date().toISOString(),
                            status: "sent",
                          },
                        ]);
                        setMessageText("");
                        setTimeout(() => {
                          fetch(`/api/cleaner/messages?bookingId=${encodeURIComponent(messageJob.id)}`)
                            .then((r) => (r.ok ? r.json() : Promise.resolve({ messages: [] })))
                            .then((d: { messages?: MessageItem[] }) => {
                              if (Array.isArray(d.messages)) setMessageList(d.messages);
                            })
                            .catch(() => {});
                        }, 3000);
                      } catch {
                        setMessageError("Could not send message. Please try again.");
                      } finally {
                        setMessageSaving(false);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {messageSaving ? "Sending…" : "Send message"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Early cash out modal */}
      <AnimatePresence>
        {cashOutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
            onClick={() => !cashOutLoading && setCashOutModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Early cash out</h3>
                <button
                  type="button"
                  disabled={cashOutLoading}
                  onClick={() => setCashOutModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">
                  Cash out now for a <strong>R5 fee</strong>. You&apos;ll receive{" "}
                  <strong>{formatCurrency(Math.max(0, pendingPayout - 5))}</strong> paid to your
                  registered bank account.
                </p>
                <p className="text-xs text-slate-500">
                  Normal payout is free and processed weekly to your bank account.
                </p>
                {cashOutError && (
                  <p className="text-sm text-rose-500">{cashOutError}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={cashOutLoading}
                    onClick={() => setCashOutModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={cashOutLoading}
                    onClick={async () => {
                      setCashOutLoading(true);
                      setCashOutError(null);
                      try {
                        const res = await fetch("/api/cleaner/payout/request", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ type: "early" }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          setCashOutError((data as { error?: string }).error || "Request failed");
                          return;
                        }
                        setCashOutModalOpen(false);
                        await loadDashboard();
                      } catch (err) {
                        setCashOutError("Could not complete request. Please try again.");
                      } finally {
                        setCashOutLoading(false);
                      }
                    }}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-70"
                  >
                    {cashOutLoading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Requesting…
                      </span>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            onClick={() => {
              if (todayJobs.length > 0) {
                openDirections(todayJobs[0].address);
              }
            }}
            className="w-16 h-16 bg-blue-600 rounded-full shadow-xl border-4 border-slate-50 flex items-center justify-center text-white hover:bg-blue-700 active:scale-95 transition-all"
            aria-label="Directions to first job"
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
          onClick={() => setActiveTab("account")}
          className={`flex flex-col items-center gap-1 ${
            activeTab === "account" ? "text-blue-600" : "text-slate-400"
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

