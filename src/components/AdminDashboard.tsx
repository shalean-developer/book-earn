"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  Calendar,
  Star,
  Settings,
  Bell,
  Search,
  MoreVertical,
  UserCheck,
  BarChart2,
  X,
  LayoutDashboard,
  Menu,
  Sparkles,
} from "lucide-react";

type AdminTab = "overview" | "bookings" | "cleaners" | "customers" | "reviews" | "settings";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

type OverviewStats = {
  totalRevenue: number;
  activeBookings: number;
  newCustomersLast30Days: number;
  averageRating?: number | null;
};

type OverviewRecentBooking = {
  id: string;
  customer: string;
  service: string;
  cleaner: string | null;
  status: string | null;
  totalAmount: number;
  date: string;
  time: string;
};

type BookingsListBooking = OverviewRecentBooking;

type OverviewServiceDistributionItem = {
  label: string;
  value: number;
};

type OverviewResponse = {
  stats: OverviewStats;
  recentBookings: OverviewRecentBooking[];
  serviceDistribution: OverviewServiceDistributionItem[];
};

type AdminNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type?: "booking_created" | "booking_confirmed" | "booking_failed" | "other";
};

const formatBookingCode = (id: string) => {
  // Derive a stable 8‑digit numeric code from the raw ID
  let hash = 7;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000000;
  }
  const numericPart = Math.abs(hash).toString().padStart(8, "0").slice(-8);
  return `SC${numericPart}`;
};

type AdminCleaner = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  rating: number;
  jobs: number;
  status: string;
  specialty: string;
};

type CleanerDetailBooking = {
  id: string;
  customer: string;
  service: string;
  status: string | null;
  date: string;
  time: string;
  totalAmount: number;
};

type AdminCleanerDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  verification_status: string | null;
  working_areas: string[];
  unavailable_dates: string[];
  jobs: number;
  specialty: string;
  status: string;
  recentBookings: CleanerDetailBooking[];
};

type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalBookings: number;
  lifetimeValue: number;
  lastBooking: string | null;
  status: "new" | "vip" | "churn-risk" | "active" | string;
};

type AdminCustomerDetail = {
  customer: {
    name: string;
    email: string;
    phone: string | null;
    totalBookings: number;
    lifetimeValue: number;
    lastBooking: string | null;
  };
  bookings: Array<{
    id: string;
    reference: string;
    service: string;
    status: string | null;
    totalAmount: number;
    currency: string | null;
    date: string;
    time: string;
    address: string | null;
    createdAt: string | null;
  }>;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

type AdminReview = {
  id: string;
  customer: string;
  cleaner: string;
  rating: number;
  comment: string;
  date: string;
  status: string;
};

const StatCard = ({ title, value, change, trend, icon }: StatCardProps) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">{icon}</div>
      <span
        className={`text-xs font-bold px-2 py-1 rounded-full ${
          trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        }`}
      >
        {change}
      </span>
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

const Badge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    upcoming: "bg-blue-50 text-blue-600",
    completed: "bg-emerald-50 text-emerald-600",
    cancelled: "bg-rose-50 text-rose-600",
    active: "bg-emerald-50 text-emerald-600",
    "on-leave": "bg-amber-50 text-amber-600",
    pending: "bg-amber-50 text-amber-600",
    confirmed: "bg-blue-50 text-blue-600",
    failed: "bg-rose-50 text-rose-600",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        styles[status] || "bg-slate-50 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
};

export const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [revenueRange, setRevenueRange] = useState<"7d" | "30d">("7d");
  const [recentBookingsPage, setRecentBookingsPage] = useState(1);
  const [openBookingActionsId, setOpenBookingActionsId] = useState<string | null>(null);
  const [activeDialog, setActiveDialog] = useState<{
    type: "view" | "complete" | "cancel" | null;
    bookingId: string | null;
  }>({ type: null, bookingId: null });
  const [fullBooking, setFullBooking] = useState<unknown | null>(null);
  const [fullBookingLoading, setFullBookingLoading] = useState(false);
  const [fullBookingError, setFullBookingError] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [bookingsList, setBookingsList] = useState<BookingsListBooking[]>([]);
  const [bookingsListLoading, setBookingsListLoading] = useState(false);
  const [bookingsListError, setBookingsListError] = useState<string | null>(null);
  const [bookingsStatusFilter, setBookingsStatusFilter] = useState<string>("");
  const [bookingsServiceFilter, setBookingsServiceFilter] = useState<string>("");
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsPageSize, setBookingsPageSize] = useState(10);
  const [bookingsPagination, setBookingsPagination] = useState<{
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  } | null>(null);
  const [cleanersList, setCleanersList] = useState<AdminCleaner[]>([]);
  const [cleanersLoading, setCleanersLoading] = useState(false);
  const [cleanersError, setCleanersError] = useState<string | null>(null);
  const [cleanersPage, setCleanersPage] = useState(1);
  const [cleanersPageSize, setCleanersPageSize] = useState(8);
  const [cleanersPagination, setCleanersPagination] = useState<{
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  } | null>(null);
  const [profileCleanerId, setProfileCleanerId] = useState<string | null>(null);
  const [profileCleanerDetail, setProfileCleanerDetail] =
    useState<AdminCleanerDetail | null>(null);
  const [profileCleanerLoading, setProfileCleanerLoading] = useState(false);
  const [profileCleanerError, setProfileCleanerError] = useState<string | null>(null);
  const [isEditingCleanerProfile, setIsEditingCleanerProfile] = useState(false);
  const [editCleanerForm, setEditCleanerForm] = useState({
    name: "",
    email: "",
    phone: "",
    verification_status: "",
    workingAreasText: "",
    unavailableDatesText: "",
  });
  const [editCleanerAvatarFile, setEditCleanerAvatarFile] = useState<File | null>(null);
  const [editCleanerSaving, setEditCleanerSaving] = useState(false);
  const [editCleanerError, setEditCleanerError] = useState<string | null>(null);
  const [scheduleCleanerId, setScheduleCleanerId] = useState<string | null>(null);
  const [scheduleCleanerDetail, setScheduleCleanerDetail] =
    useState<AdminCleanerDetail | null>(null);
  const [scheduleCleanerLoading, setScheduleCleanerLoading] = useState(false);
  const [scheduleCleanerError, setScheduleCleanerError] = useState<string | null>(null);
  const [cleanersRefreshKey, setCleanersRefreshKey] = useState(0);
  const [isAddCleanerOpen, setIsAddCleanerOpen] = useState(false);
  const [addCleanerForm, setAddCleanerForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [addCleanerAvatarFile, setAddCleanerAvatarFile] = useState<File | null>(null);
  const [addCleanerLoading, setAddCleanerLoading] = useState(false);
  const [addCleanerError, setAddCleanerError] = useState<string | null>(null);

  const [customersList, setCustomersList] = useState<AdminCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersQuery, setCustomersQuery] = useState("");
  const [customersSegment, setCustomersSegment] = useState<string>("");
  const [customersRefreshKey, setCustomersRefreshKey] = useState(0);
  const [copiedCustomerEmail, setCopiedCustomerEmail] = useState<string | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [addCustomerForm, setAddCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [addCustomerLoading, setAddCustomerLoading] = useState(false);
  const [addCustomerError, setAddCustomerError] = useState<string | null>(null);
  const [openCustomerEmail, setOpenCustomerEmail] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<AdminCustomerDetail | null>(null);
  const [customerDetailLoading, setCustomerDetailLoading] = useState(false);
  const [customerDetailError, setCustomerDetailError] = useState<string | null>(null);
  const [customerDetailPage, setCustomerDetailPage] = useState(1);
  const [customerDetailPageSize, setCustomerDetailPageSize] = useState(5);
  const [settings, setSettings] = useState({
    companyName: "Shalean Cleaning",
    defaultCity: "Cape Town",
    workingHours: "08:00 - 18:00",
    sameDayBookings: false,
    smsNotifications: true,
    assignmentMode: "smart",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const averageReviewRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) /
        reviews.length
      : 0;

  const handleExportReviews = () => {
    if (!reviews || reviews.length === 0) {
      return;
    }

    const headers = [
      "id",
      "customer",
      "cleaner",
      "rating",
      "comment",
      "date",
      "status",
    ];

    const escapeCsv = (value: unknown) => {
      const str = value == null ? "" : String(value);
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = reviews.map((r) =>
      [
        r.id,
        r.customer,
        r.cleaner,
        r.rating,
        r.comment,
        r.date,
        r.status,
      ].map(escapeCsv).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `reviews-export-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setNotificationsLoading(true);
        setNotificationsError(null);
        const res = await fetch("/api/admin/notifications");
        if (!res.ok) {
          throw new Error("Failed to load notifications");
        }
        const data: { notifications: AdminNotification[] } = await res.json();
        setNotifications(data.notifications ?? []);
      } catch (err) {
        console.error("Error loading admin notifications:", err);
        setNotificationsError("We could not load notifications from the server.");
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setSettingsLoading(true);
        setSettingsError(null);
        const res = await fetch("/api/admin/settings");
        if (!res.ok) {
          throw new Error("Failed to load admin settings");
        }
        const data = await res
          .json()
          .catch(() => ({ error: "Failed to parse response" }));

        if (data && typeof data.settings === "object" && data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...(data.settings as Partial<typeof prev>),
          }));
        }
      } catch (err) {
        console.error("Error loading admin settings:", err);
        setSettingsError(
          err instanceof Error
            ? err.message || "We could not load admin settings from the server."
            : "We could not load admin settings from the server."
        );
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        const res = await fetch("/api/admin/reviews");
        const data = await res
          .json()
          .catch(() => ({ error: "Failed to parse response" }));

        if (!res.ok) {
          const message =
            (data && typeof data.error === "string" && data.error) ||
            "Failed to load reviews";
          throw new Error(message);
        }

        const payload = data as { reviews?: AdminReview[] };
        setReviews(payload.reviews ?? []);
      } catch (err) {
        console.error("Error loading admin reviews:", err);
        setReviewsError(
          err instanceof Error
            ? err.message || "We could not load reviews from the server."
            : "We could not load reviews from the server."
        );
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const handleToggleNotifications = () => {
    setIsNotificationsOpen((open) => !open);
    setNotifications((current) =>
      current.map((n) => (n.read ? n : { ...n, read: true }))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
  };

  const handleAddCleanerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = addCleanerForm.name.trim();
    const email = addCleanerForm.email.trim();
    const password = addCleanerForm.password;
    if (!name) {
      setAddCleanerError("Name is required.");
      return;
    }
    if (!email) {
      setAddCleanerError("Email is required.");
      return;
    }
    if (!password || password.length < 6) {
      setAddCleanerError("Password is required (at least 6 characters).");
      return;
    }
    setAddCleanerLoading(true);
    setAddCleanerError(null);
    try {
      const res = await fetch("/api/admin/cleaners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addCleanerForm.name.trim(),
          email: addCleanerForm.email.trim() || undefined,
          phone: addCleanerForm.phone.trim() || undefined,
          password: addCleanerForm.password.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.detail
          ? `${data.error || "Failed to add cleaner."} ${data.detail}`
          : data.error || "Failed to add cleaner.";
        setAddCleanerError(message);
        return;
      }
      const profileId =
        data && typeof (data as { id?: unknown }).id === "string"
          ? (data as { id: string }).id
          : undefined;

      // If an avatar file was selected, upload it before closing.
      if (profileId && addCleanerAvatarFile) {
        const avatarForm = new FormData();
        avatarForm.append("file", addCleanerAvatarFile);
        avatarForm.append("profileId", profileId);
        const avatarRes = await fetch("/api/admin/cleaners/avatar", {
          method: "POST",
          body: avatarForm,
        });
        const avatarData = await avatarRes.json().catch(() => ({}));
        if (!avatarRes.ok) {
          const message = avatarData.detail
            ? `${avatarData.error || "Failed to upload avatar."} ${avatarData.detail}`
            : avatarData.error || "Failed to upload avatar.";
          // Do not block cleaner creation, just show an error.
          setAddCleanerError(message);
        }
      }

      setIsAddCleanerOpen(false);
      setAddCleanerForm({ name: "", email: "", phone: "", password: "" });
      setAddCleanerAvatarFile(null);
      setCleanersRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Error adding cleaner:", err);
      setAddCleanerError("Something went wrong. Please try again.");
    } finally {
      setAddCleanerLoading(false);
    }
  };

  const handleSaveCleanerProfile = async () => {
    if (!profileCleanerId) return;
    setEditCleanerSaving(true);
    setEditCleanerError(null);
    try {
      const workingAreas = editCleanerForm.workingAreasText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      const unavailableDates = editCleanerForm.unavailableDatesText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/cleaners/${profileCleanerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCleanerForm.name,
          email: editCleanerForm.email,
          phone: editCleanerForm.phone,
          verification_status: editCleanerForm.verification_status || null,
          working_areas: workingAreas,
          unavailable_dates: unavailableDates,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.detail
          ? `${data.error || "Failed to save changes."} ${data.detail}`
          : data.error || "Failed to save changes.";
        setEditCleanerError(msg);
        return;
      }

      // Optional avatar upload
      if (editCleanerAvatarFile) {
        const avatarForm = new FormData();
        avatarForm.append("file", editCleanerAvatarFile);
        avatarForm.append("profileId", profileCleanerId);
        const avatarRes = await fetch("/api/admin/cleaners/avatar", {
          method: "POST",
          body: avatarForm,
        });
        const avatarData = await avatarRes.json().catch(() => ({}));
        if (!avatarRes.ok) {
          const msg = avatarData.detail
            ? `${avatarData.error || "Avatar upload failed."} ${avatarData.detail}`
            : avatarData.error || "Avatar upload failed.";
          setEditCleanerError(msg);
        }
      }

      // Refresh detail + list
      const detailRes = await fetch(`/api/admin/cleaners/${profileCleanerId}`);
      if (detailRes.ok) {
        const detail = (await detailRes.json()) as AdminCleanerDetail;
        setProfileCleanerDetail(detail);
        setEditCleanerForm({
          name: detail.name ?? "",
          email: detail.email ?? "",
          phone: detail.phone ?? "",
          verification_status: detail.verification_status ?? "",
          workingAreasText: (detail.working_areas ?? []).join(", "),
          unavailableDatesText: (detail.unavailable_dates ?? []).join(", "),
        });
      }
      setCleanersRefreshKey((k) => k + 1);
      setIsEditingCleanerProfile(false);
      setEditCleanerAvatarFile(null);
    } catch (err) {
      console.error("Error saving cleaner profile:", err);
      setEditCleanerError("Something went wrong saving changes.");
    } finally {
      setEditCleanerSaving(false);
    }
  };

  const revenueSeries = React.useMemo(() => {
    if (!overview || !overview.recentBookings.length) return [];

    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - (revenueRange === "7d" ? 7 : 30));

    const totalsByDay = new Map<string, number>();

    overview.recentBookings.forEach((booking) => {
      if (!booking.date || booking.status !== "confirmed") return;
      const bookingDate = new Date(booking.date);
      if (Number.isNaN(bookingDate.getTime()) || bookingDate < cutoff) return;

      const key = bookingDate.toISOString().slice(0, 10);
      const current = totalsByDay.get(key) ?? 0;
      totalsByDay.set(key, current + (booking.totalAmount ?? 0));
    });

    return Array.from(totalsByDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, total]) => {
        const d = new Date(key);
        const label = d.toLocaleDateString("en-ZA", {
          month: "short",
          day: "2-digit",
        });
        return { key, label, total };
      });
  }, [overview, revenueRange]);

  const handleBookingAction = (
    bookingId: string,
    action: "view" | "complete" | "cancel"
  ) => {
    setOpenBookingActionsId(null);

    if (action === "view") {
      setActiveDialog({ type: "view", bookingId });
      setFullBooking(null);
      // For now we rely on the summary data already loaded into the overview
      // payload instead of calling an additional API. This keeps the UX simple
      // and avoids showing noisy error banners if the server cannot return a
      // full record due to permissions.
      setFullBooking(null);
      setFullBookingError(null);
      setFullBookingLoading(false);
      return;
    }

    // Update local state so the table reflects the change immediately.
    setOverview((current) => {
      if (!current) return current;
      const updatedBookings = current.recentBookings.map((b) => {
        if (b.id !== bookingId) return b;
        if (action === "complete") {
          return { ...b, status: "completed" };
        }
        if (action === "cancel") {
          return { ...b, status: "cancelled" };
        }
        return b;
      });
      return { ...current, recentBookings: updatedBookings };
    });
    setBookingsList((current) =>
      current.map((b) => {
        if (b.id !== bookingId) return b;
        if (action === "complete") return { ...b, status: "completed" };
        if (action === "cancel") return { ...b, status: "cancelled" };
        return b;
      })
    );
  };

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setOverviewLoading(true);
        setOverviewError(null);
        const res = await fetch("/api/admin/overview");
        if (!res.ok) {
          throw new Error("Failed to load overview");
        }
        const data: OverviewResponse = await res.json();
        setOverview(data);
      } catch (err) {
        console.error("Error loading admin overview:", err);
        setOverviewError("We could not load the latest metrics. Showing demo data instead.");
      } finally {
        setOverviewLoading(false);
      }
    };

    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab !== "bookings") return;
    const loadBookings = async () => {
      try {
        setBookingsListLoading(true);
        setBookingsListError(null);
        const params = new URLSearchParams();
        if (bookingsStatusFilter) params.set("status", bookingsStatusFilter);
        if (bookingsServiceFilter) params.set("service", bookingsServiceFilter);
        params.set("page", String(bookingsPage));
        params.set("limit", String(bookingsPageSize));
        const res = await fetch(`/api/admin/bookings?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load bookings");
        const data: {
          bookings: BookingsListBooking[];
          pagination?: {
            page: number;
            pageSize: number;
            totalCount: number;
            totalPages: number;
          };
        } = await res.json();
        setBookingsList(data.bookings ?? []);
        setBookingsPagination(
          data.pagination ?? {
            page: bookingsPage,
            pageSize: bookingsPageSize,
            totalCount: (data.bookings ?? []).length,
            totalPages: 1,
          }
        );
      } catch (err) {
        console.error("Error loading admin bookings:", err);
        setBookingsListError("Could not load bookings.");
        setBookingsList([]);
        setBookingsPagination(null);
      } finally {
        setBookingsListLoading(false);
      }
    };
    loadBookings();
  }, [activeTab, bookingsStatusFilter, bookingsServiceFilter, bookingsPage, bookingsPageSize]);

  useEffect(() => {
    if (activeTab !== "cleaners") return;
    const loadCleaners = async () => {
      try {
        setCleanersLoading(true);
        setCleanersError(null);
        const params = new URLSearchParams();
        params.set("page", String(cleanersPage));
        params.set("limit", String(cleanersPageSize));
        const res = await fetch(`/api/admin/cleaners?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load cleaners");
        const data: {
          cleaners: AdminCleaner[];
          pagination?: {
            page: number;
            pageSize: number;
            totalCount: number;
            totalPages: number;
          };
        } = await res.json();
        setCleanersList(data.cleaners ?? []);
        setCleanersPagination(
          data.pagination ?? {
            page: cleanersPage,
            pageSize: cleanersPageSize,
            totalCount: (data.cleaners ?? []).length,
            totalPages: 1,
          }
        );
      } catch (err) {
        console.error("Error loading admin cleaners:", err);
        setCleanersError("Could not load cleaners.");
        setCleanersList([]);
        setCleanersPagination(null);
      } finally {
        setCleanersLoading(false);
      }
    };
    loadCleaners();
  }, [activeTab, cleanersPage, cleanersPageSize, cleanersRefreshKey]);

  useEffect(() => {
    if (!profileCleanerId) {
      setProfileCleanerDetail(null);
      setProfileCleanerError(null);
      setIsEditingCleanerProfile(false);
      setEditCleanerAvatarFile(null);
      setEditCleanerError(null);
      return;
    }
    const loadCleanerProfile = async () => {
      try {
        setProfileCleanerLoading(true);
        setProfileCleanerError(null);
        const res = await fetch(`/api/admin/cleaners/${profileCleanerId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Cleaner not found");
          throw new Error("Failed to load cleaner details");
        }
        const data: AdminCleanerDetail = await res.json();
        setProfileCleanerDetail(data);
        setEditCleanerForm({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          verification_status: data.verification_status ?? "",
          workingAreasText: (data.working_areas ?? []).join(", "),
          unavailableDatesText: (data.unavailable_dates ?? []).join(", "),
        });
        setIsEditingCleanerProfile(false);
        setEditCleanerAvatarFile(null);
        setEditCleanerError(null);
      } catch (err) {
        console.error("Error loading cleaner profile:", err);
        setProfileCleanerError(err instanceof Error ? err.message : "Could not load cleaner.");
        setProfileCleanerDetail(null);
      } finally {
        setProfileCleanerLoading(false);
      }
    };
    loadCleanerProfile();
  }, [profileCleanerId]);

  useEffect(() => {
    if (!scheduleCleanerId) {
      setScheduleCleanerDetail(null);
      setScheduleCleanerError(null);
      return;
    }
    const loadSchedule = async () => {
      try {
        setScheduleCleanerLoading(true);
        setScheduleCleanerError(null);
        const res = await fetch(`/api/admin/cleaners/${scheduleCleanerId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Cleaner not found");
          throw new Error("Failed to load schedule");
        }
        const data: AdminCleanerDetail = await res.json();
        setScheduleCleanerDetail(data);
      } catch (err) {
        console.error("Error loading cleaner schedule:", err);
        setScheduleCleanerError(
          err instanceof Error ? err.message : "Could not load schedule."
        );
        setScheduleCleanerDetail(null);
      } finally {
        setScheduleCleanerLoading(false);
      }
    };
    loadSchedule();
  }, [scheduleCleanerId]);

  useEffect(() => {
    if (activeTab !== "customers") return;
    const loadCustomers = async () => {
      try {
        setCustomersLoading(true);
        setCustomersError(null);
        const params = new URLSearchParams();
        if (customersQuery.trim()) params.set("q", customersQuery.trim());
        if (customersSegment) params.set("segment", customersSegment);
        const res = await fetch(`/api/admin/customers?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load customers");
        }
        setCustomersList(Array.isArray(data?.customers) ? data.customers : []);
      } catch (err) {
        console.error("Error loading admin customers:", err);
        setCustomersError(
          err instanceof Error ? err.message : "Could not load customers."
        );
        setCustomersList([]);
      } finally {
        setCustomersLoading(false);
      }
    };
    loadCustomers();
  }, [activeTab, customersQuery, customersSegment, customersRefreshKey]);

  useEffect(() => {
    if (!openCustomerEmail) {
      setCustomerDetail(null);
      setCustomerDetailError(null);
      setCustomerDetailPage(1);
      return;
    }
    const loadCustomerDetail = async () => {
      try {
        setCustomerDetailLoading(true);
        setCustomerDetailError(null);
        const res = await fetch(
          `/api/admin/customers/${encodeURIComponent(
            openCustomerEmail
          )}?page=${customerDetailPage}&limit=${customerDetailPageSize}`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load customer profile");
        }
        setCustomerDetail(data as AdminCustomerDetail);
      } catch (err) {
        console.error("Error loading customer detail:", err);
        setCustomerDetailError(
          err instanceof Error ? err.message : "Could not load customer profile."
        );
        setCustomerDetail(null);
      } finally {
        setCustomerDetailLoading(false);
      }
    };
    loadCustomerDetail();
  }, [openCustomerEmail, customerDetailPage, customerDetailPageSize]);

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = addCustomerForm.name.trim();
    const email = addCustomerForm.email.trim();
    const password = addCustomerForm.password;
    if (!name) {
      setAddCustomerError("Name is required.");
      return;
    }
    if (!email) {
      setAddCustomerError("Email is required.");
      return;
    }
    if (!password || password.length < 6) {
      setAddCustomerError("Password is required (at least 6 characters).");
      return;
    }
    setAddCustomerLoading(true);
    setAddCustomerError(null);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: addCustomerForm.phone.trim() || undefined,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.detail
          ? `${data.error || "Failed to add customer."} ${data.detail}`
          : data.error || "Failed to add customer.";
        setAddCustomerError(message);
        return;
      }
      setIsAddCustomerOpen(false);
      setAddCustomerForm({ name: "", email: "", phone: "", password: "" });
      // Refresh list
      setCustomersRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Error adding customer:", err);
      setAddCustomerError("Something went wrong. Please try again.");
    } finally {
      setAddCustomerLoading(false);
    }
  };

  const filteredBookingsList = React.useMemo(() => {
    return bookingsList;
  }, [bookingsList]);

  const menuItems = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: "cleaners",
      label: "Cleaners",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      id: "customers",
      label: "Customers",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <Star className="w-5 h-5" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col hidden md:flex`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          {isSidebarOpen && (
            <span className="font-black text-xl tracking-tight text-slate-900">SHALEAN</span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === item.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span className="font-semibold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onBack}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-rose-600 transition-colors"
          >
            <X className="w-5 h-5" />
            {isSidebarOpen && <span className="font-semibold text-sm">Exit Dashboard</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-4 relative">
            <button className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 capitalize">{activeTab}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Quick search..."
                className="bg-transparent border-none text-xs focus:ring-0 w-32"
              />
            </div>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className="p-2 text-slate-400 hover:text-blue-600 relative rounded-full hover:bg-slate-100 transition-colors"
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
            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-lg z-20">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    <p className="text-[11px] text-slate-400">
                      {notificationsLoading
                        ? "Loading notifications..."
                        : notificationsError
                        ? notificationsError
                        : unreadNotifications > 0
                        ? `${unreadNotifications} new ${unreadNotifications === 1 ? "alert" : "alerts"}`
                        : "You're all caught up"}
                    </p>
                  </div>
                  {!notificationsLoading && !notificationsError && notifications.some((n) => !n.read) && (
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
                      Loading notifications...
                    </div>
                  ) : notificationsError ? (
                    <div className="px-4 py-6 text-center text-xs text-rose-500">
                      {notificationsError}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className={`px-4 py-3 text-sm ${
                            notification.read ? "bg-white" : "bg-blue-50/60"
                          }`}
                        >
                          <p className="font-semibold text-slate-900 text-xs">
                            {notification.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
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
                <div className="px-4 py-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                    onClick={() => setIsNotificationsOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200">
              AD
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {activeTab === "overview" && (
            <div className="max-w-7xl mx-auto space-y-8">
              {(overviewLoading || overviewError) && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 flex justify-between items-center">
                  <span>
                    {overviewLoading
                      ? "Loading live metrics from your bookings..."
                      : overviewError}
                  </span>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {overview ? (
                  [
                    {
                      title: "Total Revenue",
                      value: `R${overview.stats.totalRevenue.toLocaleString("en-ZA")}`,
                      icon: <DollarSign className="w-5 h-5" />,
                    },
                    {
                      title: "Active Bookings",
                      value: overview.stats.activeBookings.toString(),
                      icon: <Calendar className="w-5 h-5" />,
                    },
                    {
                      title: "New Customers (30d)",
                      value: overview.stats.newCustomersLast30Days.toString(),
                      icon: <Users className="w-5 h-5" />,
                    },
                    {
                      title: "Avg. Rating",
                      value:
                        overview.stats.averageRating != null
                          ? overview.stats.averageRating.toFixed(2)
                          : "—",
                      icon: <Star className="w-5 h-5" />,
                    },
                  ].map((stat, i) => <StatCard key={i} {...stat} />)
                ) : (
                  <div className="col-span-4 text-xs text-slate-500">
                    No metrics yet. Add bookings to see live stats.
                  </div>
                )}
              </div>

              {/* Chart & Recent Activity Placeholder */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-slate-900">Revenue Overview</h2>
                    <select
                      className="text-xs font-semibold bg-slate-50 border-slate-200 rounded-lg px-2 py-1"
                      value={revenueRange}
                      onChange={(e) =>
                        setRevenueRange(e.target.value === "30d" ? "30d" : "7d")
                      }
                    >
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                    </select>
                  </div>
                  {overview && revenueSeries.length > 0 ? (
                    <div className="h-64 bg-slate-50 rounded-xl border border-slate-200 px-5 py-4 flex flex-col justify-between">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-[11px] text-slate-500">
                          Daily confirmed revenue
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Max:{" "}
                          <span className="font-mono text-slate-600">
                            R
                            {Math.max(
                              ...revenueSeries.map((p) => p.total || 0)
                            ).toLocaleString("en-ZA")}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-end gap-3 flex-1 pb-2">
                        {revenueSeries.map((point) => {
                          const max = Math.max(
                            ...revenueSeries.map((p) => p.total || 0)
                          );
                          const height =
                            max > 0 ? Math.max(25, (point.total / max) * 100) : 0;
                          return (
                            <div
                              key={point.key}
                              className="flex-1 flex flex-col items-center gap-1"
                            >
                              <div className="w-full bg-blue-100/80 rounded-t-xl overflow-hidden flex items-end justify-center">
                                <div
                                  className="w-3/4 bg-blue-500 rounded-t-xl transition-[height] duration-300 ease-out"
                                  style={{ height: `${height}%` }}
                                />
                              </div>
                              <div className="text-[11px] text-slate-600 text-center leading-tight mt-1">
                                <div className="font-mono font-semibold">
                                  R{point.total.toLocaleString("en-ZA")}
                                </div>
                                <div className="mt-0.5">{point.label}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Based on confirmed booking totals in the selected period.
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200">
                      <div className="text-center">
                        <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">
                          No revenue data in this period yet.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h2 className="font-bold text-slate-900 mb-6">Service Distribution</h2>
                  <div className="space-y-4">
                    {overview && overview.serviceDistribution.length > 0 ? (
                      overview.serviceDistribution.map((item, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-600">{item.label}</span>
                            <span className="text-slate-900">{item.value}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        No service mix data yet. New bookings will appear here.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="font-bold text-slate-900">Recent Bookings</h2>
                  {overview && overview.recentBookings.length > 0 && (
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>
                        Page {recentBookingsPage} of{" "}
                        {Math.max(
                          1,
                          Math.ceil(overview.recentBookings.length / 10)
                        )}
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="px-2 py-1 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                          disabled={recentBookingsPage === 1}
                          onClick={() =>
                            setRecentBookingsPage((p) => Math.max(1, p - 1))
                          }
                        >
                          Prev
                        </button>
                        <button
                          className="px-2 py-1 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                          disabled={
                            !overview ||
                            recentBookingsPage >=
                              Math.ceil(overview.recentBookings.length / 10)
                          }
                          onClick={() =>
                            setRecentBookingsPage((p) =>
                              overview
                                ? Math.min(
                                    Math.ceil(
                                      overview.recentBookings.length / 10
                                    ),
                                    p + 1
                                  )
                                : p
                            )
                          }
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Cleaner</th>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {overview && overview.recentBookings.length > 0 ? (
                        overview.recentBookings
                          .slice(
                            (recentBookingsPage - 1) * 10,
                            recentBookingsPage * 10
                          )
                          .map((booking) => (
                          <tr
                            key={booking.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                              {formatBookingCode(booking.id)}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">
                              {booking.customer}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {booking.cleaner ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {booking.date}
                              {booking.time ? `, ${booking.time}` : ""}
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {`R${booking.totalAmount.toLocaleString("en-ZA")}`}
                            </td>
                            <td className="px-6 py-4">
                              <Badge status={booking.status ?? "upcoming"} />
                            </td>
                            <td className="px-6 py-4 text-right relative">
                              <button
                                type="button"
                                className="p-1 hover:bg-slate-200 rounded-lg"
                                onClick={() =>
                                  setOpenBookingActionsId((current) =>
                                    current === booking.id ? null : booking.id
                                  )
                                }
                                aria-label="Booking actions"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </button>
                              {openBookingActionsId === booking.id && (
                              <div className="absolute right-4 top-10 z-10 w-40 bg-white border border-slate-200 rounded-xl shadow-lg text-xs text-slate-700">
                                <button
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50"
                                  type="button"
                                  onClick={() =>
                                    handleBookingAction(booking.id, "view")
                                  }
                                >
                                    View booking
                                  </button>
                                  <button
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50"
                                  type="button"
                                  onClick={() =>
                                    handleBookingAction(booking.id, "complete")
                                  }
                                >
                                    Mark as completed
                                  </button>
                                  <button
                                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50"
                                  type="button"
                                  onClick={() =>
                                    handleBookingAction(booking.id, "cancel")
                                  }
                                >
                                    Cancel booking
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-6 text-center text-xs text-slate-500"
                          >
                            No recent bookings yet. New bookings will appear here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "cleaners" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Our Cleaners</h2>
                    <p className="text-slate-500 text-sm">
                      Manage team performance and availability
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCleanerOpen(true);
                    setAddCleanerError(null);
                    setAddCleanerForm({ name: "", email: "", phone: "", password: "" });
                  }}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" /> Add New Cleaner
                </button>
              </div>

              {cleanersError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {cleanersError}
                </div>
              )}

              {cleanersLoading ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                  <p className="text-slate-500 text-sm">Loading cleaners...</p>
                </div>
              ) : cleanersList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                  <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No cleaners yet</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Add cleaners via your auth or profiles table to see them here.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cleanersList.map((cleaner) => (
                    <div
                      key={cleaner.id}
                      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center"
                    >
                      {cleaner.avatar ? (
                        <img
                          src={cleaner.avatar}
                          alt={cleaner.name}
                          className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center text-blue-600 font-bold text-xl uppercase">
                          {cleaner.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2) || "—"}
                        </div>
                      )}
                      <h3 className="font-bold text-slate-900">{cleaner.name}</h3>
                      <p className="text-xs text-slate-500 mb-3">{cleaner.specialty}</p>
                      <div className="flex justify-center gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-900">
                            {cleaner.rating > 0 ? `${cleaner.rating}★` : "—"}
                          </p>
                          <p className="text-[10px] text-slate-400">Rating</p>
                        </div>
                        <div className="text-center border-l border-slate-100 pl-4">
                          <p className="text-xs font-bold text-slate-900">{cleaner.jobs}</p>
                          <p className="text-[10px] text-slate-400">Jobs</p>
                        </div>
                      </div>
                      <Badge status={cleaner.status} />
                      <div className="mt-5 pt-5 border-t border-slate-50 flex gap-2">
                        <button
                          type="button"
                          className="flex-1 text-xs font-bold text-blue-600 hover:bg-blue-50 py-2 rounded-lg"
                          onClick={() => setProfileCleanerId(cleaner.id)}
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          className="flex-1 text-xs font-bold text-slate-400 hover:bg-slate-50 py-2 rounded-lg"
                          onClick={() => setScheduleCleanerId(cleaner.id)}
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cleanersPagination && cleanersPagination.totalCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-4">
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>
                      Showing{" "}
                      {(cleanersPagination.page - 1) * cleanersPagination.pageSize + 1}–
                      {Math.min(
                        cleanersPagination.page * cleanersPagination.pageSize,
                        cleanersPagination.totalCount
                      )}{" "}
                      of {cleanersPagination.totalCount.toLocaleString()} cleaners
                    </span>
                    <label className="flex items-center gap-2">
                      <span className="text-slate-500">Per page</span>
                      <select
                        className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                        value={cleanersPageSize}
                        onChange={(e) => {
                          setCleanersPageSize(Number(e.target.value));
                          setCleanersPage(1);
                        }}
                      >
                        <option value={4}>4</option>
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        cleanersPagination.page <= 1 || cleanersLoading
                      }
                      onClick={() =>
                        setCleanersPage((p) => Math.max(1, p - 1))
                      }
                    >
                      Previous
                    </button>
                    <span className="text-xs font-medium text-slate-600 px-2">
                      Page {cleanersPagination.page} of{" "}
                      {cleanersPagination.totalPages}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        cleanersPagination.page >=
                          cleanersPagination.totalPages || cleanersLoading
                      }
                      onClick={() =>
                        setCleanersPage((p) =>
                          Math.min(cleanersPagination.totalPages, p + 1)
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Bookings</h2>
                    <p className="text-slate-500 text-sm">
                      View and manage your customer bookings
                    </p>
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> New Booking
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">All Bookings</h3>
                    <p className="text-xs text-slate-500">
                      Filter and search across all upcoming and past bookings
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <select
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                      value={bookingsStatusFilter}
                      onChange={(e) => {
                        setBookingsStatusFilter(e.target.value);
                        setBookingsPage(1);
                      }}
                    >
                      <option value="">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="failed">Failed</option>
                    </select>
                    <select
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                      value={bookingsServiceFilter}
                      onChange={(e) => {
                        setBookingsServiceFilter(e.target.value);
                        setBookingsPage(1);
                      }}
                    >
                      <option value="">All services</option>
                      <option value="standard">Standard</option>
                      <option value="deep">Deep Clean</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="move_in">Move In</option>
                      <option value="move_out">Move Out</option>
                      <option value="carpet">Carpet</option>
                    </select>
                  </div>
                </div>
                {bookingsListError && (
                  <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                    {bookingsListError}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Service</th>
                        <th className="px-6 py-4">Cleaner</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Time</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {bookingsListLoading ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-6 py-8 text-center text-xs text-slate-500"
                          >
                            Loading bookings...
                          </td>
                        </tr>
                      ) : filteredBookingsList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-6 py-8 text-center text-xs text-slate-500"
                          >
                            No bookings found. Create a booking or adjust filters.
                          </td>
                        </tr>
                      ) : (
                        filteredBookingsList.map((booking) => (
                          <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                              {formatBookingCode(booking.id)}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">
                              {booking.customer}
                            </td>
                            <td className="px-6 py-4 text-slate-600">{booking.service}</td>
                            <td className="px-6 py-4 text-slate-600">
                              {booking.cleaner ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-slate-500">{booking.date}</td>
                            <td className="px-6 py-4 text-slate-500">{booking.time}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              R{booking.totalAmount.toLocaleString("en-ZA")}
                            </td>
                            <td className="px-6 py-4">
                              <Badge status={booking.status ?? "pending"} />
                            </td>
                            <td className="px-6 py-4 text-right relative">
                              <button
                                type="button"
                                className="p-1 hover:bg-slate-200 rounded-lg"
                                onClick={() =>
                                  setOpenBookingActionsId((current) =>
                                    current === booking.id ? null : booking.id
                                  )
                                }
                                aria-label="Booking actions"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </button>
                              {openBookingActionsId === booking.id && (
                                <div className="absolute right-4 top-10 z-10 w-40 bg-white border border-slate-200 rounded-xl shadow-lg text-xs text-slate-700">
                                  <button
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50"
                                    type="button"
                                    onClick={() =>
                                      handleBookingAction(booking.id, "view")
                                    }
                                  >
                                    View booking
                                  </button>
                                  <button
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50"
                                    type="button"
                                    onClick={() =>
                                      handleBookingAction(booking.id, "complete")
                                    }
                                  >
                                    Mark as completed
                                  </button>
                                  <button
                                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50"
                                    type="button"
                                    onClick={() =>
                                      handleBookingAction(booking.id, "cancel")
                                    }
                                  >
                                    Cancel booking
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {bookingsPagination && bookingsPagination.totalCount > 0 && (
                  <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span>
                        Showing{" "}
                        {(bookingsPagination.page - 1) * bookingsPagination.pageSize + 1}–
                        {Math.min(
                          bookingsPagination.page * bookingsPagination.pageSize,
                          bookingsPagination.totalCount
                        )}{" "}
                        of {bookingsPagination.totalCount.toLocaleString()}{" "}
                        bookings
                      </span>
                      <label className="flex items-center gap-2">
                        <span className="text-slate-500">Per page</span>
                        <select
                          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                          value={bookingsPageSize}
                          onChange={(e) => {
                            setBookingsPageSize(Number(e.target.value));
                            setBookingsPage(1);
                          }}
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={bookingsPagination.page <= 1 || bookingsListLoading}
                        onClick={() =>
                          setBookingsPage((p) => Math.max(1, p - 1))
                        }
                      >
                        Previous
                      </button>
                      <span className="text-xs font-medium text-slate-600 px-2">
                        Page {bookingsPagination.page} of{" "}
                        {bookingsPagination.totalPages}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={
                          bookingsPagination.page >=
                            bookingsPagination.totalPages || bookingsListLoading
                        }
                        onClick={() =>
                          setBookingsPage((p) =>
                            Math.min(bookingsPagination.totalPages, p + 1)
                          )
                        }
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "customers" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Customers</h2>
                    <p className="text-slate-500 text-sm">
                      See your most valuable and recent customers
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCustomerOpen(true);
                    setAddCustomerError(null);
                  }}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Users className="w-4 h-4" /> Add Customer
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">Customer Directory</h3>
                    <p className="text-xs text-slate-500">
                      Search and filter through all customers using Shalean
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-200">
                      <Search className="w-3 h-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by name or email"
                        className="bg-transparent border-none text-xs focus:ring-0 w-40"
                        value={customersQuery}
                        onChange={(e) => setCustomersQuery(e.target.value)}
                      />
                    </div>
                    <select
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                      value={customersSegment}
                      onChange={(e) => setCustomersSegment(e.target.value)}
                    >
                      <option value="">All segments</option>
                      <option value="vip">VIP</option>
                      <option value="churn-risk">Churn risk</option>
                      <option value="new">New</option>
                      <option value="active">Active</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setCustomersRefreshKey((k) => k + 1)}
                      className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                      disabled={customersLoading}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                {customersError && (
                  <div className="px-6 py-3 text-sm text-rose-700 bg-rose-50 border-b border-rose-100">
                    {customersError}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Total Bookings</th>
                        <th className="px-6 py-4">Lifetime Value</th>
                        <th className="px-6 py-4">Last Booking</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {customersLoading ? (
                        <tr>
                          <td className="px-6 py-8 text-slate-500" colSpan={7}>
                            Loading customers…
                          </td>
                        </tr>
                      ) : customersList.length === 0 ? (
                        <tr>
                          <td className="px-6 py-10 text-slate-600" colSpan={7}>
                            No customers found.
                          </td>
                        </tr>
                      ) : (
                        customersList.map((customer) => (
                          <tr
                            key={customer.email || customer.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{customer.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {customer.id}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-700">{customer.email}</p>
                              <p className="text-[11px] text-slate-400">
                                {customer.phone || "—"}
                              </p>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {customer.totalBookings}
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              R{Number(customer.lifetimeValue || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {customer.lastBooking || "—"}
                            </td>
                            <td className="px-6 py-4">
                              <Badge status={String(customer.status)} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-blue-600 hover:underline"
                                  onClick={() => setOpenCustomerEmail(customer.email)}
                                >
                                  View profile
                                </button>
                                <button
                                  type="button"
                                  className="p-1 hover:bg-slate-200 rounded-lg"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(
                                        customer.email
                                      );
                                      setCopiedCustomerEmail(customer.email);
                                      window.setTimeout(() => {
                                        setCopiedCustomerEmail((current) =>
                                          current === customer.email ? null : current
                                        );
                                      }, 1500);
                                    } catch {
                                      setCopiedCustomerEmail(customer.email);
                                    }
                                  }}
                                  aria-label="Copy customer email"
                                  title="Copy email"
                                >
                                  <MoreVertical className="w-4 h-4 text-slate-400" />
                                </button>
                                {copiedCustomerEmail === customer.email && (
                                  <span className="text-[10px] font-semibold text-emerald-600">
                                    Copied
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Reviews</h2>
                    <p className="text-slate-500 text-sm">
                      Curate the best feedback and handle issues quickly
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportReviews}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={reviewsLoading || reviews.length === 0}
                >
                  Export reviews
                </button>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-900">Latest Reviews</h3>
                      <p className="text-xs text-slate-500">
                        Approve, feature, or flag reviews from customers
                      </p>
                    </div>
                    <select className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <option>All statuses</option>
                      <option>Published</option>
                      <option>Featured</option>
                      <option>Flagged</option>
                    </select>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {reviewsLoading && (
                      <div className="p-6 text-sm text-slate-500">
                        Loading reviews…
                      </div>
                    )}
                    {reviewsError && !reviewsLoading && (
                      <div className="p-6 text-sm text-rose-500">
                        {reviewsError}
                      </div>
                    )}
                    {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                      <div className="p-6 text-sm text-slate-500">
                        No reviews found yet.
                      </div>
                    )}
                    {!reviewsLoading &&
                      !reviewsError &&
                      reviews.map((review) => (
                        <div
                          key={review.id}
                          className="p-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900 text-sm">
                                {review.customer}
                              </span>
                              <span className="text-xs text-slate-400">
                                → {review.cleaner}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {review.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating
                                      ? "text-amber-400 fill-amber-300"
                                      : "text-slate-200"
                                  }`}
                                />
                              ))}
                              <span className="text-[11px] text-slate-400 ml-1">
                                {review.rating.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700">
                              {review.comment}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {review.date}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge status={review.status} />
                            <div className="flex gap-2 mt-1">
                              <button className="text-[11px] font-semibold text-emerald-600 hover:underline">
                                Publish
                              </button>
                              <button className="text-[11px] font-semibold text-amber-600 hover:underline">
                                Feature
                              </button>
                              <button className="text-[11px] font-semibold text-rose-600 hover:underline">
                                Flag
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">Ratings Snapshot</h3>
                    <div className="flex items-end gap-4 mb-4">
                      <div>
                        <p className="text-4xl font-black text-slate-900">
                          {averageReviewRating.toFixed(1)}
                        </p>
                        <p className="text-xs text-slate-500">Average rating</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-8">5★</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="w-4/5 h-full bg-emerald-500" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-8">4★</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="w-1/5 h-full bg-emerald-400" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-8">3★</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="w-1/12 h-full bg-amber-400" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-8">2★</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="w-1/24 h-full bg-rose-400" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-8">1★</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="w-1/24 h-full bg-rose-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Use reviews to reward top-performing cleaners and quickly respond to any issues.
                    </p>
                  </div>

                  <div className="bg-slate-900 text-slate-50 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold mb-2">Pro tip</h3>
                    <p className="text-xs text-slate-200 mb-3">
                      Featuring your best reviews on the marketing website can significantly improve
                      conversion from visitors to paying customers.
                    </p>
                    <button className="text-xs font-bold text-amber-300 hover:text-amber-200 underline">
                      Copy featured review snippet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                  <p className="text-slate-500 text-sm">
                    Configure how Shalean works for your team and customers
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
                <div className="p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="md:w-1/3">
                    <h3 className="font-semibold text-slate-900">Business Profile</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Basic information that appears on customer emails and invoices.
                    </p>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Company name
                      </label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, companyName: e.target.value }))
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Default city
                      </label>
                      <input
                        type="text"
                        value={settings.defaultCity}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, defaultCity: e.target.value }))
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="md:w-1/3">
                    <h3 className="font-semibold text-slate-900">Booking Rules</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Control how new bookings are created and assigned.
                    </p>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Working hours
                      </label>
                      <input
                        type="text"
                        value={settings.workingHours}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, workingHours: e.target.value }))
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="inline-flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.sameDayBookings}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              sameDayBookings: e.target.checked,
                            }))
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Allow same‑day bookings
                          </p>
                          <p className="text-xs text-slate-500">
                            Customers can book earlier than 24 hours from the start time.
                          </p>
                        </div>
                      </label>

                      <label className="inline-flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.smsNotifications}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              smsNotifications: e.target.checked,
                            }))
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Send SMS reminders
                          </p>
                          <p className="text-xs text-slate-500">
                            Customers receive SMS reminders 24 hours before each booking.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="md:w-1/3">
                    <h3 className="font-semibold text-slate-900">Cleaner Assignment</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Decide how cleaners are matched to new bookings.
                    </p>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Assignment mode
                      </label>
                      <select
                        value={settings.assignmentMode}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, assignmentMode: e.target.value }))
                        }
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
                      >
                        <option value="smart">Smart (recommended)</option>
                        <option value="round_robin">Round robin</option>
                        <option value="manual">Manual assignment only</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      This is a visual configuration only for now – hook this into your backend
                      logic when you are ready.
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {settingsLoading ? "Loading settings..." : "Unsaved changes"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {settingsError
                        ? settingsError
                        : "Settings are stored in your database so they apply consistently across sessions."}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-60"
                      type="button"
                      disabled={settingsLoading}
                      onClick={async () => {
                        try {
                          setSettingsLoading(true);
                          setSettingsError(null);
                          const res = await fetch("/api/admin/settings");
                          if (!res.ok) {
                            throw new Error("Failed to reset admin settings");
                          }
                          const data = await res
                            .json()
                            .catch(() => ({ error: "Failed to parse response" }));
                          if (data && typeof data.settings === "object" && data.settings) {
                            setSettings((prev) => ({
                              ...prev,
                              ...(data.settings as Partial<typeof prev>),
                            }));
                          }
                        } catch (err) {
                          console.error("Error resetting admin settings:", err);
                          setSettingsError(
                            err instanceof Error
                              ? err.message ||
                                  "We could not reset admin settings from the server."
                              : "We could not reset admin settings from the server."
                          );
                        } finally {
                          setSettingsLoading(false);
                        }
                      }}
                    >
                      Reset
                    </button>
                    <button
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                      type="button"
                      disabled={settingsLoading}
                      onClick={async () => {
                        try {
                          setSettingsLoading(true);
                          setSettingsError(null);
                          const res = await fetch("/api/admin/settings", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ settings }),
                          });
                          const data = await res
                            .json()
                            .catch(() => ({ error: "Failed to parse response" }));
                          if (!res.ok) {
                            const message =
                              (data &&
                                typeof data.error === "string" &&
                                data.error) ||
                              "Failed to save admin settings";
                            throw new Error(message);
                          }
                          if (data && typeof data.settings === "object" && data.settings) {
                            setSettings((prev) => ({
                              ...prev,
                              ...(data.settings as Partial<typeof prev>),
                            }));
                          }
                        } catch (err) {
                          console.error("Error saving admin settings:", err);
                          setSettingsError(
                            err instanceof Error
                              ? err.message ||
                                  "We could not save admin settings to the server."
                              : "We could not save admin settings to the server."
                          );
                        } finally {
                          setSettingsLoading(false);
                        }
                      }}
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Booking details dialog for "View booking" */}
        {activeDialog.type === "view" && activeDialog.bookingId && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Booking details
                </h2>
                <button
                  type="button"
                  className="p-1 rounded-lg hover:bg-slate-100"
                  onClick={() => setActiveDialog({ type: null, bookingId: null })}
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              {fullBookingLoading ? (
                <div className="px-5 py-4 text-sm text-slate-500">
                  Loading booking details...
                </div>
              ) : fullBookingError || !fullBooking ? (
                <div className="px-5 py-4 space-y-3 text-sm">
                  {(overview || bookingsList.length > 0) && (() => {
                    const fallback =
                      overview?.recentBookings.find(
                        (b) => b.id === activeDialog.bookingId
                      ) ??
                      bookingsList.find(
                        (b) => b.id === activeDialog.bookingId
                      );
                    if (!fallback) return null;
                    return (
                      <div className="mt-1 space-y-2 text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Customer</span>
                          <span className="font-semibold">{fallback.customer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Service</span>
                          <span>{fallback.service}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cleaner</span>
                          <span>{fallback.cleaner ?? "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Date & time</span>
                          <span>
                            {fallback.date}
                            {fallback.time ? `, ${fallback.time}` : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Amount</span>
                          <span className="font-semibold">
                            R{fallback.totalAmount.toLocaleString("en-ZA")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Status</span>
                          <Badge status={fallback.status ?? "upcoming"} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : fullBooking ? (
                <div className="px-5 py-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer</span>
                    <span className="font-semibold">{fullBooking.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span>{fullBooking.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span>{fullBooking.phone}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500">Address</span>
                    <span className="text-slate-700">
                      {fullBooking.address}
                      {fullBooking.apartment_unit
                        ? `, ${fullBooking.apartment_unit}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service</span>
                    <span>{fullBooking.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Property</span>
                    <span>
                      {fullBooking.bedrooms} bed / {fullBooking.bathrooms} bath ·{" "}
                      {fullBooking.property_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & time</span>
                    <span>
                      {fullBooking.date}
                      {fullBooking.time ? `, ${fullBooking.time}` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Frequency</span>
                    <span>{fullBooking.cleaning_frequency}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500">Extras</span>
                    <span>
                      {Array.isArray(fullBooking.extras) &&
                      fullBooking.extras.length > 0
                        ? fullBooking.extras.join(", ")
                        : "None"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500">Instructions</span>
                    <span>
                      {fullBooking.instructions || "No special instructions"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total</span>
                    <span className="font-semibold">
                      {fullBooking.currency || "ZAR"}{" "}
                      {Number(fullBooking.total_amount || 0).toLocaleString(
                        "en-ZA"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Status</span>
                    <Badge status={fullBooking.status ?? "upcoming"} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created</span>
                    <span>
                      {fullBooking.created_at
                        ? new Date(
                            fullBooking.created_at
                          ).toLocaleString("en-ZA")
                        : "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4 text-sm text-slate-500">
                  No booking details available.
                </div>
              )}
              <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => setActiveDialog({ type: null, bookingId: null })}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add New Cleaner modal */}
        {isAddCleanerOpen && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Add New Cleaner
                </h2>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                  onClick={() => {
                    setIsAddCleanerOpen(false);
                    setAddCleanerError(null);
                    setAddCleanerAvatarFile(null);
                  }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddCleanerSubmit} className="p-6 space-y-4">
                {addCleanerError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {addCleanerError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addCleanerForm.name}
                    onChange={(e) =>
                      setAddCleanerForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Nomsa Cleaner"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={addCleanerForm.email}
                    onChange={(e) =>
                      setAddCleanerForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="cleaner@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={addCleanerForm.phone}
                    onChange={(e) =>
                      setAddCleanerForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+27 82 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Profile photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setAddCleanerAvatarFile(file || null);
                    }}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Optional. JPG or PNG works best.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={addCleanerForm.password}
                    onChange={(e) =>
                      setAddCleanerForm((f) => ({ ...f, password: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    A login account is created so the profile can be saved.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => setIsAddCleanerOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addCleanerLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addCleanerLoading ? "Adding…" : "Add Cleaner"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add New Customer modal */}
        {isAddCustomerOpen && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Add New Customer
                </h2>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                  onClick={() => {
                    setIsAddCustomerOpen(false);
                    setAddCustomerError(null);
                  }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddCustomerSubmit} className="p-6 space-y-4">
                {addCustomerError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {addCustomerError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addCustomerForm.name}
                    onChange={(e) =>
                      setAddCustomerForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Customer Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={addCustomerForm.email}
                    onChange={(e) =>
                      setAddCustomerForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="customer@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={addCustomerForm.phone}
                    onChange={(e) =>
                      setAddCustomerForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+27 82 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={addCustomerForm.password}
                    onChange={(e) =>
                      setAddCustomerForm((f) => ({ ...f, password: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Creates a login account so the profile can be saved.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => setIsAddCustomerOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addCustomerLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addCustomerLoading ? "Adding…" : "Add Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer profile detail modal */}
        {openCustomerEmail && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] border border-slate-200 flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-semibold text-slate-900">
                  Customer profile
                </h2>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                  onClick={() => setOpenCustomerEmail(null)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {customerDetailLoading ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Loading customer details...
                  </div>
                ) : customerDetailError ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-rose-600">{customerDetailError}</p>
                  </div>
                ) : customerDetail ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Customer
                        </p>
                        <p className="text-lg font-bold text-slate-900 mt-1">
                          {customerDetail.customer.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {customerDetail.customer.email}
                        </p>
                        <p className="text-xs text-slate-500">
                          {customerDetail.customer.phone || "—"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Summary
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Bookings</span>
                            <span className="font-semibold">
                              {customerDetail.customer.totalBookings}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Lifetime value</span>
                            <span className="font-semibold">
                              R
                              {Number(
                                customerDetail.customer.lifetimeValue || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Last booking</span>
                            <span className="font-semibold">
                              {customerDetail.customer.lastBooking
                                ? new Date(
                                    customerDetail.customer.lastBooking
                                  ).toLocaleDateString("en-ZA")
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">
                          Recent bookings
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerDetailPage(1);
                            setCustomersRefreshKey((k) => k + 1);
                          }}
                          className="text-xs font-semibold text-slate-600 hover:underline"
                        >
                          Refresh directory
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-3">Service</th>
                              <th className="px-5 py-3">When</th>
                              <th className="px-5 py-3">Total</th>
                              <th className="px-5 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-sm">
                            {(customerDetail.bookings ?? []).length === 0 ? (
                              <tr>
                                <td className="px-5 py-6 text-slate-500" colSpan={4}>
                                  No bookings found for this customer.
                                </td>
                              </tr>
                            ) : (
                              (customerDetail.bookings ?? []).map((b) => (
                                <tr key={b.id} className="hover:bg-slate-50/50">
                                  <td className="px-5 py-3 font-semibold text-slate-900">
                                    {b.service}
                                  </td>
                                  <td className="px-5 py-3 text-slate-700">
                                    {b.date} {b.time}
                                  </td>
                                  <td className="px-5 py-3 font-semibold text-slate-900">
                                    {(b.currency || "ZAR").toUpperCase()}{" "}
                                    {Number(b.totalAmount || 0).toLocaleString()}
                                  </td>
                                  <td className="px-5 py-3">
                                    <Badge status={String(b.status || "pending")} />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {customerDetail.pagination &&
                        customerDetail.pagination.totalCount > 0 && (
                          <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                            <div>
                              Showing{" "}
                              {(customerDetail.pagination.page - 1) *
                                customerDetail.pagination.pageSize +
                                1}
                              –
                              {Math.min(
                                customerDetail.pagination.page *
                                  customerDetail.pagination.pageSize,
                                customerDetail.pagination.totalCount
                              )}{" "}
                              of{" "}
                              {customerDetail.pagination.totalCount.toLocaleString()}{" "}
                              bookings
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2">
                                <span className="text-slate-500">Per page</span>
                                <select
                                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                                  value={customerDetailPageSize}
                                  onChange={(e) => {
                                    setCustomerDetailPageSize(
                                      Number(e.target.value)
                                    );
                                    setCustomerDetailPage(1);
                                  }}
                                >
                                  <option value={5}>5</option>
                                  <option value={10}>10</option>
                                  <option value={20}>20</option>
                                </select>
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={
                                    customerDetail.pagination.page <= 1 ||
                                    customerDetailLoading
                                  }
                                  onClick={() =>
                                    setCustomerDetailPage((p) =>
                                      Math.max(1, p - 1)
                                    )
                                  }
                                >
                                  Previous
                                </button>
                                <span className="text-xs font-medium text-slate-600 px-1">
                                  Page {customerDetail.pagination.page} of{" "}
                                  {customerDetail.pagination.totalPages}
                                </span>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={
                                    customerDetail.pagination.page >=
                                      customerDetail.pagination.totalPages ||
                                    customerDetailLoading
                                  }
                                  onClick={() =>
                                    setCustomerDetailPage((p) =>
                                      Math.min(
                                        customerDetail.pagination.totalPages,
                                        p + 1
                                      )
                                    )
                                  }
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">
                    No customer details available.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cleaner profile detail modal */}
        {(profileCleanerId || profileCleanerDetail) && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] border border-slate-200 flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-semibold text-slate-900">
                  Cleaner profile
                </h2>
                <div className="flex items-center gap-2">
                  {profileCleanerDetail && !profileCleanerLoading && (
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setIsEditingCleanerProfile((v) => !v);
                        setEditCleanerError(null);
                        setEditCleanerAvatarFile(null);
                      }}
                    >
                      {isEditingCleanerProfile ? "Stop editing" : "Edit"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    onClick={() => {
                      setProfileCleanerId(null);
                      setProfileCleanerDetail(null);
                      setProfileCleanerError(null);
                      setIsEditingCleanerProfile(false);
                      setEditCleanerAvatarFile(null);
                      setEditCleanerError(null);
                    }}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {profileCleanerLoading ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Loading cleaner details...
                  </div>
                ) : profileCleanerError ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-rose-600">{profileCleanerError}</p>
                    <button
                      type="button"
                      className="mt-3 text-xs font-semibold text-slate-600 hover:underline"
                      onClick={() => {
                        setProfileCleanerId(null);
                        setProfileCleanerDetail(null);
                        setProfileCleanerError(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                ) : profileCleanerDetail ? (
                  <>
                    {isEditingCleanerProfile && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-4">
                        {editCleanerError && (
                          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                            {editCleanerError}
                          </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={editCleanerForm.name}
                              onChange={(e) =>
                                setEditCleanerForm((f) => ({
                                  ...f,
                                  name: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Verification status
                            </label>
                            <select
                              value={editCleanerForm.verification_status}
                              onChange={(e) =>
                                setEditCleanerForm((f) => ({
                                  ...f,
                                  verification_status: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                            >
                              <option value="">(none)</option>
                              <option value="pending">pending</option>
                              <option value="verified">verified</option>
                              <option value="suspended">suspended</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={editCleanerForm.email}
                              onChange={(e) =>
                                setEditCleanerForm((f) => ({
                                  ...f,
                                  email: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={editCleanerForm.phone}
                              onChange={(e) =>
                                setEditCleanerForm((f) => ({
                                  ...f,
                                  phone: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Working areas (comma separated)
                          </label>
                          <input
                            type="text"
                            value={editCleanerForm.workingAreasText}
                            onChange={(e) =>
                              setEditCleanerForm((f) => ({
                                ...f,
                                workingAreasText: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            placeholder="e.g. Sea Point, Camps Bay"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Unavailable dates (comma separated)
                          </label>
                          <input
                            type="text"
                            value={editCleanerForm.unavailableDatesText}
                            onChange={(e) =>
                              setEditCleanerForm((f) => ({
                                ...f,
                                unavailableDatesText: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            placeholder="e.g. 2026-03-20, 2026-03-21"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Profile photo
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              setEditCleanerAvatarFile(file);
                            }}
                            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-white"
                            onClick={() => {
                              if (profileCleanerDetail) {
                                setEditCleanerForm({
                                  name: profileCleanerDetail.name ?? "",
                                  email: profileCleanerDetail.email ?? "",
                                  phone: profileCleanerDetail.phone ?? "",
                                  verification_status:
                                    profileCleanerDetail.verification_status ?? "",
                                  workingAreasText: (profileCleanerDetail.working_areas ?? []).join(
                                    ", "
                                  ),
                                  unavailableDatesText: (
                                    profileCleanerDetail.unavailable_dates ?? []
                                  ).join(", "),
                                });
                              }
                              setIsEditingCleanerProfile(false);
                              setEditCleanerAvatarFile(null);
                              setEditCleanerError(null);
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={editCleanerSaving}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            onClick={handleSaveCleanerProfile}
                          >
                            {editCleanerSaving ? "Saving…" : "Save changes"}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      {profileCleanerDetail.avatar ? (
                        <img
                          src={profileCleanerDetail.avatar}
                          alt={profileCleanerDetail.name}
                          className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl uppercase flex-shrink-0">
                          {profileCleanerDetail.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2) || "—"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-900">
                          {profileCleanerDetail.name}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {profileCleanerDetail.specialty}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge status={profileCleanerDetail.status} />
                          {profileCleanerDetail.verification_status && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                              {profileCleanerDetail.verification_status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Email
                        </p>
                        <p className="text-sm text-slate-800">
                          {profileCleanerDetail.email || "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Phone
                        </p>
                        <p className="text-sm text-slate-800">
                          {profileCleanerDetail.phone || "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Total jobs (confirmed/completed)
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                          {profileCleanerDetail.jobs}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Specialty
                        </p>
                        <p className="text-sm text-slate-800">
                          {profileCleanerDetail.specialty}
                        </p>
                      </div>
                    </div>

                    {profileCleanerDetail.working_areas.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Working areas
                        </p>
                        <p className="text-sm text-slate-800">
                          {profileCleanerDetail.working_areas.join(", ")}
                        </p>
                      </div>
                    )}

                    {profileCleanerDetail.unavailable_dates.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Unavailable dates
                        </p>
                        <p className="text-sm text-slate-800">
                          {profileCleanerDetail.unavailable_dates.join(", ")}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Recent bookings
                      </p>
                      {profileCleanerDetail.recentBookings.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No bookings yet.
                        </p>
                      ) : (
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Customer</th>
                                <th className="px-4 py-2">Service</th>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Amount</th>
                                <th className="px-4 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {profileCleanerDetail.recentBookings.map(
                                (booking) => (
                                  <tr
                                    key={booking.id}
                                    className="hover:bg-slate-50/50"
                                  >
                                    <td className="px-4 py-2 font-mono text-xs text-slate-500">
                                      {formatBookingCode(booking.id)}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-slate-800">
                                      {booking.customer}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                      {booking.service}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                      {booking.date}
                                      {booking.time ? ` ${booking.time}` : ""}
                                    </td>
                                    <td className="px-4 py-2 font-semibold text-slate-800">
                                      R
                                      {booking.totalAmount.toLocaleString(
                                        "en-ZA"
                                      )}
                                    </td>
                                    <td className="px-4 py-2">
                                      <Badge
                                        status={booking.status ?? "pending"}
                                      />
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
              {profileCleanerDetail && !profileCleanerLoading && (
                <div className="px-6 py-3 border-t border-slate-100 flex justify-end flex-shrink-0">
                  <button
                    type="button"
                    className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => {
                      setProfileCleanerId(null);
                      setProfileCleanerDetail(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cleaner schedule modal */}
        {(scheduleCleanerId || scheduleCleanerDetail) && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] border border-slate-200 flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-semibold text-slate-900">
                  Schedule
                </h2>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                  onClick={() => {
                    setScheduleCleanerId(null);
                    setScheduleCleanerDetail(null);
                    setScheduleCleanerError(null);
                  }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {scheduleCleanerLoading ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Loading schedule...
                  </div>
                ) : scheduleCleanerError ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-rose-600">{scheduleCleanerError}</p>
                    <button
                      type="button"
                      className="mt-3 text-xs font-semibold text-slate-600 hover:underline"
                      onClick={() => {
                        setScheduleCleanerId(null);
                        setScheduleCleanerDetail(null);
                        setScheduleCleanerError(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                ) : scheduleCleanerDetail ? (
                  <>
                    <div className="flex items-center gap-3">
                      {scheduleCleanerDetail.avatar ? (
                        <img
                          src={scheduleCleanerDetail.avatar}
                          alt={scheduleCleanerDetail.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase flex-shrink-0 text-sm">
                          {scheduleCleanerDetail.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2) || "—"}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {scheduleCleanerDetail.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {scheduleCleanerDetail.specialty}
                        </p>
                      </div>
                    </div>

                    {scheduleCleanerDetail.working_areas.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Working areas
                        </p>
                        <p className="text-sm text-slate-800">
                          {scheduleCleanerDetail.working_areas.join(", ")}
                        </p>
                      </div>
                    )}

                    {scheduleCleanerDetail.unavailable_dates.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Unavailable dates
                        </p>
                        <p className="text-sm text-slate-800">
                          {scheduleCleanerDetail.unavailable_dates.join(", ")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No unavailable dates set.
                      </p>
                    )}

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Bookings (recent & upcoming)
                      </p>
                      {scheduleCleanerDetail.recentBookings.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No bookings for this cleaner yet.
                        </p>
                      ) : (
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Customer</th>
                                <th className="px-4 py-2">Service</th>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Time</th>
                                <th className="px-4 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {scheduleCleanerDetail.recentBookings.map(
                                (booking) => (
                                  <tr
                                    key={booking.id}
                                    className="hover:bg-slate-50/50"
                                  >
                                    <td className="px-4 py-2 font-mono text-xs text-slate-500">
                                      {formatBookingCode(booking.id)}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-slate-800">
                                      {booking.customer}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                      {booking.service}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                      {booking.date}
                                    </td>
                                    <td className="px-4 py-2 text-slate-600">
                                      {booking.time || "—"}
                                    </td>
                                    <td className="px-4 py-2">
                                      <Badge
                                        status={booking.status ?? "pending"}
                                      />
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
              {scheduleCleanerDetail && !scheduleCleanerLoading && (
                <div className="px-6 py-3 border-t border-slate-100 flex justify-end flex-shrink-0">
                  <button
                    type="button"
                    className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => {
                      setScheduleCleanerId(null);
                      setScheduleCleanerDetail(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
