"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Calendar,
  Users,
  CreditCard,
  Briefcase,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Star,
  Zap,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  MessageSquareQuote,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdminProfile } from "@/lib/dashboard-types";
import type { AdminBookingRow, AdminBookingFilters } from "@/app/actions/dashboard";
import type {
  AdminCleanerRow,
  PayoutStatsForAdmin,
  AdminPayoutRow,
  PlatformScaleForAdmin,
  QuoteRequestRowForAdmin,
  PricingConfigRowForAdmin,
} from "@/app/actions/admin";
import type { BlogPost, BlogPostInput } from "@/lib/blog-types";
import { RichTextEditor } from "./RichTextEditor";
import {
  updateCleanerVerification,
  updateBookingStatusForAdmin,
  updateBookingAssignmentForAdmin,
  updateBookingTeamAssignmentsForAdmin,
  updateBookingDateTimeForAdmin,
  getPayoutStatsForAdmin,
  getPayoutsForAdmin,
  getPlatformScaleForAdmin,
  getPlatformSettingsForAdmin,
  updatePlatformSettingsForAdmin,
  getQuoteRequestsForAdmin,
  updateQuoteRequestForAdmin,
  getSuggestedQuoteFromPricing,
  getPricingConfigForAdmin,
  upsertPricingConfigForAdmin,
  deactivatePricingConfigForAdmin,
} from "@/app/actions/admin";
import {
  getBlogPostsForAdmin,
  createOrUpdateBlogPost,
  deleteBlogPost,
  togglePublishBlogPost,
  uploadBlogImage,
} from "@/app/actions/blog";
import { getRebookPayload } from "@/app/actions/booking";
import { initializePaystackTransaction } from "@/app/actions/paystack";
import { TEAM_ID_TO_NAME } from "@/lib/constants";

export type AdminDashboardTab =
  | "overview"
  | "all-bookings"
  | "quote-requests"
  | "pricing"
   | "blog"
  | "crew"
  | "finance"
  | "settings";

const SERVICE_OPTIONS = [
  { value: "", label: "All services" },
  { value: "standard", label: "Standard" },
  { value: "deep", label: "Deep" },
  { value: "move", label: "Move In/Out" },
  { value: "airbnb", label: "Airbnb" },
  { value: "carpet", label: "Carpet" },
] as const;

const SERVICE_SLUG_TO_TYPE: Record<string, string> = {
  standard: "Standard",
  deep: "Deep",
  move: "Move In/Out",
  airbnb: "Airbnb",
  carpet: "Carpet",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All payments" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
] as const;

const PRICE_TYPE_OPTIONS = [
  { value: "base", label: "Base" },
  { value: "bedroom", label: "Bedroom" },
  { value: "bathroom", label: "Bathroom" },
  { value: "extra", label: "Extra" },
  { value: "service_fee", label: "Service fee" },
  { value: "frequency_discount", label: "Frequency discount" },
  { value: "equipment_charge", label: "Equipment charge" },
] as const;

const TIME_SLOTS = ["08:00", "10:00", "13:00", "15:00"];

export const AdminDashboard = ({
  admin,
  adminBookings = [],
  adminCleaners = [],
  bookingFilters = {},
  onRefreshCleaners,
  onRefreshBookings,
  onBookingFiltersChange,
  onLogout,
  activeTab: controlledTab,
  onTabChange,
}: {
  admin: AdminProfile;
  adminBookings?: AdminBookingRow[];
  adminCleaners?: AdminCleanerRow[];
  bookingFilters?: AdminBookingFilters;
  onRefreshCleaners?: () => void;
  onRefreshBookings?: () => void;
  onBookingFiltersChange?: (filters: AdminBookingFilters) => void;
  onLogout: () => void;
  activeTab?: AdminDashboardTab;
  onTabChange?: (tab: AdminDashboardTab) => void;
}) => {
  const [internalTab, setInternalTab] = useState<AdminDashboardTab>("overview");
  const [payoutStats, setPayoutStats] = useState<PayoutStatsForAdmin | null>(null);
  const [payoutList, setPayoutList] = useState<AdminPayoutRow[]>([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [platformScaleData, setPlatformScaleData] = useState<PlatformScaleForAdmin | null>(null);
  const [platformScaleLoading, setPlatformScaleLoading] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [rescheduleDraft, setRescheduleDraft] = useState<Record<string, { date: string; time: string }>>({});
  const [teamSelectionDraft, setTeamSelectionDraft] = useState<Record<string, string[]>>({});
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<AdminBookingFilters>(() => ({ ...bookingFilters }));
  const [settingsBookingNotifications, setSettingsBookingNotifications] = useState(true);
  const [settingsAutomaticPayouts, setSettingsAutomaticPayouts] = useState(false);
  const [settingsPeakSeasonPricing, setSettingsPeakSeasonPricing] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [rebookBooking, setRebookBooking] = useState<AdminBookingRow | null>(null);
  const [rebookDate, setRebookDate] = useState("");
  const [rebookTime, setRebookTime] = useState("");
  const [rebookLoading, setRebookLoading] = useState(false);
  const [rebookError, setRebookError] = useState<string | null>(null);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequestRowForAdmin[]>([]);
  const [quoteRequestsLoading, setQuoteRequestsLoading] = useState(false);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [quoteUpdateDraft, setQuoteUpdateDraft] = useState<Record<string, { status: string; admin_notes: string; quoted_amount: string }>>({});
  const [quoteUpdatingId, setQuoteUpdatingId] = useState<string | null>(null);
  const [pricingRows, setPricingRows] = useState<PricingConfigRowForAdmin[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSavingId, setPricingSavingId] = useState<string | "new" | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingServiceFilter, setPricingServiceFilter] = useState<string>("");
  const [pricingIncludeInactive, setPricingIncludeInactive] = useState(false);
  const [pricingEditDraft, setPricingEditDraft] = useState<
    Record<
      string,
      {
        price: string;
        effective_date: string;
        end_date: string;
        is_active: boolean;
        notes: string;
      }
    >
  >({});
  const [pricingNewRule, setPricingNewRule] = useState<{
    serviceSlug: string;
    price_type: string;
    item_name: string;
    price: string;
    effective_date: string;
    end_date: string;
    is_active: boolean;
    notes: string;
  }>({
    serviceSlug: "",
    price_type: "base",
    item_name: "",
    price: "",
    effective_date: "",
    end_date: "",
    is_active: true,
    notes: "",
  });
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogSearch, setBlogSearch] = useState("");
  const [blogStatusFilter, setBlogStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [blogEditingId, setBlogEditingId] = useState<string | "new" | null>(null);
  const [blogDraft, setBlogDraft] = useState<BlogPostInput | null>(null);
  const [blogImageUploadingTarget, setBlogImageUploadingTarget] = useState<"og" | "twitter" | null>(null);
  const reloadPricing = useCallback(async () => {
    setPricingLoading(true);
    setPricingError(null);
    const filters: { serviceType?: string | null; includeInactive?: boolean } = {};
    if (pricingServiceFilter) {
      const serviceType = SERVICE_SLUG_TO_TYPE[pricingServiceFilter] ?? pricingServiceFilter;
      filters.serviceType = serviceType;
    }
    if (pricingIncludeInactive) {
      filters.includeInactive = true;
    }
    try {
      const rows = await getPricingConfigForAdmin(filters);
      setPricingRows(rows ?? []);
    } catch {
      setPricingRows([]);
      setPricingError("Failed to load pricing configuration.");
    } finally {
      setPricingLoading(false);
    }
  }, [pricingServiceFilter, pricingIncludeInactive]);
  const reloadBlogPosts = useCallback(async () => {
    setBlogLoading(true);
    setBlogError(null);
    try {
      const rows = await getBlogPostsForAdmin();
      setBlogPosts(rows ?? []);
    } catch {
      setBlogPosts([]);
      setBlogError("Failed to load blog posts.");
    } finally {
      setBlogLoading(false);
    }
  }, []);
  const isControlled = controlledTab !== undefined && onTabChange !== undefined;
  useEffect(() => {
    if (filtersPanelOpen) setFilterDraft({ ...bookingFilters });
  }, [filtersPanelOpen, bookingFilters]);
  const activeTab = isControlled ? controlledTab! : internalTab;
  const setActiveTab = isControlled ? onTabChange! : setInternalTab;
  const tabs = [
    { id: "overview" as const, label: "Admin", icon: <Layers className="w-5 h-5" /> },
    { id: "all-bookings" as const, label: "Bookings", icon: <Calendar className="w-5 h-5" /> },
    { id: "quote-requests" as const, label: "Quotes", icon: <MessageSquareQuote className="w-5 h-5" /> },
    { id: "pricing" as const, label: "Pricing", icon: <Zap className="w-5 h-5" /> },
    { id: "blog" as const, label: "Blog", icon: <BookOpen className="w-5 h-5" /> },
    { id: "crew" as const, label: "Crew", icon: <Users className="w-5 h-5" /> },
    { id: "finance" as const, label: "Finance", icon: <CreditCard className="w-5 h-5" /> },
    { id: "settings" as const, label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  useEffect(() => {
    if (activeTab !== "blog") return;
    reloadBlogPosts();
  }, [activeTab, reloadBlogPosts]);

  useEffect(() => {
    if (activeTab !== "finance") return;
    setFinanceLoading(true);
    Promise.all([getPayoutStatsForAdmin(), getPayoutsForAdmin({ limit: 30 })])
      .then(([stats, list]) => {
        setPayoutStats(stats ?? null);
        setPayoutList(list ?? []);
      })
      .finally(() => setFinanceLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "overview") return;
    setPlatformScaleLoading(true);
    getPlatformScaleForAdmin()
      .then((data) => setPlatformScaleData(data ?? null))
      .finally(() => setPlatformScaleLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "settings") return;
    setSettingsLoading(true);
    getPlatformSettingsForAdmin()
      .then((data) => {
        if (data) {
          setSettingsBookingNotifications(data.booking_notifications_enabled);
          setSettingsAutomaticPayouts(data.automatic_payouts_enabled);
          setSettingsPeakSeasonPricing(data.peak_season_pricing_enabled);
        }
      })
      .finally(() => setSettingsLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "quote-requests") return;
    setQuoteRequestsLoading(true);
    getQuoteRequestsForAdmin()
      .then((data) => setQuoteRequests(data ?? []))
      .finally(() => setQuoteRequestsLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "pricing") return;
    reloadPricing();
  }, [activeTab, reloadPricing]);

  const stats = admin.stats;
  const formatRevenue = (n: number) =>
    n >= 1000 ? `R${(n / 1000).toFixed(1)}K` : `R${n}`;

  const cleanerAssignOptions = useMemo(
    () => (adminCleaners ?? []).map((c) => ({ value: c.cleanerId, label: c.name || "Cleaner" })),
    [adminCleaners]
  );

  const pricingGroups = useMemo(
    () => {
      const groups: Record<string, PricingConfigRowForAdmin[]> = {};
      for (const row of pricingRows) {
        const key = row.service_type ?? "Global";
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      }
      const keys = Object.keys(groups).sort((a, b) => {
        if (a === "Global") return -1;
        if (b === "Global") return 1;
        return a.localeCompare(b);
      });
      return keys.map((key) => ({
        key,
        label: key === "Global" ? "Global (extras & fees)" : key,
        rows: groups[key],
      }));
    },
    [pricingRows]
  );
  const filteredBlogPosts = useMemo(
    () =>
      blogPosts.filter((post) => {
        if (blogStatusFilter !== "all" && post.status !== blogStatusFilter) return false;
        if (!blogSearch.trim()) return true;
        const q = blogSearch.toLowerCase();
        return (
          post.title.toLowerCase().includes(q) ||
          (post.excerpt ?? "").toLowerCase().includes(q) ||
          post.slug.toLowerCase().includes(q)
        );
      }),
    [blogPosts, blogStatusFilter, blogSearch]
  );

  const startNewBlogPost = () => {
    setBlogEditingId("new");
    setBlogError(null);
    setBlogDraft({
      title: "",
      content: "",
      excerpt: "",
      category: "",
      status: "draft",
      seo_title: "",
      seo_description: "",
      seo_keywords: "",
      canonical_url: "",
      og_title: "",
      og_description: "",
      og_image_url: "",
      twitter_title: "",
      twitter_description: "",
      twitter_image_url: "",
      indexable: true,
      follow_links: true,
      structured_data: "",
    });
  };

  const startEditBlogPost = (post: BlogPost) => {
    setBlogEditingId(post.id);
    setBlogError(null);
    setBlogDraft({
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category,
      status: post.status,
      published_at: post.published_at,
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      seo_keywords: post.seo_keywords,
      canonical_url: post.canonical_url,
      og_title: post.og_title,
      og_description: post.og_description,
      og_image_url: post.og_image_url,
      twitter_title: post.twitter_title,
      twitter_description: post.twitter_description,
      twitter_image_url: post.twitter_image_url,
      indexable: post.indexable,
      follow_links: post.follow_links,
      structured_data: post.structured_data ?? null,
    });
  };

  const resetBlogEditor = () => {
    setBlogEditingId(null);
    setBlogDraft(null);
    setBlogError(null);
  };

  const updateBlogDraft = (patch: Partial<BlogPostInput>) => {
    setBlogDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleBlogImageFileChange =
    (target: "og" | "twitter") => async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!blogDraft) return;
      const file = e.target.files?.[0];
      if (!file) return;

      setBlogError(null);

      if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
        setBlogError("Use a JPEG, PNG, GIF, or WebP image.");
        e.target.value = "";
        return;
      }

      if (file.size > 4 * 1024 * 1024) {
        setBlogError("Image must be 4MB or smaller.");
        e.target.value = "";
        return;
      }

      const formData = new FormData();
      formData.set("image", file);

      try {
        setBlogImageUploadingTarget(target);
        const res = await uploadBlogImage(formData);
        if (!res.ok) {
          setBlogError(res.error);
          return;
        }

        if (target === "og") {
          updateBlogDraft({
            og_image_url: res.url,
            twitter_image_url: blogDraft.twitter_image_url || blogDraft.og_image_url || res.url,
          });
        } else {
          updateBlogDraft({ twitter_image_url: res.url });
        }
      } catch {
        setBlogError("Failed to upload image.");
      } finally {
        setBlogImageUploadingTarget(null);
        e.target.value = "";
      }
    };

  const handleSaveBlogPost = async () => {
    if (!blogDraft) return;
    setBlogSaving(true);
    setBlogError(null);
    const result = await createOrUpdateBlogPost(blogDraft);
    setBlogSaving(false);
    if (!result.ok) {
      setBlogError(result.error);
      return;
    }
    resetBlogEditor();
    await reloadBlogPosts();
  };

  const handleDeleteBlogPost = async (id: string) => {
    if (!id) return;
    setBlogSaving(true);
    setBlogError(null);
    const result = await deleteBlogPost(id);
    setBlogSaving(false);
    if (!result.ok) {
      setBlogError(result.error);
      return;
    }
    if (blogEditingId === id) {
      resetBlogEditor();
    }
    await reloadBlogPosts();
  };

  const handleTogglePublishBlogPost = async (post: BlogPost) => {
    setBlogSaving(true);
    setBlogError(null);
    const result = await togglePublishBlogPost(post.id, post.status !== "published");
    setBlogSaving(false);
    if (!result.ok) {
      setBlogError(result.error);
      return;
    }
    await reloadBlogPosts();
  };

  const handleSavePricingRow = async (row: PricingConfigRowForAdmin) => {
    const draft =
      pricingEditDraft[row.id] ?? {
        price: String(row.price),
        effective_date: row.effective_date,
        end_date: row.end_date ?? "",
        is_active: row.is_active,
        notes: row.notes ?? "",
      };
    const priceValue = draft.price ? parseFloat(draft.price) : NaN;
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setPricingError("Enter a valid price.");
      return;
    }
    setPricingSavingId(row.id);
    setPricingError(null);
    const result = await upsertPricingConfigForAdmin({
      id: row.id,
      service_type: row.service_type,
      price_type: row.price_type,
      item_name: row.item_name,
      price: priceValue,
      effective_date: draft.effective_date || row.effective_date,
      end_date: draft.end_date || null,
      is_active: draft.is_active,
      notes: draft.notes || null,
    });
    setPricingSavingId(null);
    if (!result.ok) {
      setPricingError(result.error ?? "Failed to save price rule.");
      return;
    }
    setPricingEditDraft((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    await reloadPricing();
  };

  const handleDeactivatePricingRow = async (row: PricingConfigRowForAdmin) => {
    setPricingSavingId(row.id);
    setPricingError(null);
    const draft = pricingEditDraft[row.id];
    const endDateArg = draft?.end_date || undefined;
    const result = await deactivatePricingConfigForAdmin(row.id, endDateArg);
    setPricingSavingId(null);
    if (!result.ok) {
      setPricingError(result.error ?? "Failed to deactivate price rule.");
      return;
    }
    await reloadPricing();
  };

  const handleCreatePricingRule = async () => {
    const priceValue = pricingNewRule.price ? parseFloat(pricingNewRule.price) : NaN;
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setPricingError("Enter a valid price for the new rule.");
      return;
    }
    let serviceType: string | null = null;
    if (pricingNewRule.serviceSlug) {
      serviceType = SERVICE_SLUG_TO_TYPE[pricingNewRule.serviceSlug] ?? pricingNewRule.serviceSlug;
    }
    setPricingSavingId("new");
    setPricingError(null);
    const result = await upsertPricingConfigForAdmin({
      service_type: serviceType,
      price_type: pricingNewRule.price_type,
      item_name: pricingNewRule.item_name || null,
      price: priceValue,
      effective_date: pricingNewRule.effective_date || undefined,
      end_date: pricingNewRule.end_date || undefined,
      is_active: pricingNewRule.is_active,
      notes: pricingNewRule.notes || null,
    });
    setPricingSavingId(null);
    if (!result.ok) {
      setPricingError(result.error ?? "Failed to create price rule.");
      return;
    }
    setPricingNewRule({
      serviceSlug: "",
      price_type: "base",
      item_name: "",
      price: "",
      effective_date: "",
      end_date: "",
      is_active: true,
      notes: "",
    });
    await reloadPricing();
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-24 md:pb-0 px-1 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
              Admin Control
            </h2>
            <p className="text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-widest">
              Global Platform Overview
            </p>
          </div>
          <button
            onClick={onLogout}
            className="md:hidden p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-3 p-4 md:p-0 bg-white md:bg-transparent rounded-[24px] shadow-sm md:shadow-none border md:border-none border-slate-100">
          <div className="flex flex-col md:items-end">
            <p className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              System Health
            </p>
            <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> 100% Operational
            </p>
          </div>
          <div className="md:hidden w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {!isControlled && (
        <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
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
            className="space-y-8"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Total Revenue
                </p>
                <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">
                  {formatRevenue(stats.totalRevenue)}
                </p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Active Crew
                </p>
                <p className="text-xl md:text-2xl font-black text-slate-900">{stats.activeCleaners}</p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Pending
                </p>
                <p className="text-xl md:text-2xl font-black text-amber-500">
                  {stats.pendingBookings}
                </p>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  CSAT
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xl md:text-2xl font-black text-slate-900">
                    {stats.customerSatisfaction}
                  </p>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-base md:text-lg font-black text-slate-900">Recent Pulse</h4>
                  <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Live View
                  </button>
                </div>
                <div className="space-y-4">
                  {adminBookings.slice(0, 4).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                          {b.customerAvatarUrl ? (
                            <img
                              src={b.customerAvatarUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <CreditCard className="w-4.5 h-4.5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs md:text-sm font-black text-slate-900">
                            {b.customerName}
                          </p>
                          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {b.date} • R{b.total}
                          </p>
                        </div>
                      </div>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                  ))}
                  {adminBookings.length === 0 && (
                    <p className="text-sm text-slate-500 py-4">No recent bookings.</p>
                  )}
                </div>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-base md:text-lg font-black text-slate-900">Platform Scale</h4>
                  {platformScaleLoading ? (
                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase">…</span>
                  ) : platformScaleData?.growthPercent != null ? (
                    <div
                      className={`flex items-center gap-1 font-black text-[9px] md:text-[10px] uppercase ${
                        platformScaleData.growthPercent >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      <Zap
                        className={`w-3 h-3 ${platformScaleData.growthPercent >= 0 ? "fill-emerald-500 text-emerald-500" : "fill-red-500 text-red-500"}`}
                      />
                      {platformScaleData.growthPercent >= 0 ? "+" : ""}
                      {platformScaleData.growthPercent.toFixed(0)}%
                    </div>
                  ) : (
                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase">—</span>
                  )}
                </div>
                {platformScaleLoading ? (
                  <div className="flex items-end gap-1.5 md:gap-2 h-32 md:h-48 pt-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-slate-100 rounded-t-lg animate-pulse"
                        style={{ height: "100%" }}
                      />
                    ))}
                  </div>
                ) : platformScaleData && platformScaleData.values.some((v) => v > 0) ? (
                  <>
                    <div className="flex items-end gap-1.5 md:gap-2 h-32 md:h-48 pt-4">
                      {(() => {
                        const max = Math.max(...platformScaleData.values, 1);
                        return platformScaleData.values.map((v, i) => {
                          const h = Math.round((v / max) * 100);
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-slate-100 rounded-t-lg relative group transition-all hover:bg-blue-100 min-w-0 flex flex-col items-center"
                            >
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-lg transition-all w-full"
                                style={{ height: `${h}%` }}
                              />
                            </div>
                          );
                        });
                      })()}
                    </div>
                    {platformScaleData.periodLabels.length > 0 && (
                      <div className="flex gap-1.5 md:gap-2 mt-2 justify-between text-[9px] font-bold text-slate-400">
                        {platformScaleData.periodLabels.map((label, i) => (
                          <span key={i} className="flex-1 min-w-0 truncate text-center" title={label}>
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-32 md:h-48 pt-4 flex items-center justify-center text-slate-500 text-sm">
                    No revenue data for the last 10 weeks.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "all-bookings" && (
          <motion.div
            key="all-bookings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Global Bookings
              </h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFiltersPanelOpen((open) => !open)}
                  className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    filtersPanelOpen || Object.values(bookingFilters).some(Boolean)
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filters
                  {Object.values(bookingFilters).some(Boolean) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersPanelOpen ? "rotate-180" : ""}`} />
                </button>
                {filtersPanelOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden
                      onClick={() => setFiltersPanelOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Filter bookings
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Booking status
                          </label>
                          <select
                            value={filterDraft.status ?? ""}
                            onChange={(e) => setFilterDraft((d) => ({ ...d, status: e.target.value || undefined }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold bg-white"
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value || "all"} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Payment status
                          </label>
                          <select
                            value={filterDraft.payment_status ?? ""}
                            onChange={(e) =>
                              setFilterDraft((d) => ({ ...d, payment_status: e.target.value || undefined }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold bg-white"
                          >
                            {PAYMENT_STATUS_OPTIONS.map((o) => (
                              <option key={o.value || "all"} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Service
                          </label>
                          <select
                            value={filterDraft.service ?? ""}
                            onChange={(e) => setFilterDraft((d) => ({ ...d, service: e.target.value || undefined }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold bg-white"
                          >
                            {SERVICE_OPTIONS.map((o) => (
                              <option key={o.value || "all"} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterDraft({});
                            onBookingFiltersChange?.({});
                            setFiltersPanelOpen(false);
                            onRefreshBookings?.();
                          }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onBookingFiltersChange?.(filterDraft);
                            setFiltersPanelOpen(false);
                            onRefreshBookings?.();
                          }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="hidden md:block bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Service
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Date/Time
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBookings.map((b) => {
                      const isExpanded = expandedBookingId === b.id;
                      const isUpdating = updatingBookingId === b.id;
                      const handleStatusChange = async (value: string) => {
                        if (value === b.statusRaw) return;
                        setUpdatingBookingId(b.id);
                        const result = await updateBookingStatusForAdmin(b.id, { status: value });
                        setUpdatingBookingId(null);
                        if (result.ok) onRefreshBookings?.();
                      };
                      const handlePaymentStatusChange = async (value: string) => {
                        if (value === b.paymentStatus) return;
                        setUpdatingBookingId(b.id);
                        const result = await updateBookingStatusForAdmin(b.id, { payment_status: value });
                        setUpdatingBookingId(null);
                        if (result.ok) onRefreshBookings?.();
                      };
                      const statusRaw = b.statusRaw ?? "confirmed";
                      const paymentStatus = b.paymentStatus ?? "paid";
                      return (
                        <React.Fragment key={b.id}>
                          <tr
                            onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                            className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                                  {b.customerAvatarUrl ? (
                                    <img
                                      src={b.customerAvatarUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-slate-200" />
                                  )}
                                </div>
                                <p className="text-sm font-black text-slate-900">{b.customerName}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-600">
                                {b.service.charAt(0).toUpperCase() + b.service.slice(1)} Clean
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-600">
                                {b.date} • {b.time}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  b.status === "completed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : b.status === "upcoming"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-black text-slate-900">R{b.total}</p>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <span
                                className={`inline-block p-2 text-slate-400 hover:text-blue-600 transition-all ${isExpanded ? "rotate-90" : ""}`}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      Address &amp; contact
                                    </p>
                                    <p className="font-bold text-slate-800">{b.address ?? "—"}</p>
                                    {b.instructions && (
                                      <p className="text-slate-600">{b.instructions}</p>
                                    )}
                                    <p className="text-slate-600">{b.customerEmail ?? "—"}</p>
                                    <p className="text-slate-600">{b.customerPhone ?? "—"}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      Property &amp; pricing
                                    </p>
                                    <p className="text-slate-700">
                                      {b.propertyType ?? "—"} • {b.bedrooms ?? 0} bed, {b.bathrooms ?? 0} bath • {b.workingArea ?? "—"}
                                    </p>
                                    {b.extras?.length > 0 && (
                                      <p className="text-slate-600">Extras: {b.extras.join(", ")}</p>
                                    )}
                                    <p className="text-slate-700">
                                      Subtotal R{b.subtotal ?? 0} − Discount R{b.discountAmount ?? 0} + Tip R{b.tipAmount ?? 0} = R{b.total}
                                    </p>
                                    <p className="text-slate-600">
                                      Payment: {b.paymentMethod ?? "—"}
                                      {b.paymentRef ? ` (${b.paymentRef})` : ""}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      Booking status
                                    </span>
                                    <select
                                      value={statusRaw}
                                      onChange={(e) => handleStatusChange(e.target.value)}
                                      disabled={isUpdating}
                                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                                    >
                                      <option value="confirmed">Confirmed</option>
                                      <option value="completed">Completed</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      Payment status
                                    </span>
                                    <select
                                      value={paymentStatus}
                                      onChange={(e) => handlePaymentStatusChange(e.target.value)}
                                      disabled={isUpdating}
                                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                                    >
                                      <option value="paid">Paid</option>
                                      <option value="pending">Pending</option>
                                      <option value="refunded">Refunded</option>
                                    </select>
                                  </div>
                                  {(b.service === "deep" || b.service === "move") ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Assign team members
                                      </span>
                                      <div className="rounded-xl border border-slate-200 bg-white min-w-[180px] max-h-32 overflow-auto px-2 py-1.5">
                                        {cleanerAssignOptions.map((opt) => {
                                          const ids = teamSelectionDraft[b.id] ?? b.assignedTeamCleanerIds ?? [];
                                          const checked = ids.includes(opt.value);
                                          return (
                                            <label key={opt.value} className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-slate-50 rounded px-1 -mx-1 text-xs">
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => {
                                                  const next = checked ? ids.filter((id) => id !== opt.value) : [...ids, opt.value];
                                                  setTeamSelectionDraft((prev) => ({ ...prev, [b.id]: next }));
                                                }}
                                                disabled={isUpdating}
                                                className="rounded border-slate-300"
                                              />
                                              <span className="font-medium text-slate-800">{opt.label}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                      <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={async () => {
                                          const ids = teamSelectionDraft[b.id] ?? b.assignedTeamCleanerIds ?? [];
                                          setUpdatingBookingId(b.id);
                                          const result = await updateBookingTeamAssignmentsForAdmin(b.id, ids);
                                          setUpdatingBookingId(null);
                                          if (result.ok) {
                                            setTeamSelectionDraft((prev) => ({ ...prev, [b.id]: ids }));
                                            onRefreshBookings?.();
                                          }
                                        }}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        Save team
                                      </button>
                                      {(b.assignedTeamCleanerIds?.length ?? 0) > 0 && (
                                        <span className="text-xs text-slate-600">
                                          Team: {(b.assignedTeamCleanerIds ?? []).map((id) => adminCleaners?.find((c) => c.cleanerId === id)?.name ?? id).join(", ")}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                          Assign cleaner
                                        </span>
                                        <select
                                          value={b.cleanerId ?? ""}
                                          onChange={async (e) => {
                                            const value = e.target.value || null;
                                            setUpdatingBookingId(b.id);
                                            const result = await updateBookingAssignmentForAdmin(b.id, {
                                              cleaner_id: value,
                                              team_id: null,
                                            });
                                            setUpdatingBookingId(null);
                                            if (result.ok) onRefreshBookings?.();
                                          }}
                                          disabled={isUpdating}
                                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white min-w-[140px]"
                                        >
                                          <option value="">Unassigned</option>
                                          {cleanerAssignOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                              {opt.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                          Assign team
                                        </span>
                                        <select
                                          value={b.teamId ?? ""}
                                          onChange={async (e) => {
                                            const value = e.target.value || null;
                                            setUpdatingBookingId(b.id);
                                            const result = await updateBookingAssignmentForAdmin(b.id, {
                                              cleaner_id: null,
                                              team_id: value,
                                            });
                                            setUpdatingBookingId(null);
                                            if (result.ok) onRefreshBookings?.();
                                          }}
                                          disabled={isUpdating}
                                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white min-w-[180px]"
                                        >
                                          <option value="">Unassigned</option>
                                          {Object.entries(TEAM_ID_TO_NAME).map(([id, name]) => (
                                            <option key={id} value={id}>
                                              {name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </>
                                  )}
                                  {b.status === "upcoming" && (
                                    <div className="flex flex-wrap items-end gap-2">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Reschedule
                                      </span>
                                      <input
                                        type="date"
                                        value={rescheduleDraft[b.id]?.date ?? b.date}
                                        onChange={(e) =>
                                          setRescheduleDraft((prev) => ({
                                            ...prev,
                                            [b.id]: {
                                              date: e.target.value,
                                              time: prev[b.id]?.time ?? b.time,
                                            },
                                          }))
                                        }
                                        disabled={isUpdating}
                                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                                      />
                                      <select
                                        value={rescheduleDraft[b.id]?.time ?? b.time}
                                        onChange={(e) =>
                                          setRescheduleDraft((prev) => ({
                                            ...prev,
                                            [b.id]: {
                                              date: prev[b.id]?.date ?? b.date,
                                              time: e.target.value,
                                            },
                                          }))
                                        }
                                        disabled={isUpdating}
                                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                                      >
                                        {TIME_SLOTS.map((slot) => (
                                          <option key={slot} value={slot}>
                                            {slot}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const draft = rescheduleDraft[b.id] ?? { date: b.date, time: b.time };
                                          setUpdatingBookingId(b.id);
                                          const result = await updateBookingDateTimeForAdmin(b.id, draft);
                                          setUpdatingBookingId(null);
                                          if (result.ok) {
                                            setRescheduleDraft((prev) => {
                                              const next = { ...prev };
                                              delete next[b.id];
                                              return next;
                                            });
                                            onRefreshBookings?.();
                                          }
                                        }}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRebookBooking(b);
                                        setRebookDate("");
                                        setRebookTime("");
                                        setRebookError(null);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    >
                                      Rebook
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {adminBookings.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">No bookings yet.</div>
              )}
            </div>

            <div className="md:hidden space-y-3">
              {adminBookings.length === 0 ? (
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm text-center text-slate-500 text-sm">
                  No bookings yet.
                </div>
              ) : (
                adminBookings.map((b) => {
                  const isExpanded = expandedBookingId === b.id;
                  const isUpdating = updatingBookingId === b.id;
                  const handleStatusChange = async (value: string) => {
                    if (value === b.statusRaw) return;
                    setUpdatingBookingId(b.id);
                    const result = await updateBookingStatusForAdmin(b.id, { status: value });
                    setUpdatingBookingId(null);
                    if (result.ok) onRefreshBookings?.();
                  };
                  const handlePaymentStatusChange = async (value: string) => {
                    if (value === b.paymentStatus) return;
                    setUpdatingBookingId(b.id);
                    const result = await updateBookingStatusForAdmin(b.id, { payment_status: value });
                    setUpdatingBookingId(null);
                    if (result.ok) onRefreshBookings?.();
                  };
                  const statusRaw = b.statusRaw ?? "confirmed";
                  const paymentStatus = b.paymentStatus ?? "paid";
                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden"
                    >
                      <div
                        onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                        className="p-4 space-y-3 cursor-pointer active:bg-slate-50/50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                              {b.customerAvatarUrl ? (
                                <img
                                  src={b.customerAvatarUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-200" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{b.customerName}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {b.service} Clean
                              </p>
                            </div>
                          </div>
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                              b.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : b.status === "upcoming"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            <ChevronRight
                              className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            />
                            {b.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <p className="text-[10px] font-bold text-slate-500">
                            {b.date} at {b.time}
                          </p>
                          <p className="text-sm font-black text-slate-900">R{b.total}</p>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-3" onClick={(e) => e.stopPropagation()}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-3">
                            Address &amp; contact
                          </p>
                          <p className="text-xs font-bold text-slate-800">{b.address ?? "—"}</p>
                          {b.instructions && (
                            <p className="text-xs text-slate-600">{b.instructions}</p>
                          )}
                          <p className="text-xs text-slate-600">{b.customerEmail ?? "—"}</p>
                          <p className="text-xs text-slate-600">{b.customerPhone ?? "—"}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Property &amp; pricing
                          </p>
                          <p className="text-xs text-slate-700">
                            {b.propertyType ?? "—"} • {b.bedrooms ?? 0} bed, {b.bathrooms ?? 0} bath • {b.workingArea ?? "—"}
                          </p>
                          <p className="text-xs text-slate-700">
                            Subtotal R{b.subtotal ?? 0} − R{b.discountAmount ?? 0} + Tip R{b.tipAmount ?? 0} = R{b.total}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Update status
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Booking</label>
                              <select
                                value={statusRaw}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={isUpdating}
                                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Payment</label>
                              <select
                                value={paymentStatus}
                                onChange={(e) => handlePaymentStatusChange(e.target.value)}
                                disabled={isUpdating}
                                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                              >
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            </div>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                            Assign to
                          </p>
                          {(b.service === "deep" || b.service === "move") ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Team members (select multiple)</label>
                              <div className="rounded-xl border border-slate-200 bg-white min-w-[200px] max-h-40 overflow-auto px-2 py-1.5">
                                {cleanerAssignOptions.map((opt) => {
                                  const ids = teamSelectionDraft[b.id] ?? b.assignedTeamCleanerIds ?? [];
                                  const checked = ids.includes(opt.value);
                                  return (
                                    <label key={opt.value} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-slate-50 rounded px-1 -mx-1 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          const next = checked ? ids.filter((id) => id !== opt.value) : [...ids, opt.value];
                                          setTeamSelectionDraft((prev) => ({ ...prev, [b.id]: next }));
                                        }}
                                        disabled={isUpdating}
                                        className="rounded border-slate-300"
                                      />
                                      <span className="font-medium text-slate-800">{opt.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={async () => {
                                  const ids = teamSelectionDraft[b.id] ?? b.assignedTeamCleanerIds ?? [];
                                  setUpdatingBookingId(b.id);
                                  const result = await updateBookingTeamAssignmentsForAdmin(b.id, ids);
                                  setUpdatingBookingId(null);
                                  if (result.ok) {
                                    setTeamSelectionDraft((prev) => ({ ...prev, [b.id]: ids }));
                                    onRefreshBookings?.();
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                Save team
                              </button>
                              {(b.assignedTeamCleanerIds?.length ?? 0) > 0 && (
                                <span className="text-xs text-slate-600">
                                  Team: {(b.assignedTeamCleanerIds ?? []).map((id) => adminCleaners?.find((c) => c.cleanerId === id)?.name ?? id).join(", ")}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-3">
                              <div className="flex items-center gap-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Cleaner</label>
                                <select
                                  value={b.cleanerId ?? ""}
                                  onChange={async (e) => {
                                    const value = e.target.value || null;
                                    setUpdatingBookingId(b.id);
                                    const result = await updateBookingAssignmentForAdmin(b.id, {
                                      cleaner_id: value,
                                      team_id: null,
                                    });
                                    setUpdatingBookingId(null);
                                    if (result.ok) onRefreshBookings?.();
                                  }}
                                  disabled={isUpdating}
                                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                                >
                                  <option value="">Unassigned</option>
                                  {cleanerAssignOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Team</label>
                                <select
                                  value={b.teamId ?? ""}
                                  onChange={async (e) => {
                                    const value = e.target.value || null;
                                    setUpdatingBookingId(b.id);
                                    const result = await updateBookingAssignmentForAdmin(b.id, {
                                      cleaner_id: null,
                                      team_id: value,
                                    });
                                    setUpdatingBookingId(null);
                                    if (result.ok) onRefreshBookings?.();
                                  }}
                                  disabled={isUpdating}
                                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                                >
                                  <option value="">Unassigned</option>
                                  {Object.entries(TEAM_ID_TO_NAME).map(([id, name]) => (
                                    <option key={id} value={id}>
                                      {name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                          {b.status === "upcoming" && (
                            <>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                                Reschedule
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="date"
                                  value={rescheduleDraft[b.id]?.date ?? b.date}
                                  onChange={(e) =>
                                    setRescheduleDraft((prev) => ({
                                      ...prev,
                                      [b.id]: {
                                        date: e.target.value,
                                        time: prev[b.id]?.time ?? b.time,
                                      },
                                    }))
                                  }
                                  disabled={isUpdating}
                                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                                />
                                <select
                                  value={rescheduleDraft[b.id]?.time ?? b.time}
                                  onChange={(e) =>
                                    setRescheduleDraft((prev) => ({
                                      ...prev,
                                      [b.id]: {
                                        date: prev[b.id]?.date ?? b.date,
                                        time: e.target.value,
                                      },
                                    }))
                                  }
                                  disabled={isUpdating}
                                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white"
                                >
                                  {TIME_SLOTS.map((slot) => (
                                    <option key={slot} value={slot}>
                                      {slot}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={async () => {
                                    const draft = rescheduleDraft[b.id] ?? { date: b.date, time: b.time };
                                    setUpdatingBookingId(b.id);
                                    const result = await updateBookingDateTimeForAdmin(b.id, draft);
                                    setUpdatingBookingId(null);
                                    if (result.ok) {
                                      setRescheduleDraft((prev) => {
                                        const next = { ...prev };
                                        delete next[b.id];
                                        return next;
                                      });
                                      onRefreshBookings?.();
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Save
                                </button>
                              </div>
                            </>
                          )}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRebookBooking(b);
                                setRebookDate("");
                                setRebookTime("");
                                setRebookError(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                              Rebook
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {rebookBooking && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6">
              <h3 className="text-lg font-black text-slate-900 mb-2">Rebook – choose new date and time</h3>
              <p className="text-sm text-slate-600 mb-4">
                Same {rebookBooking.service} clean at {rebookBooking.address ?? "address"}. Pick a new date and time, then continue to payment.
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

        {activeTab === "quote-requests" && (
          <motion.div
            key="quote-requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Quote requests
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Users who requested a manual quote. Update status and notes after you send the quote.
              </p>
            </div>
            {quoteRequestsLoading ? (
              <p className="text-slate-500 text-sm px-1">Loading…</p>
            ) : quoteRequests.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 text-center">
                <p className="text-slate-500 text-sm">No quote requests yet.</p>
              </div>
            ) : (
              <div className="hidden md:block bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Area</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteRequests.map((q) => {
                        const isExpanded = expandedQuoteId === q.id;
                        const isUpdating = quoteUpdatingId === q.id;
                        const draft = quoteUpdateDraft[q.id] ?? {
                          status: q.status,
                          admin_notes: q.admin_notes ?? "",
                          quoted_amount: q.quoted_amount != null ? String(q.quoted_amount) : "",
                        };
                        const handleSaveQuote = async () => {
                          setQuoteUpdatingId(q.id);
                          const result = await updateQuoteRequestForAdmin(q.id, {
                            status: draft.status,
                            admin_notes: draft.admin_notes || undefined,
                            quoted_amount: draft.quoted_amount ? parseFloat(draft.quoted_amount) : null,
                          });
                          setQuoteUpdatingId(null);
                          if (result.ok) {
                            setQuoteRequests((prev) =>
                              prev.map((r) =>
                                r.id === q.id
                                  ? {
                                      ...r,
                                      status: draft.status,
                                      admin_notes: draft.admin_notes || null,
                                      quoted_amount: draft.quoted_amount ? parseFloat(draft.quoted_amount) : null,
                                      updated_at: new Date().toISOString(),
                                    }
                                  : r
                              )
                            );
                            setQuoteUpdateDraft((prev) => {
                              const next = { ...prev };
                              delete next[q.id];
                              return next;
                            });
                            setExpandedQuoteId(null);
                          }
                        };
                        return (
                          <React.Fragment key={q.id}>
                            <tr
                              onClick={() => setExpandedQuoteId(isExpanded ? null : q.id)}
                              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4">
                                <p className="text-sm font-black text-slate-900">{q.customer_name}</p>
                                <p className="text-xs text-slate-500">{q.customer_email}</p>
                                <p className="text-xs text-slate-500">{q.customer_phone}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs font-bold text-slate-600">
                                  {q.service.charAt(0).toUpperCase() + q.service.slice(1)}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs font-bold text-slate-600">{q.working_area}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs text-slate-600">
                                  {new Date(q.created_at).toLocaleDateString("en-ZA", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    q.status === "quoted"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : q.status === "new"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {q.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <span className={`inline-block p-2 text-slate-400 transition-all ${isExpanded ? "rotate-90" : ""}`}>
                                  <ChevronRight className="w-4 h-4" />
                                </span>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="border-b border-slate-50 bg-slate-50/50">
                                <td colSpan={6} className="px-6 py-4">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Request details
                                      </p>
                                      <p className="text-slate-700">
                                        {q.property_type} • {q.bedrooms} bed, {q.bathrooms} bath
                                        {q.extra_rooms > 0 ? `, +${q.extra_rooms} extra` : ""}
                                        {q.office_size ? ` • ${q.office_size} office` : ""}
                                      </p>
                                      {q.address && <p className="text-slate-600">Address: {q.address}</p>}
                                      {q.message && <p className="text-slate-600">Message: {q.message}</p>}
                                      {q.extras?.length > 0 && <p className="text-slate-600">Extras: {q.extras.join(", ")}</p>}
                                    </div>
                                    <div className="space-y-3">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Admin
                                      </p>
                                      <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Status</label>
                                        <select
                                          value={draft.status}
                                          onChange={(e) =>
                                            setQuoteUpdateDraft((prev) => ({
                                              ...prev,
                                              [q.id]: { ...draft, status: e.target.value },
                                            }))
                                          }
                                          disabled={isUpdating}
                                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold bg-white"
                                        >
                                          <option value="new">New</option>
                                          <option value="quoted">Quoted</option>
                                          <option value="converted">Converted</option>
                                          <option value="closed">Closed</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Admin notes</label>
                                        <textarea
                                          value={draft.admin_notes}
                                          onChange={(e) =>
                                            setQuoteUpdateDraft((prev) => ({
                                              ...prev,
                                              [q.id]: { ...draft, admin_notes: e.target.value },
                                            }))
                                          }
                                          disabled={isUpdating}
                                          rows={2}
                                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white resize-none"
                                          placeholder="Internal notes…"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Quoted amount (R)</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={draft.quoted_amount}
                                            onChange={(e) =>
                                              setQuoteUpdateDraft((prev) => ({
                                                ...prev,
                                                [q.id]: { ...draft, quoted_amount: e.target.value },
                                              }))
                                            }
                                            disabled={isUpdating}
                                            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                                            placeholder="0.00"
                                          />
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              const result = await getSuggestedQuoteFromPricing({
                                                service: q.service,
                                                bedrooms: q.bedrooms,
                                                bathrooms: q.bathrooms,
                                                extraRooms: q.extra_rooms ?? 0,
                                                extras: q.extras ?? [],
                                              });
                                              if ("suggestedSubtotal" in result) {
                                                setQuoteUpdateDraft((prev) => ({
                                                  ...prev,
                                                  [q.id]: { ...draft, quoted_amount: String(result.suggestedSubtotal) },
                                                }));
                                              }
                                            }}
                                            disabled={isUpdating}
                                            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 whitespace-nowrap"
                                            title="Fill from pricing config"
                                          >
                                            Suggest
                                          </button>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={handleSaveQuote}
                                        disabled={isUpdating}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        {isUpdating ? "Saving…" : "Save"}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!quoteRequestsLoading && quoteRequests.length > 0 && (
              <div className="md:hidden space-y-3 px-1">
                {quoteRequests.map((q) => {
                  const isExpanded = expandedQuoteId === q.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => setExpandedQuoteId(isExpanded ? null : q.id)}
                      className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900">{q.customer_name}</p>
                          <p className="text-xs text-slate-500">{q.customer_email}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {q.service} • {q.working_area} • {new Date(q.created_at).toLocaleDateString("en-ZA")}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            q.status === "quoted" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 space-y-1">
                          <p>Phone: {q.customer_phone}</p>
                          <p>{q.property_type} • {q.bedrooms} bed, {q.bathrooms} bath</p>
                          {q.address && <p>Address: {q.address}</p>}
                          {q.message && <p>Message: {q.message}</p>}
                          {q.admin_notes && <p className="text-slate-500">Notes: {q.admin_notes}</p>}
                          {q.quoted_amount != null && <p className="font-bold">Quoted: R{q.quoted_amount}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "pricing" && (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Pricing configuration
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Manage service prices, extras, and fees used for quotes and bookings.
              </p>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Service
                  </label>
                  <select
                    value={pricingServiceFilter}
                    onChange={(e) => setPricingServiceFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold bg-white min-w-[140px]"
                  >
                    {SERVICE_OPTIONS.map((o) => (
                      <option key={o.value || "all"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={pricingIncludeInactive}
                    onChange={(e) => setPricingIncludeInactive(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Show inactive / expired
                </label>
              </div>
              <button
                type="button"
                onClick={() => reloadPricing()}
                disabled={pricingLoading}
                className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {pricingError && (
              <div className="px-1">
                <p className="text-xs font-bold text-red-600">{pricingError}</p>
              </div>
            )}

            {pricingLoading ? (
              <p className="text-slate-500 text-sm px-1">Loading pricing…</p>
            ) : pricingGroups.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 text-center">
                <p className="text-slate-500 text-sm">No pricing rules found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pricingGroups.map((group) => (
                  <div
                    key={group.key}
                    className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {group.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {group.rows.length} rule{group.rows.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 md:px-6 py-3 font-black text-slate-400 uppercase tracking-widest">
                              Type
                            </th>
                            <th className="px-4 md:px-6 py-3 font-black text-slate-400 uppercase tracking-widest">
                              Item
                            </th>
                            <th className="px-4 md:px-6 py-3 font-black text-slate-400 uppercase tracking-widest">
                              Price (R)
                            </th>
                            <th className="px-4 md:px-6 py-3 font-black text-slate-400 uppercase tracking-widest">
                              Effective from
                            </th>
                            <th className="px-4 md:px-6 py-3 font-black text-slate-400 uppercase tracking-widest">
                              Ends
                            </th>
                            <th className="px-4 md:px-6 py-3 font-black text-slate-400 uppercase tracking-widest">
                              Active
                            </th>
                            <th className="px-4 md:px-6 py-3 font-black text-slate-400 uppercase tracking-widest">
                              Notes
                            </th>
                            <th className="px-4 md:px-6 py-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map((row) => {
                            const draft =
                              pricingEditDraft[row.id] ?? {
                                price: String(row.price),
                                effective_date: row.effective_date,
                                end_date: row.end_date ?? "",
                                is_active: row.is_active,
                                notes: row.notes ?? "",
                              };
                            const saving = pricingSavingId === row.id;
                            return (
                              <tr key={row.id} className="border-b border-slate-50 last:border-0">
                                <td className="px-4 md:px-6 py-3 align-middle">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest">
                                    {row.price_type.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-4 md:px-6 py-3 align-middle">
                                  <p className="text-xs font-bold text-slate-700">
                                    {row.item_name || (row.price_type === "base"
                                      ? "Base"
                                      : row.price_type === "bedroom"
                                        ? "Per bedroom"
                                        : row.price_type === "bathroom"
                                          ? "Per bathroom"
                                          : "—")}
                                  </p>
                                </td>
                                <td className="px-4 md:px-6 py-3 align-middle">
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={draft.price}
                                    onChange={(e) =>
                                      setPricingEditDraft((prev) => ({
                                        ...prev,
                                        [row.id]: { ...draft, price: e.target.value },
                                      }))
                                    }
                                    disabled={saving}
                                    className="w-24 rounded-xl border border-slate-200 px-2 py-1 text-xs bg-white"
                                  />
                                </td>
                                <td className="px-4 md:px-6 py-3 align-middle">
                                  <input
                                    type="date"
                                    value={draft.effective_date}
                                    onChange={(e) =>
                                      setPricingEditDraft((prev) => ({
                                        ...prev,
                                        [row.id]: { ...draft, effective_date: e.target.value },
                                      }))
                                    }
                                    disabled={saving}
                                    className="rounded-xl border border-slate-200 px-2 py-1 text-xs bg-white"
                                  />
                                </td>
                                <td className="px-4 md:px-6 py-3 align-middle">
                                  <input
                                    type="date"
                                    value={draft.end_date}
                                    onChange={(e) =>
                                      setPricingEditDraft((prev) => ({
                                        ...prev,
                                        [row.id]: { ...draft, end_date: e.target.value },
                                      }))
                                    }
                                    disabled={saving}
                                    className="rounded-xl border border-slate-200 px-2 py-1 text-xs bg-white"
                                  />
                                </td>
                                <td className="px-4 md:px-6 py-3 align-middle">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPricingEditDraft((prev) => ({
                                        ...prev,
                                        [row.id]: { ...draft, is_active: !draft.is_active },
                                      }))
                                    }
                                    disabled={saving}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${
                                      draft.is_active ? "bg-emerald-500" : "bg-slate-300"
                                    }`}
                                  >
                                    <span
                                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                                        draft.is_active ? "right-0.5" : "left-0.5"
                                      }`}
                                    />
                                  </button>
                                </td>
                                <td className="px-4 md:px-6 py-3 align-middle">
                                  <input
                                    type="text"
                                    value={draft.notes}
                                    onChange={(e) =>
                                      setPricingEditDraft((prev) => ({
                                        ...prev,
                                        [row.id]: { ...draft, notes: e.target.value },
                                      }))
                                    }
                                    disabled={saving}
                                    className="w-40 md:w-56 rounded-xl border border-slate-200 px-2 py-1 text-xs bg-white"
                                    placeholder="Optional notes"
                                  />
                                </td>
                                <td className="px-4 md:px-6 py-3 align-middle">
                                  <div className="flex flex-col md:flex-row gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSavePricingRow(row)}
                                      disabled={saving}
                                      className="px-3 py-1.5 rounded-xl text-[11px] font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                    >
                                      {saving ? "Saving…" : "Save"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeactivatePricingRow(row)}
                                      disabled={saving || !row.is_active}
                                      className="px-3 py-1.5 rounded-xl text-[11px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
                                    >
                                      Deactivate
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    New rule
                  </p>
                  <p className="text-xs text-slate-500">
                    Add a new service price, extra, fee, or discount.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Service
                  </label>
                  <select
                    value={pricingNewRule.serviceSlug}
                    onChange={(e) =>
                      setPricingNewRule((prev) => ({ ...prev, serviceSlug: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold bg-white"
                  >
                    {SERVICE_OPTIONS.map((o) => (
                      <option key={o.value || "all"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Price type
                  </label>
                  <select
                    value={pricingNewRule.price_type}
                    onChange={(e) =>
                      setPricingNewRule((prev) => ({ ...prev, price_type: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold bg-white"
                  >
                    {PRICE_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Item name
                  </label>
                  <input
                    type="text"
                    value={pricingNewRule.item_name}
                    onChange={(e) =>
                      setPricingNewRule((prev) => ({ ...prev, item_name: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                    placeholder="e.g. Balcony Cleaning"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Price (R)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={pricingNewRule.price}
                    onChange={(e) =>
                      setPricingNewRule((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Effective from
                  </label>
                  <input
                    type="date"
                    value={pricingNewRule.effective_date}
                    onChange={(e) =>
                      setPricingNewRule((prev) => ({ ...prev, effective_date: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Ends
                  </label>
                  <input
                    type="date"
                    value={pricingNewRule.end_date}
                    onChange={(e) =>
                      setPricingNewRule((prev) => ({ ...prev, end_date: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600">
                    <input
                      type="checkbox"
                      checked={pricingNewRule.is_active}
                      onChange={(e) =>
                        setPricingNewRule((prev) => ({ ...prev, is_active: e.target.checked }))
                      }
                      className="rounded border-slate-300"
                    />
                    Active
                  </label>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={pricingNewRule.notes}
                    onChange={(e) =>
                      setPricingNewRule((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                    placeholder="Optional note"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreatePricingRule}
                  disabled={pricingSavingId === "new"}
                  className="px-4 py-2 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                >
                  {pricingSavingId === "new" ? "Saving…" : "Add rule"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "blog" && (
          <motion.div
            key="blog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Blog &amp; SEO
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Manage blog posts, publishing, and SEO metadata used on public blog pages.
              </p>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Status
                  </label>
                  <select
                    value={blogStatusFilter}
                    onChange={(e) =>
                      setBlogStatusFilter(
                        (e.target.value || "all") as "all" | "draft" | "published"
                      )
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold bg-white min-w-[140px]"
                  >
                    <option value="all">All posts</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="min-w-[200px] flex-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    value={blogSearch}
                    onChange={(e) => setBlogSearch(e.target.value)}
                    placeholder="Search by title, slug, or excerpt…"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startNewBlogPost}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New post
                </button>
                <button
                  type="button"
                  onClick={() => reloadBlogPosts()}
                  disabled={blogLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>
            </div>

            {blogError && (
              <div className="px-1">
                <p className="text-xs font-bold text-red-600">{blogError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Posts
                    </p>
                    <p className="text-xs text-slate-500">
                      {filteredBlogPosts.length} post
                      {filteredBlogPosts.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                {blogLoading ? (
                  <p className="px-4 py-6 text-sm text-slate-500">Loading blog posts…</p>
                ) : filteredBlogPosts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No posts yet. Create your first blog post.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 md:px-6 py-3 font-black text-slate-400 uppercase tracking-widest">
                            Title
                          </th>
                          <th className="px-4 md:px-6 py-3 font-black text-slate-400 uppercase tracking-widest">
                            Status
                          </th>
                          <th className="px-4 md:px-6 py-3 font-black text-slate-400 uppercase tracking-widest">
                            Published
                          </th>
                          <th className="px-4 md:px-6 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBlogPosts
                          .slice()
                          .sort((a, b) => {
                            const aDate = a.published_at ?? a.created_at;
                            const bDate = b.published_at ?? b.created_at;
                            return aDate < bDate ? 1 : aDate > bDate ? -1 : 0;
                          })
                          .map((post) => (
                            <tr
                              key={post.id}
                              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-4 md:px-6 py-3 align-middle">
                                <button
                                  type="button"
                                  onClick={() => startEditBlogPost(post)}
                                  className="text-xs font-bold text-slate-900 hover:text-blue-600 text-left"
                                >
                                  {post.title}
                                </button>
                                <p className="text-[10px] text-slate-400 mt-0.5 break-all">
                                  /blog/{post.slug}
                                </p>
                              </td>
                              <td className="px-4 md:px-6 py-3 align-middle">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    post.status === "published"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {post.status}
                                </span>
                              </td>
                              <td className="px-4 md:px-6 py-3 align-middle">
                                <p className="text-[11px] text-slate-600">
                                  {post.published_at
                                    ? new Date(post.published_at).toLocaleDateString("en-ZA", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "—"}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {post.indexable ? "Indexable" : "Noindex"}
                                </p>
                              </td>
                              <td className="px-4 md:px-6 py-3 align-middle">
                                <div className="flex flex-col md:flex-row gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => startEditBlogPost(post)}
                                    className="px-3 py-1.5 rounded-xl text-[11px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePublishBlogPost(post)}
                                    disabled={blogSaving}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black text-white ${
                                      post.status === "published"
                                        ? "bg-slate-700 hover:bg-slate-800"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                    } disabled:opacity-50`}
                                  >
                                    {post.status === "published" ? "Unpublish" : "Publish"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBlogPost(post.id)}
                                    disabled={blogSaving}
                                    className="px-3 py-1.5 rounded-xl text-[11px] font-black text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {blogEditingId ? "Edit post" : "Post editor"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Content and SEO metadata for a single post.
                    </p>
                  </div>
                </div>
                {!blogDraft ? (
                  <p className="text-sm text-slate-500">
                    Select a post from the list or click{" "}
                    <span className="font-bold text-slate-700">New post</span> to start writing.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={blogDraft.title}
                          onChange={(e) => updateBlogDraft({ title: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                          placeholder="Post title"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Slug
                        </label>
                        <input
                          type="text"
                          value={blogDraft.slug ?? ""}
                          onChange={(e) => updateBlogDraft({ slug: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                          placeholder="URL slug (optional)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={blogDraft.category ?? ""}
                          onChange={(e) => updateBlogDraft({ category: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                          placeholder="e.g. Deep Cleaning"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Status
                        </label>
                        <select
                          value={blogDraft.status ?? "draft"}
                          onChange={(e) => updateBlogDraft({ status: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Excerpt
                      </label>
                      <textarea
                        value={blogDraft.excerpt ?? ""}
                        onChange={(e) => updateBlogDraft({ excerpt: e.target.value })}
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white resize-none"
                        placeholder="Short summary used on cards and meta description."
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Content
                      </label>
                      <RichTextEditor
                        value={blogDraft.content}
                        onChange={(html) => updateBlogDraft({ content: html })}
                        placeholder="Main article body – supports basic formatting, headings, and lists."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          SEO title
                        </label>
                        <input
                          type="text"
                          value={blogDraft.seo_title ?? ""}
                          onChange={(e) => updateBlogDraft({ seo_title: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                          placeholder="If empty, falls back to title."
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          SEO description
                        </label>
                        <textarea
                          value={blogDraft.seo_description ?? ""}
                          onChange={(e) => updateBlogDraft({ seo_description: e.target.value })}
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white resize-none"
                          placeholder="Meta description, ~150–160 characters."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          SEO keywords
                        </label>
                        <input
                          type="text"
                          value={blogDraft.seo_keywords ?? ""}
                          onChange={(e) => updateBlogDraft({ seo_keywords: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                          placeholder="Comma-separated keywords (optional)."
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Canonical URL
                        </label>
                        <input
                          type="text"
                          value={blogDraft.canonical_url ?? ""}
                          onChange={(e) => updateBlogDraft({ canonical_url: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                          placeholder="Override canonical URL (optional)."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Open Graph image URL
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={blogDraft.og_image_url ?? ""}
                            onChange={(e) => updateBlogDraft({ og_image_url: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                            placeholder="Image for social sharing."
                          />
                          <label className="cursor-pointer">
                            <span className="inline-block px-3 py-2 rounded-xl text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100">
                              {blogImageUploadingTarget === "og" ? "Uploading…" : "Upload"}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="sr-only"
                              onChange={handleBlogImageFileChange("og")}
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Twitter image URL
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={blogDraft.twitter_image_url ?? ""}
                            onChange={(e) => updateBlogDraft({ twitter_image_url: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                            placeholder="Defaults to Open Graph image if empty."
                          />
                          <label className="cursor-pointer">
                            <span className="inline-block px-3 py-2 rounded-xl text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100">
                              {blogImageUploadingTarget === "twitter" ? "Uploading…" : "Upload"}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="sr-only"
                              onChange={handleBlogImageFileChange("twitter")}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Open Graph title
                        </label>
                        <input
                          type="text"
                          value={blogDraft.og_title ?? ""}
                          onChange={(e) => updateBlogDraft({ og_title: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Open Graph description
                        </label>
                        <textarea
                          value={blogDraft.og_description ?? ""}
                          onChange={(e) => updateBlogDraft({ og_description: e.target.value })}
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Twitter title
                        </label>
                        <input
                          type="text"
                          value={blogDraft.twitter_title ?? ""}
                          onChange={(e) => updateBlogDraft({ twitter_title: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Twitter description
                        </label>
                        <textarea
                          value={blogDraft.twitter_description ?? ""}
                          onChange={(e) => updateBlogDraft({ twitter_description: e.target.value })}
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={blogDraft.indexable ?? true}
                          onChange={(e) => updateBlogDraft({ indexable: e.target.checked })}
                          className="rounded border-slate-300"
                        />
                        Allow indexing (index / noindex)
                      </label>
                      <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={blogDraft.follow_links ?? true}
                          onChange={(e) => updateBlogDraft({ follow_links: e.target.checked })}
                          className="rounded border-slate-300"
                        />
                        Allow link following (follow / nofollow)
                      </label>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Structured data (JSON-LD override)
                      </label>
                      <textarea
                        value={
                          typeof blogDraft.structured_data === "string"
                            ? blogDraft.structured_data
                            : blogDraft.structured_data
                              ? JSON.stringify(blogDraft.structured_data, null, 2)
                              : ""
                        }
                        onChange={(e) => updateBlogDraft({ structured_data: e.target.value })}
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white font-mono"
                        placeholder='Optional raw JSON for an "Article" object; leave empty to auto-generate.'
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveBlogPost}
                        disabled={blogSaving}
                        className="px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {blogSaving ? "Saving…" : "Save post"}
                      </button>
                      <button
                        type="button"
                        onClick={resetBlogEditor}
                        disabled={blogSaving}
                        className="px-4 py-2 rounded-xl text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "crew" && (
          <CrewTab
            cleaners={adminCleaners}
            onRefresh={onRefreshCleaners}
          />
        )}

        {activeTab === "finance" && (
          <motion.div
            key="finance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Total Paid Out
                </p>
                <h3 className="text-2xl font-black text-slate-900">
                  {financeLoading ? "…" : formatRevenue(Math.round((payoutStats?.totalPaidOut ?? 0)))}
                </h3>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Net Platform Fee
                </p>
                <h3 className="text-2xl font-black text-emerald-600">
                  {formatRevenue(Math.round(stats.totalRevenue * 0.24))}
                </h3>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Avg Transaction
                </p>
                <h3 className="text-2xl font-black text-slate-900">R650</h3>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-black text-slate-900">Recent Payouts</h4>
              </div>
              {financeLoading ? (
                <p className="text-slate-500 text-sm">Loading…</p>
              ) : payoutList.length === 0 ? (
                <p className="text-slate-500 text-sm">No payouts yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="pb-2 pr-4 font-black text-slate-400 uppercase tracking-widest">Cleaner</th>
                        <th className="pb-2 pr-4 font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="pb-2 pr-4 font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="pb-2 font-black text-slate-400 uppercase tracking-widest">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutList.map((p) => (
                        <tr key={p.id} className="border-b border-slate-50">
                          <td className="py-3 pr-4 font-bold text-slate-900">{p.cleanerName}</td>
                          <td className="py-3 pr-4 font-bold text-slate-900">
                            R{p.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={
                                p.status === "success"
                                  ? "text-emerald-600 font-bold"
                                  : p.status === "pending"
                                    ? "text-blue-600 font-bold"
                                    : "text-slate-500 font-bold"
                              }
                            >
                              {p.status === "success" ? "Paid" : p.status === "pending" ? "Processing" : p.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">
                            {new Date(p.created_at).toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
            className="max-w-2xl"
          >
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
              <h4 className="text-lg font-black text-slate-900 mb-6">Global Platform Settings</h4>
              {settingsLoading ? (
                <p className="text-slate-500 text-sm">Loading settings…</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-sm font-black text-slate-900">Booking Notifications</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        Send alerts to customers and crew
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsMessage(null);
                        setSettingsBookingNotifications((v) => !v);
                      }}
                      className={`w-12 h-6 rounded-full relative transition-colors ${settingsBookingNotifications ? "bg-blue-600" : "bg-slate-200"}`}
                      aria-pressed={settingsBookingNotifications}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settingsBookingNotifications ? "right-1" : "left-1"}`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-sm font-black text-slate-900">Automatic Payouts</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        Process crew earnings weekly
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsMessage(null);
                        setSettingsAutomaticPayouts((v) => !v);
                      }}
                      className={`w-12 h-6 rounded-full relative transition-colors ${settingsAutomaticPayouts ? "bg-blue-600" : "bg-slate-200"}`}
                      aria-pressed={settingsAutomaticPayouts}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settingsAutomaticPayouts ? "right-1" : "left-1"}`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-sm font-black text-slate-900">Peak Season Pricing</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        Apply 15% surcharge during busy periods
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsMessage(null);
                        setSettingsPeakSeasonPricing((v) => !v);
                      }}
                      className={`w-12 h-6 rounded-full relative transition-colors ${settingsPeakSeasonPricing ? "bg-blue-600" : "bg-slate-200"}`}
                      aria-pressed={settingsPeakSeasonPricing}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settingsPeakSeasonPricing ? "right-1" : "left-1"}`}
                      />
                    </button>
                  </div>
                  {settingsMessage && (
                    <p
                      className={`text-sm font-bold ${settingsMessage.type === "success" ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {settingsMessage.text}
                    </p>
                  )}
                  <div className="pt-4">
                    <button
                      type="button"
                      disabled={settingsSaving}
                      onClick={async () => {
                        setSettingsSaving(true);
                        setSettingsMessage(null);
                        const result = await updatePlatformSettingsForAdmin({
                          booking_notifications_enabled: settingsBookingNotifications,
                          automatic_payouts_enabled: settingsAutomaticPayouts,
                          peak_season_pricing_enabled: settingsPeakSeasonPricing,
                        });
                        setSettingsSaving(false);
                        if (result.ok) {
                          setSettingsMessage({ type: "success", text: "Settings saved." });
                        } else {
                          setSettingsMessage({ type: "error", text: result.error });
                        }
                      }}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl disabled:opacity-60 disabled:cursor-not-allowed hover:bg-slate-800"
                    >
                      {settingsSaving ? "Saving…" : "Save Global Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function CrewTab({
  cleaners,
  onRefresh,
}: {
  cleaners: AdminCleanerRow[];
  onRefresh?: () => void;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<{ profileId: string; name: string } | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const handleSetStatus = async (
    profileId: string,
    verification_status: "verified" | "rejected",
    verification_notes?: string | null
  ) => {
    setUpdatingId(profileId);
    const result = await updateCleanerVerification(profileId, {
      verification_status,
      verification_notes: verification_notes ?? null,
    });
    setUpdatingId(null);
    setNotesModal(null);
    setNotesValue("");
    if (result.ok && onRefresh) onRefresh();
  };

  const openRejectNotes = (c: AdminCleanerRow) => {
    setNotesModal({ profileId: c.profileId, name: c.name });
    setNotesValue(c.verificationNotes ?? "");
  };

  return (
    <motion.div
      key="crew"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {cleaners.map((c) => (
        <div
          key={c.profileId}
          className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md bg-slate-200">
              {c.avatar ? (
                <img
                  src={c.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <VerificationBadge status={c.verificationStatus} provider={c.verificationProvider} />
          </div>
          <h4 className="text-lg font-black text-slate-900 mb-1">{c.name || "No name"}</h4>
          <p className="text-xs font-bold text-slate-500 mb-4 break-all">{c.email}</p>
          {c.verifiedAt && (
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Verified {new Date(c.verifiedAt).toLocaleDateString()}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50 mb-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Jobs Done
              </p>
              <p className="text-sm font-black text-slate-900">{c.completedJobs}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Earnings
              </p>
              <p className="text-sm font-black text-emerald-600">
                R{c.totalEarnings.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.verificationStatus !== "verified" && (
              <button
                type="button"
                disabled={updatingId === c.profileId}
                onClick={() => handleSetStatus(c.profileId, "verified")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Verify
              </button>
            )}
            {c.verificationStatus !== "rejected" && (
              <button
                type="button"
                disabled={updatingId === c.profileId}
                onClick={() => openRejectNotes(c)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            )}
          </div>
        </div>
      ))}
      {notesModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6">
            <h3 className="text-lg font-black text-slate-900 mb-2">Reject verification</h3>
            <p className="text-sm text-slate-600 mb-4">
              Optional note for {notesModal.name} (admin only, not shown to cleaner):
            </p>
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="e.g. Document expired"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm mb-4 min-h-[80px]"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSetStatus(notesModal.profileId, "rejected", notesValue)}
                disabled={updatingId === notesModal.profileId}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
              <button
                type="button"
                onClick={() => { setNotesModal(null); setNotesValue(""); }}
                className="px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function VerificationBadge({
  status,
  provider,
}: {
  status: AdminCleanerRow["verificationStatus"];
  provider: string | null;
}) {
  if (status === "verified") {
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3 h-3" /> Verified
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" /> Pending{provider ? " (provider)" : ""}
    </span>
  );
}
