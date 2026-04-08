 "use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Star,
  ShieldCheck,
  Clock,
  Phone,
  MessageSquare,
  Menu,
  X,
  Calendar,
  Home,
  Trash2,
  Layers,
  Sparkles,
  Wind,
  MapPin,
  Droplets,
  Truck,
  Search,
  Globe,
  ArrowRight,
  Plus,
  Minus,
  Users,
  Linkedin,
  HelpCircle,
  CreditCard,
  Award,
  DollarSign,
  Repeat,
  Zap,
  ThumbsUp,
  UserCheck,
  BadgeCheck,
  BarChart2,
  BookOpen,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BookingSystem, getBookingServiceUrlSlug } from "./BookingSystem";
import { ServicesPage } from "./ServicesPage";
import { PricingPage } from "./PricingPage";
import { LocationsPage } from "./LocationsPage";
import { AboutPage } from "./AboutPage";
import { AboutSection } from "./AboutSection";
import { CareersPage } from "./CareersPage";
import { ContactPage } from "./ContactPage";
import { BlogPage } from "./BlogPage";
import Footer from "./Footer";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
// Dashboards now live on dedicated routes with real auth,
// so the old in-component dashboard imports are no longer needed.

// --- Constants & Types ---

type PageType =
  | "home"
  | "services"
  | "booking"
  | "locations"
  | "about"
  | "blog"
  | "contact"
  | "careers"
  | "pricing";

/** Prefill when opening booking from the site: service in URL, address via session (not in URL). */
type BookingRoutePrefill = {
  service?: string;
  address?: string;
};

/** Home marketing palette (used only on `/` in this file). */
const HOME = {
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primaryLight: "#60A5FA",
  background: "#EFF6FF",
  accent: "#14B8A6",
  accentHover: "#0D9488",
  textDark: "#0F172A",
} as const;

const LOCATIONS = [
  { name: "Sea Point", slug: "sea-point" },
  { name: "Claremont", slug: "claremont" },
  { name: "Durbanville", slug: "durbanville" },
  { name: "Observatory", slug: "observatory" },
  { name: "Century City", slug: "century-city" },
  { name: "Table View", slug: "table-view" },
  { name: "Gardens", slug: "gardens" },
  { name: "Constantia", slug: "constantia" },
];

const FAQS = [
  {
    q: "Do I need to be home during the cleaning?",
    a: "No — it's up to you. Many clients share access instructions or a spare key; others prefer to be there. Just let us know what works best.",
  },
  {
    q: "What supplies do you use?",
    a: "Our teams bring standard, professional-grade supplies for a typical home clean. If you have preferred products or allergies, tell us when you book.",
  },
  {
    q: "How do I schedule a recurring cleaning?",
    a: "Choose a weekly, biweekly, or monthly cadence when you book (or ask support to set it up). You'll get consistent time slots and simplified billing.",
  },
  {
    q: "Is there a cancellation fee?",
    a: "Cancellations within the notice window in our policy may incur a fee; rescheduling with enough notice is usually free. Check your confirmation or contact us for your booking.",
  },
  {
    q: "Do you clean commercial office spaces?",
    a: "Yes — we offer commercial and office cleaning with schedules and billing suited to teams. Use Get a quote or contact support for larger spaces.",
  },
] as { q: string; a: string }[];

const HAPPY_CUSTOMER_TESTIMONIALS = [
  {
    quote:
      "Shalean did such an awesome job! They were even mindful of using natural cleaning products for my kiddos room, which I was so appreciative of.",
    name: "Rebecca Hawland",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "Great response time, staff was on time and got the job done pretty quickly. House looked great when they finished. If anyone needs a clean home contact them.",
    name: "Annie Bennedict",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "We've booked monthly deep cleans for over a year. Consistent quality, a friendly team, and they always respect our home and belongings.",
    name: "Andy Toy",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "Clear communication from booking to finish. The crew was thorough in the kitchen and bathrooms — exactly what we needed before family visited.",
    name: "Sarah Mitchell",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "Professional, punctual, and careful with our pets in the house. We've recommended Shalean to several neighbours already.",
    name: "James Nkosi",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "Fair pricing and no surprises on the day. The team asked about priorities and delivered — our office has never looked better.",
    name: "Priya Govender",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
  },
] as const;

// --- Sub-components ---

function HappyCustomersTestimonials() {
  const perPage = 3;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(HAPPY_CUSTOMER_TESTIMONIALS.length / perPage);
  const start = page * perPage;
  const visible = HAPPY_CUSTOMER_TESTIMONIALS.slice(start, start + perPage);

  return (
    <div style={{ color: HOME.textDark }}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className="text-sm font-medium italic"
            style={{ color: HOME.primary }}
          >
            Client Testimonials
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Our Happy Customers
          </h3>
        </div>
        <div className="flex shrink-0 gap-2 self-start sm:self-auto">
          <button
            type="button"
            aria-label="Previous testimonials"
            onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#BFDBFE] bg-white text-[#2563EB] shadow-sm transition-colors hover:bg-[#EFF6FF]"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next testimonials"
            onClick={() => setPage((p) => (p + 1) % totalPages)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#BFDBFE] bg-white text-[#2563EB] shadow-sm transition-colors hover:bg-[#EFF6FF]"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3 md:gap-5">
        {visible.map((t, i) => (
          <article
            key={`${start}-${i}`}
            className="flex flex-col rounded-2xl border border-[#BFDBFE] bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star
                  key={si}
                  className="h-4 w-4 fill-[#60A5FA] text-[#60A5FA]"
                  aria-hidden
                />
              ))}
            </div>
            <p className="flex-1 text-sm italic leading-relaxed text-slate-600 md:text-[15px]">
              {t.quote}
            </p>
            <div className="mt-6 flex items-center gap-3 border-t border-[#E2E8F0] pt-5">
              <img
                src={t.avatar}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Client
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const SectionHeading = ({
  children,
  subtitle,
  centered = false,
}: {
  children: React.ReactNode;
  subtitle?: string;
  centered?: boolean;
}) => (
  <div className={`mb-12 ${centered ? "text-center" : ""}`}>
    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
      {children}
    </h2>
    {subtitle && (
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
    )}
  </div>
);

const Button = ({
  children,
  variant = "primary",
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
  onClick?: () => void;
}) => {
  const baseClasses =
    "px-6 py-3 rounded-full font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
    secondary: "bg-teal-500 text-white hover:bg-teal-600",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
    ghost: "text-slate-600 hover:text-blue-600 hover:bg-slate-100",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}
  >
    {children}
  </div>
);

// --- RefreshCw SVG Icon ---
const RefreshCw = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

// ─── LOCAL SEO AUTHORITY ──────────────────────────────────────────────────────
const LocalSEOSection = ({
  onNavigate,
}: {
  onNavigate: (page: PageType) => void;
}) => {
  return (
    <section className="bg-slate-100 pt-2 pb-10">
      <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 md:p-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-2 text-slate-500 bg-slate-100 w-fit px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                <MapPin className="w-4 h-4" />
                <span>Professional Cleaning Services Across Cape Town</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Local Teams in the Suburbs You Live In
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Shalean Cleaning Services proudly serves homeowners, landlords,
                  and Airbnb hosts across all major Cape Town suburbs. From the
                  vibrant streets of{" "}
                  <strong className="text-slate-900">Sea Point</strong> and{" "}
                  <strong className="text-slate-900">Gardens</strong> to the leafy
                  avenues of{" "}
                  <strong className="text-slate-900">Constantia</strong> and{" "}
                  <strong className="text-slate-900">Claremont</strong>, our
                  professionally trained team is never far away.
                </p>
                <p>
                  Whether you're in{" "}
                  <strong className="text-slate-900">Century City</strong>,{" "}
                  <strong className="text-slate-900">Durbanville</strong>,{" "}
                  <strong className="text-slate-900">Table View</strong>, or{" "}
                  <strong className="text-slate-900">Observatory</strong>, we
                  offer fast scheduling with same-week availability across the
                  greater Cape Town metro. Our local teams know your area and are
                  ready to deliver a spotless clean every time.
                </p>
              </div>
              <div className="mt-8">
                <Button onClick={() => onNavigate("booking")} variant="primary">
                  Book Cleaning in Cape Town <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
              {LOCATIONS.map((loc) => (
                <a
                  key={loc.slug}
                  href={`/locations/${loc.slug}`}
                  className="flex items-center gap-2 p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">
                    {loc.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-400 ml-auto flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── BLOG PREVIEW ─────────────────────────────────────────────────────────────
const BlogPreviewSection = ({
  onNavigate,
}: {
  onNavigate: (page: PageType) => void;
}) => {
  const posts = [
    {
      category: "Tips & tricks",
      title:
        "5 habits that keep your home cleaner between professional visits",
      excerpt:
        "Small daily rituals that compound into a noticeably tidier space — no extra effort required.",
      author: "Mara Osei",
      readTime: "4 min read",
      img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80",
    },
    {
      category: "Sustainability",
      title:
        "Why we switched to 100% biodegradable supplies — and what we learned",
      excerpt:
        "Our journey to a fully eco-conscious product line and the impact on our cleaning results.",
      author: "James Whitfield",
      readTime: "6 min read",
      img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80",
    },
  ] as const;

  return (
    <section
      className="border-t border-[#BFDBFE]/60 py-14 md:py-20"
      style={{ backgroundColor: HOME.background }}
    >
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-[#93C5FD] bg-white/90 px-3 py-1.5 text-sm font-medium text-[#2563EB] shadow-sm">
              <FileText className="h-4 w-4" />
              <span>Cleaning guides &amp; tips</span>
            </div>
            <h2
              className="mb-2 text-3xl font-bold md:text-4xl"
              style={{ color: HOME.textDark }}
            >
              Practical guides from our cleaning experts
            </h2>
            <p className="max-w-2xl text-base text-slate-600 md:text-lg">
              Short, actionable guides — whether you book with us or handle
              touch-ups yourself.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("blog")}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border-2 border-[#2563EB] bg-white px-6 py-3 text-sm font-semibold text-[#2563EB] transition hover:bg-[#DBEAFE] sm:self-auto"
          >
            View all articles <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {posts.map((post) => (
            <motion.article
              key={post.title}
              whileHover={{ y: -3 }}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#BFDBFE] bg-white shadow-md transition hover:border-[#93C5FD]"
              onClick={() => onNavigate("blog")}
            >
              <div className="relative aspect-[5/3] w-full shrink-0 overflow-hidden bg-slate-100">
                <Image
                  src={post.img}
                  alt={post.title}
                  fill
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 42vw"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center p-5 md:p-6">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#14B8A6]">
                  {post.category}
                </p>
                <h3
                  className="mt-2 text-base font-bold leading-snug md:text-lg"
                  style={{ color: HOME.textDark }}
                >
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className="h-7 w-7 shrink-0 rounded-full bg-slate-200 ring-1 ring-slate-300/80"
                    aria-hidden
                  />
                  <span className="font-medium text-slate-700">
                    {post.author}
                  </span>
                  <span className="text-slate-400" aria-hidden>
                    •
                  </span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
type HeroServiceDef = {
  value: string;
  title: string;
  description: string;
  /** Lucide icons accept `strokeWidth` as string | number */
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
};

const HERO_SERVICE_OPTIONS: HeroServiceDef[] = [
  {
    value: "standard",
    title: "Standard Clean",
    description: "Regular recurring clean for every room",
    Icon: Sparkles,
  },
  {
    value: "airbnb",
    title: "Airbnb Clean",
    description: "Quick turnaround clean for short-term rentals",
    Icon: Home,
  },
  {
    value: "deep",
    title: "Deep Clean",
    description: "Thorough top-to-bottom treatment",
    Icon: Droplets,
  },
  {
    value: "move",
    title: "Move In / Move Out",
    description: "Empty-home cleaning for moves and handovers",
    Icon: Truck,
  },
];

/** Unsplash — professional home cleaning (hero left column) */
const HERO_SPLASH_IMAGE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80";

/** About / trust collage — cleaner + bathroom (Unsplash) */
const TRUST_COLLAGE_CLEANER_IMAGE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80";
const TRUST_COLLAGE_BATHROOM_IMAGE =
  "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80";

const HERO_WHATSAPP_PREFILL = encodeURIComponent(
  "Hi! I'd like to know more about Shalean Cleaning Services."
);

function heroWhatsAppHref(): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const digits = typeof raw === "string" ? raw.replace(/\D/g, "") : "";
  if (digits.length >= 8) {
    return `https://wa.me/${digits}?text=${HERO_WHATSAPP_PREFILL}`;
  }
  return `https://wa.me/?text=${HERO_WHATSAPP_PREFILL}`;
}

const HomePage = ({
  onNavigate,
}: {
  onNavigate: (page: PageType, bookingPrefill?: BookingRoutePrefill) => void;
}) => {
  const [heroAddress, setHeroAddress] = useState("");
  const [heroService, setHeroService] = useState<string>(HERO_SERVICE_OPTIONS[0].value);
  const [heroServiceMenuOpen, setHeroServiceMenuOpen] = useState(false);
  const heroServiceDropdownRef = useRef<HTMLDivElement>(null);
  const [heroScheduleModalOpen, setHeroScheduleModalOpen] = useState(false);
  /** Last confirmed choice; drives pill label */
  const [heroScheduleTiming, setHeroScheduleTiming] = useState<"now" | "later">(
    "later"
  );
  /** Working selection while modal is open */
  const [heroScheduleDraft, setHeroScheduleDraft] = useState<"now" | "later">(
    "later"
  );
  const [reviewSummary, setReviewSummary] = useState<{
    averageRating: number | null;
    totalReviews: number | null;
  }>({ averageRating: null, totalReviews: null });

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        const res = await fetch("/api/reviews/summary");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data) {
          setReviewSummary({
            averageRating:
              typeof data.averageRating === "number"
                ? data.averageRating
                : null,
            totalReviews:
              typeof data.totalReviews === "number"
                ? data.totalReviews
                : null,
          });
        }
      } catch {
        // ignore and keep defaults
      }
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!heroServiceMenuOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = heroServiceDropdownRef.current;
      if (el && !el.contains(e.target as Node)) {
        setHeroServiceMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHeroServiceMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [heroServiceMenuOpen]);

  useEffect(() => {
    if (!heroScheduleModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHeroScheduleModalOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [heroScheduleModalOpen]);

  const openHeroScheduleModal = () => {
    setHeroScheduleDraft(heroScheduleTiming);
    setHeroScheduleModalOpen(true);
  };

  const confirmHeroSchedule = () => {
    setHeroScheduleTiming(heroScheduleDraft);
    try {
      sessionStorage.setItem("shaleanHeroScheduleTiming", heroScheduleDraft);
    } catch {
      /* ignore */
    }
    setHeroScheduleModalOpen(false);
    onNavigate("booking", { service: heroService, address: heroAddress });
  };

  const selectedHeroService =
    HERO_SERVICE_OPTIONS.find((o) => o.value === heroService) ??
    HERO_SERVICE_OPTIONS[0];
  const SelectedHeroIcon = selectedHeroService.Icon;

  const displayRating =
    reviewSummary.averageRating !== null
      ? reviewSummary.averageRating.toFixed(2)
      : "4.97";
  return (
    <div>
      {/* Hero — equal-height columns (lg+); condensed UI with sr-only copy for SEO */}
      <section
        className="py-6 sm:py-8 lg:py-10"
        style={{ backgroundColor: HOME.background }}
        aria-labelledby="hero-main-heading"
      >
        <div className="mx-auto w-full max-w-7xl px-6">
          <p className="sr-only">
            Shalean professional home cleaning in Cape Town and surrounds, South
            Africa. Available in your area. Add your service details, select a
            time, and leave the rest to us. Schedule later or book a cleaning.
            Services include standard clean, Airbnb clean, deep clean, and move
            in or move out cleaning. No commitment, cancel anytime, free
            rescheduling. Over ten thousand homes cleaned with an average rating
            of {displayRating}. Contact us on WhatsApp for cleaning services.
          </p>
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 gap-6 lg:min-h-[min(540px,calc(100vh-10rem))] lg:grid-cols-2 lg:items-stretch lg:gap-10 xl:gap-12"
          >
            {/* Left — main block + bottom CTAs (justify-between matches image height) */}
            <div className="flex min-h-0 min-w-0 flex-col justify-between gap-6 lg:h-full">
              <div className="min-w-0 space-y-4 sm:space-y-5">
                <div
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
                  style={{ color: HOME.textDark }}
                >
                  <MapPin
                    className="h-4 w-4 shrink-0 text-[#2563EB]"
                    aria-hidden
                  />
                  <span className="font-medium">Cape Town & surrounds, ZA</span>
                  <button
                    type="button"
                    onClick={() => onNavigate("locations")}
                    className="text-[#2563EB] underline decoration-[#93C5FD] underline-offset-4 transition-colors hover:text-[#1D4ED8]"
                  >
                    Change area
                  </button>
                </div>

                <h1
                  id="hero-main-heading"
                  className="font-sans text-[1.75rem] font-bold leading-[1.12] tracking-tight sm:text-4xl sm:leading-[1.08] lg:text-[2.25rem] xl:text-[2.5rem]"
                  style={{ color: HOME.textDark }}
                >
                  Book a cleaning for now or later
                </h1>

                <button
                  type="button"
                  onClick={openHeroScheduleModal}
                  aria-label="Choose cleaning time: now or schedule later"
                  aria-haspopup="dialog"
                  aria-expanded={heroScheduleModalOpen}
                  className="inline-flex w-full max-w-md items-center gap-3 rounded-full border border-[#BFDBFE] bg-white px-3 py-2.5 text-left text-[15px] font-medium shadow-sm transition-colors hover:bg-[#EFF6FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/25 sm:w-auto"
                  style={{ color: HOME.textDark }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white">
                    <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  {heroScheduleTiming === "now" ? "Pickup now" : "Schedule later"}
                  <ChevronDown
                    className="ml-auto h-4 w-4 shrink-0 sm:ml-1"
                    style={{ color: HOME.textDark }}
                    aria-hidden
                  />
                </button>

              <div className="relative pl-7">
                <div
                  className="absolute bottom-9 left-[7px] top-9 w-px bg-[#BFDBFE]"
                  aria-hidden
                />
                <div
                  className="absolute left-[3px] top-[22px] h-2.5 w-2.5 rounded-full border-2 border-[#60A5FA] bg-white"
                  aria-hidden
                />
                <div
                  className="absolute bottom-[22px] left-[3px] h-2.5 w-2.5 rotate-45 border-2 border-[#60A5FA] bg-white"
                  aria-hidden
                />

                <div className="space-y-3">
                  <div
                    ref={heroServiceDropdownRef}
                    className="relative z-20 overflow-visible"
                  >
                    <p className="mb-1.5 text-xs font-medium text-slate-500">
                      Service type
                    </p>
                    <button
                      type="button"
                      id="hero-service-trigger"
                      onClick={() =>
                        setHeroServiceMenuOpen((open) => !open)
                      }
                      aria-expanded={heroServiceMenuOpen}
                      aria-haspopup="listbox"
                      aria-controls="hero-service-listbox"
                      className="flex w-full items-center gap-3 rounded-2xl border border-[#BFDBFE] bg-white px-4 py-3.5 text-left shadow-sm transition-shadow hover:border-[#93C5FD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/20"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white">
                        <SelectedHeroIcon
                          className="h-5 w-5"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </div>
                      <span
                        className="min-w-0 flex-1 text-base font-semibold"
                        style={{ color: HOME.textDark }}
                      >
                        {selectedHeroService.title}
                      </span>
                      {heroServiceMenuOpen ? (
                        <ChevronUp
                          className="h-5 w-5 shrink-0 text-slate-500"
                          aria-hidden
                        />
                      ) : (
                        <ChevronDown
                          className="h-5 w-5 shrink-0 text-slate-500"
                          aria-hidden
                        />
                      )}
                    </button>

                    {heroServiceMenuOpen && (
                      <div
                        id="hero-service-listbox"
                        role="listbox"
                        aria-labelledby="hero-service-list-label"
                        className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl border border-[#BFDBFE] bg-white p-2 shadow-[0_12px_40px_rgba(37,99,235,0.12)]"
                      >
                        <p
                          id="hero-service-list-label"
                          className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                        >
                          Select a service
                        </p>
                        <div className="flex max-h-[min(70vh,420px)] flex-col gap-1 overflow-y-auto rounded-xl bg-[#EFF6FF]/80 p-1">
                          {HERO_SERVICE_OPTIONS.map((opt) => {
                            const selected = heroService === opt.value;
                            const Icon = opt.Icon;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => {
                                  setHeroService(opt.value);
                                  setHeroServiceMenuOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-left transition-colors",
                                  selected
                                    ? "bg-[#2563EB] text-white shadow-sm"
                                    : "bg-white hover:bg-[#EFF6FF]"
                                )}
                              >
                                <div
                                  className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                    selected
                                      ? "bg-[#1D4ED8]"
                                      : "bg-[#EFF6FF]"
                                  )}
                                >
                                  <Icon
                                    className={cn(
                                      "h-5 w-5",
                                      selected
                                        ? "text-white"
                                        : "text-[#0F172A]"
                                    )}
                                    strokeWidth={2}
                                    aria-hidden
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={cn(
                                      "text-[15px] font-bold leading-tight",
                                      selected
                                        ? "text-white"
                                        : "text-[#0F172A]"
                                    )}
                                  >
                                    {opt.title}
                                  </p>
                                  <p
                                    className={cn(
                                      "mt-0.5 text-xs leading-snug",
                                      selected
                                        ? "text-white/75"
                                        : "text-slate-500"
                                    )}
                                  >
                                    {opt.description}
                                  </p>
                                </div>
                                {selected && (
                                  <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#14B8A6]"
                                    aria-hidden
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="hero-search"
                      className="mb-1.5 block text-xs font-medium text-slate-500"
                    >
                      Service address
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-[#BFDBFE] bg-white px-4 py-3 shadow-sm focus-within:border-[#60A5FA] focus-within:ring-2 focus-within:ring-[#2563EB]/15">
                      <MapPin className="h-5 w-5 shrink-0 text-[#60A5FA]" />
                      <input
                        id="hero-search"
                        type="text"
                        value={heroAddress}
                        onChange={(e) => setHeroAddress(e.target.value)}
                        placeholder="Search service address"
                        className="min-w-0 flex-1 bg-transparent text-base placeholder:text-slate-400 outline-none"
                        style={{ color: HOME.textDark }}
                        autoComplete="street-address"
                      />
                      {heroAddress ? (
                        <button
                          type="button"
                          onClick={() => setHeroAddress("")}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                          aria-label="Clear address"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                          aria-label="Search address"
                        >
                          <Search className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <button
                  type="button"
                  onClick={() =>
                    onNavigate("booking", {
                      service: heroService,
                      address: heroAddress,
                    })
                  }
                  className="w-full rounded-xl bg-[#2563EB] px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8] sm:flex-1"
                >
                  Book a Cleaning
                </button>
                <a
                  href={heroWhatsAppHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-xl border-2 border-[#14B8A6] bg-[#14B8A6] px-6 py-3 text-center text-base font-semibold !text-white no-underline shadow-sm transition-colors visited:!text-white hover:border-[#0D9488] hover:bg-[#0D9488] hover:!text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14B8A6] sm:flex-1"
                >
                  <MessageSquare
                    className="h-5 w-5 shrink-0 !text-white"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="shrink-0 whitespace-nowrap !text-white">
                    WhatsApp Us
                  </span>
                </a>
              </div>
            </div>

            {/* Right — image fills column height (matches left on lg+) */}
            <div className="relative mx-auto w-full max-w-lg min-h-[220px] lg:mx-0 lg:max-w-none lg:min-h-0 lg:h-full">
              <div className="relative h-full min-h-[220px] w-full overflow-hidden rounded-[24px] bg-[#DBEAFE] sm:min-h-[260px] lg:absolute lg:inset-0 lg:min-h-0">
                <Image
                  src={HERO_SPLASH_IMAGE}
                  alt="Professional home cleaning supplies and care"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1023px) 100vw, 45vw"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4">
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-[#2563EB]/85 px-4 py-3 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:py-3.5">
                    <div className="min-w-0 sm:pr-3">
                      <p className="text-base font-semibold text-white sm:text-[1.05rem]">
                        Ready for a spotless home?
                      </p>
                      <p className="sr-only">
                        Ten thousand plus homes cleaned. Average rating{" "}
                        {displayRating} out of five.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate("booking", {
                          service: heroService,
                          address: heroAddress,
                        })
                      }
                      className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#2563EB] shadow-sm transition-colors hover:bg-[#EFF6FF]"
                    >
                      Schedule ahead
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats banner — full-width strip below hero */}
      <section
        className="border-y border-[#BFDBFE]/60 bg-[#2563EB] text-white"
        aria-label="Trust statistics"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-6 sm:py-7 md:py-8">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6 lg:gap-8">
            {[
              { value: "10K+", label: "Cleanings" },
              { value: displayRating, label: "Average rating" },
              { value: "150+", label: "Pro cleaners" },
              { value: "100%", label: "Satisfaction guarantee" },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center text-center"
              >
                <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.5rem]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[#BFDBFE] sm:text-base">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer — replaces former About Us block */}
      <section className="py-12 md:py-16" style={{ backgroundColor: HOME.background }}>
        <div className="max-w-7xl mx-auto px-6 w-full">
          <AboutSection onNavigate={onNavigate} />
        </div>
      </section>

      {/* Professional cleaning / trust — white section (matches hero & about) */}
      <section
        id="how-it-works"
        className="py-14 md:py-20"
        style={{ backgroundColor: HOME.background }}
        aria-labelledby="professional-cleaning-heading"
      >
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — photo collage */}
            <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] sm:grid-rows-[auto_1fr] sm:gap-4">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:row-span-2 sm:aspect-auto sm:min-h-[min(100%,420px)] sm:h-full">
                  <Image
                    src={TRUST_COLLAGE_CLEANER_IMAGE}
                    alt="Professional cleaner with supplies"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="relative aspect-[5/3] overflow-hidden rounded-[24px] shadow-[0_8px_28px_rgba(0,0,0,0.07)] sm:aspect-[4/3]">
                  <Image
                    src={TRUST_COLLAGE_BATHROOM_IMAGE}
                    alt="Clean modern bathroom"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
                <div className="mb-8 sm:col-start-2 sm:row-start-2 sm:mb-10">
                  <div className="relative rounded-[24px] bg-[#14B8A6] px-6 pb-20 pt-7 text-center text-white shadow-[0_8px_24px_rgba(20,184,166,0.35)]">
                    <p className="text-4xl font-bold tracking-tight sm:text-[2.75rem]">
                      20+
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white/95">
                      Certified Cleaners
                    </p>
                    <div className="absolute bottom-0 right-3 z-10 max-w-[11rem] translate-y-1/2 rounded-2xl border border-[#BFDBFE] bg-white px-4 py-3 text-left shadow-lg sm:right-5">
                      <Award
                        className="mb-1 h-7 w-7 text-[#2563EB]"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <p
                        className="text-lg font-bold leading-none"
                        style={{ color: HOME.textDark }}
                      >
                        2024
                      </p>
                      <p className="mt-1 text-xs font-medium leading-snug text-slate-600">
                        Super Service Award
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — copy & CTAs */}
            <div className="flex flex-col justify-center">
              <p className="mb-2 text-sm font-semibold text-[#2563EB]">
                About us
              </p>
              <h2
                id="professional-cleaning-heading"
                className="text-3xl font-bold tracking-tight md:text-4xl md:leading-[1.15]"
                style={{ color: HOME.textDark }}
              >
                Professional Cleaning Services, You Can Count On
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 md:text-[17px]">
                Our team goes above and beyond to ensure you&apos;re happy after
                every clean, with open communication, flexible scheduling, and a
                satisfaction guarantee.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[#BFDBFE] bg-white px-5 py-5 shadow-sm">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF]">
                    <ShieldCheck
                      className="h-6 w-6 text-[#2563EB]"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </div>
                  <h3
                    className="text-base font-bold"
                    style={{ color: HOME.textDark }}
                  >
                    Trusted Company
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    We pride ourselves on building trust through reliability.
                  </p>
                </div>
                <div className="rounded-[22px] border border-[#BFDBFE] bg-white px-5 py-5 shadow-sm">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF]">
                    <Briefcase
                      className="h-6 w-6 text-[#2563EB]"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </div>
                  <h3
                    className="text-base font-bold"
                    style={{ color: HOME.textDark }}
                  >
                    Professional Service
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Excellent performance, flat rates, no surprises.
                  </p>
                </div>
              </div>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() =>
                    onNavigate("booking", {
                      service: heroService,
                      address: heroAddress,
                    })
                  }
                  className="rounded-full bg-[#2563EB] px-9 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]"
                >
                  Book Now
                </button>
                <p className="text-sm font-semibold text-slate-700">
                  4K+ Cleanings Performed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client satisfaction survey */}
      <section
        id="reviews"
        className="border-y border-[#BFDBFE]/60 bg-[#2563EB] py-16 text-white md:py-24"
      >
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                alt=""
                className="aspect-[4/3] w-full rounded-[28px] object-cover shadow-xl"
              />
              <div className="absolute bottom-4 right-4 rounded-2xl border border-[#BFDBFE] bg-white px-5 py-4 shadow-lg sm:bottom-6 sm:right-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#14B8A6]">
                    <CheckCircle2
                      className="h-7 w-7 text-white"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  </div>
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: HOME.textDark }}
                    >
                      96%
                    </p>
                    <p className="text-sm text-slate-500">Satisfaction Rate</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm italic text-white/95">Satisfaction survey</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                What Our Clients Think
              </h2>
              <div className="mt-10 space-y-6">
                {[
                  { label: "Punctuality of cleaners", pct: 96 },
                  { label: "Quality of cleaning", pct: 94 },
                  { label: "Respect for your home & belongings", pct: 100 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between gap-4 text-sm font-medium md:text-base">
                      <span className="text-left">{row.label}</span>
                      <span className="shrink-0 tabular-nums">{row.pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                      <div
                        className="h-full rounded-full bg-[#14B8A6]"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-10 text-right text-xs text-white/70">
                *Clients satisfaction survey based on 298 responses
              </p>
            </div>
          </div>

          <div className="mt-14 rounded-[28px] border border-[#BFDBFE] bg-white p-8 shadow-xl md:mt-20 md:p-10">
            <HappyCustomersTestimonials />
          </div>
        </div>
      </section>

      {/* More than just clean */}
      <section className="py-14 md:py-20" style={{ backgroundColor: HOME.background }}>
        <div className="mx-auto w-full max-w-7xl px-6">
          <h2
            className="mb-10 text-left text-3xl font-bold tracking-tight md:mb-14 md:text-4xl"
            style={{ color: HOME.textDark }}
          >
            More than just clean
          </h2>
          <div className="grid gap-12 md:grid-cols-3 md:gap-8 lg:gap-10">
            {[
              {
                title: "Service options",
                description:
                  "There's more than one way to clean with Shalean, no matter the size of your space or specific needs.",
                image:
                  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
                imageAlt: "Vacuum cleaning carpet",
                cta: "Explore services",
                onCta: () => onNavigate("services"),
              },
              {
                title: "150+ neighborhoods",
                description:
                  "Available across most major metropolitan areas. Schedule a clean and enjoy one less thing to worry about.",
                image:
                  "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=80",
                imageAlt: "Modern bathroom interior",
                cta: "Check coverage",
                onCta: () => onNavigate("locations"),
              },
              {
                title: "10,000+ happy homes",
                description:
                  "Our service spans the country so you can book a trusted professional no matter where life takes you.",
                image:
                  "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=900&q=80",
                imageAlt: "Bright modern home interior",
                cta: "Read reviews",
                onCta: () => {
                  document
                    .getElementById("reviews")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                },
              },
            ].map((card) => (
              <article key={card.title} className="flex flex-col">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100">
                  <img
                    src={card.image}
                    alt={card.imageAlt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3
                  className="mt-6 text-lg font-bold md:text-xl"
                  style={{ color: HOME.textDark }}
                >
                  {card.title}
                </h3>
                <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-slate-600 md:text-[15px]">
                  {card.description}
                </p>
                <button
                  type="button"
                  onClick={card.onCta}
                  className="mt-5 w-fit text-left text-sm text-[#2563EB] underline decoration-[#93C5FD] underline-offset-[5px] transition-colors hover:text-[#1D4ED8]"
                >
                  {card.cta} →
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Built for business scale */}
      <section className="border-y border-[#BFDBFE]/50 bg-[#DBEAFE]/40 py-14 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="relative aspect-square max-h-[420px] w-full overflow-hidden rounded-3xl border border-[#BFDBFE] bg-slate-200/80">
              <img
                src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80"
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg">
                  <span className="sr-only">Play video</span>
                  <ChevronRight className="h-8 w-8 pl-1" />
                </span>
              </div>
            </div>
            <div>
              <span className="inline-block rounded-full bg-[#2563EB]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                For business
              </span>
              <h2
                className="mt-4 text-3xl font-bold tracking-tight md:text-4xl"
                style={{ color: HOME.textDark }}
              >
                Built for business scale
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-slate-600">
                Recurring visits, clear SLAs, and account-friendly billing for teams
                that need reliable coverage week after week.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Office spaces",
                  "Retail stores",
                  "Gyms & studios",
                  "Medical facilities",
                ].map((label) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 text-slate-800"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#14B8A6]" />
                    <span className="font-medium">{label}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate("contact")}
                  className="rounded-full bg-[#2563EB] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  Get a quote
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("services")}
                  className="text-sm font-semibold text-[#2563EB] underline decoration-[#93C5FD] underline-offset-4 hover:text-[#1D4ED8]"
                >
                  Explore solutions
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BlogPreviewSection onNavigate={onNavigate} />

      {/* FAQ Section — support + accordion (matches marketing layout) */}
      <section
        className="border-t border-[#BFDBFE]/60 pt-14 pb-28 md:pt-20 md:pb-36"
        style={{ backgroundColor: HOME.background }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.35fr)] lg:gap-16 lg:items-start">
            <div className="max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#14B8A6]">
                Support
              </p>
              <h2
                className="mt-3 text-3xl font-bold tracking-tight md:text-4xl"
                style={{ color: HOME.textDark }}
              >
                Got questions?
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Everything you need to know about booking with Shalean. Can&apos;t
                find what you&apos;re looking for?
              </p>
              <Link
                href="/contact"
                className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-white px-5 py-3 text-sm font-medium text-[#2563EB] shadow-sm transition-colors hover:bg-[#EFF6FF]"
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden />
                Contact support
              </Link>
            </div>
            <div className="min-w-0 overflow-hidden rounded-2xl border border-[#BFDBFE]/80 bg-white shadow-sm">
              <div className="divide-y divide-[#BFDBFE]/80">
                {FAQS.map((faq, idx) => (
                  <details key={idx} className="group px-5 sm:px-7 md:px-8">
                    <summary className="flex cursor-pointer list-none items-start gap-4 py-5 pr-[3.5rem] sm:pr-14 [&::-webkit-details-marker]:hidden">
                      <span
                        className="min-w-0 flex-1 text-left text-base font-bold leading-snug"
                        style={{ color: HOME.textDark }}
                      >
                        {faq.q}
                      </span>
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#BFDBFE] bg-white text-slate-400 transition-colors group-open:rotate-180 group-open:border-[#93C5FD]">
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                      </span>
                    </summary>
                    <div className="pb-5 pr-1 text-sm leading-relaxed text-slate-600 sm:pr-2">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {heroScheduleModalOpen && (
          <motion.div
            key="hero-schedule-overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close dialog"
              onClick={() => setHeroScheduleModalOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="hero-schedule-dialog-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md rounded-[22px] bg-white p-6 pt-12 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="hero-schedule-dialog-title" className="sr-only">
                Choose when you need your cleaning
              </h2>
              <button
                type="button"
                onClick={() => setHeroScheduleModalOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-900 transition-colors hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>

              <div className="space-y-0">
                <button
                  type="button"
                  role="radio"
                  aria-checked={heroScheduleDraft === "now"}
                  onClick={() => setHeroScheduleDraft("now")}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-neutral-900"
                >
                  Pickup now
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      heroScheduleDraft === "now"
                        ? "border-[#2563EB] bg-white"
                        : "border-neutral-300 bg-white"
                    )}
                    aria-hidden
                  >
                    {heroScheduleDraft === "now" ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
                    ) : null}
                  </span>
                </button>
                <div className="h-px w-full bg-neutral-200" />
                <button
                  type="button"
                  role="radio"
                  aria-checked={heroScheduleDraft === "later"}
                  onClick={() => setHeroScheduleDraft("later")}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-neutral-900"
                >
                  Schedule later
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      heroScheduleDraft === "later"
                        ? "border-[#2563EB] bg-white"
                        : "border-neutral-300 bg-white"
                    )}
                    aria-hidden
                  >
                    {heroScheduleDraft === "later" ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
                    ) : null}
                  </span>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setHeroScheduleModalOpen(false)}
                  className="text-[15px] font-bold text-neutral-900 transition-colors hover:text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmHeroSchedule}
                  className="rounded-lg bg-[#2563EB] px-6 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// ─── BOOKING PAGE ─────────────────────────────────────────────────────────────
const BookingPage = ({
  onNavigate,
  onStepChange,
}: {
  onNavigate: (page: PageType) => void;
  onStepChange: (step: number) => void;
}) => {
  return (
    <BookingSystem
      onNavigateContact={() => onNavigate("contact")}
      onStepChange={onStepChange}
    />
  );
};

// Path-to-page mapping for real routes (SEO and deep links)
const PATH_TO_PAGE: Record<string, PageType> = {
  "/": "home",
  "/services": "services",
  "/pricing": "pricing",
  "/locations": "locations",
  "/about": "about",
  "/contact": "contact",
  "/careers": "careers",
  "/blog": "blog",
};

const PAGE_TO_PATH: Record<PageType, string> = {
  home: "/",
  services: "/services",
  pricing: "/pricing",
  locations: "/locations",
  about: "/about",
  contact: "/contact",
  careers: "/careers",
  blog: "/blog",
  booking: "/booking/your-cleaning-plan",
};

// ─── NAVIGATION & LAYOUT ──────────────────────────────────────────────────────
export const ShaleanWebsite = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync current page and booking step from URL (real routes + booking steps)
  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/booking")) {
      setCurrentPage("booking");
      const parts = pathname.split("/").filter(Boolean);
      const slug = parts[1] ?? "";
      const slugToStep: Record<string, number> = {
        "your-cleaning-plan": 1,
        preferences: 2,
        schedule: 3,
        cleaner: 4,
        "your-details": 5,
        checkout: 6,
        /** Legacy URLs */
        "tip-promo": 3,
        details: 5,
        payment: 6,
      };
      setBookingStep(slugToStep[slug] ?? 1);
    } else {
      setCurrentPage(PATH_TO_PAGE[pathname] ?? "home");
    }
  }, [pathname]);

  const navigate = (page: PageType, bookingPrefill?: BookingRoutePrefill) => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (page === "booking") {
      const addr = bookingPrefill?.address?.trim();
      if (addr) {
        try {
          sessionStorage.setItem("shaleanBookingAddressPrefill", addr);
        } catch {
          /* ignore */
        }
      }
      const params = new URLSearchParams();
      if (bookingPrefill?.service) {
        const slug = getBookingServiceUrlSlug(bookingPrefill.service);
        if (slug) params.set("service", slug);
      }
      const qs = params.toString();
      router.push(
        `/booking/your-cleaning-plan${qs ? `?${qs}` : ""}`
      );
      return;
    }
    const path = PAGE_TO_PATH[page];
    if (path) router.push(path);
    else setCurrentPage(page);
  };

  const navLinks: { label: string; id: PageType }[] = [
    { label: "Home", id: "home" },
    { label: "Services", id: "services" },
    { label: "Pricing", id: "pricing" },
    { label: "Locations", id: "locations" },
    { label: "About", id: "about" },
    { label: "Careers", id: "careers" },
    { label: "Contact", id: "contact" },
  ];

  const isDashboardPage = false;

  const isBookingConfirmed = false;

  const isHomePage = currentPage === "home";

  const bookingStepperActiveIdx =
    bookingStep >= 1 && bookingStep <= 6 ? bookingStep - 1 : 0;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans text-slate-900 ${
        currentPage === "booking" || currentPage === "home"
          ? "bg-[#EFF6FF]"
          : "bg-slate-100"
      }`}
    >
      {/* Navigation */}
      {!isBookingConfirmed && isHomePage && (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-8 lg:gap-12 min-w-0">
              <Link
                href="/"
                className="text-base md:text-lg font-bold text-white tracking-tight whitespace-nowrap flex-shrink-0"
              >
                Shalean
              </Link>
              <nav
                className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/90"
                aria-label="Primary"
              >
                <Link
                  href="/services"
                  className="hover:text-white transition-colors"
                >
                  Services
                </Link>
                <Link
                  href="/#how-it-works"
                  className="hover:text-white transition-colors"
                >
                  How it works
                </Link>
                <Link
                  href="/locations"
                  className="hover:text-white transition-colors"
                >
                  Locations
                </Link>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  About
                </Link>
              </nav>
            </div>

            <div className="relative flex items-center gap-3 sm:gap-5 md:gap-6 flex-shrink-0">
              <button
                type="button"
                className="hidden md:inline-flex items-center justify-center gap-1.5 px-2 h-9 rounded-lg text-white hover:bg-white/10 transition-colors"
                aria-label="Language: English"
              >
                <Globe className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden />
                <span className="text-sm font-semibold tracking-wide">EN</span>
              </button>
              <Link
                href="/contact"
                className="hidden sm:inline text-sm font-medium text-white/90 hover:text-white transition-colors"
              >
                Help
              </Link>
              {!isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-4">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-white/90 hover:text-white transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm font-medium text-white/90 hover:text-white transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <div className="hidden sm:flex items-center">
                  <button
                    type="button"
                    onClick={() => setAvatarMenuOpen((open) => !open)}
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center text-sm font-semibold border border-slate-200 hover:border-white/80 transition-colors flex-shrink-0"
                    aria-expanded={avatarMenuOpen}
                    aria-haspopup="true"
                  >
                    {session?.user?.name
                      ? session.user.name.charAt(0).toUpperCase()
                      : session?.user?.email
                      ? session.user.email.charAt(0).toUpperCase()
                      : "U"}
                  </button>
                  {avatarMenuOpen && (
                    <div className="absolute right-0 top-12 w-44 rounded-xl bg-white text-slate-900 shadow-lg border border-slate-100 py-2 text-sm z-[100]">
                      <button
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          const role = (session?.user as any)?.role;
                          if (role === "admin") {
                            window.location.href = "/admin";
                          } else if (role === "customer") {
                            window.location.href = "/customer";
                          } else if (role === "cleaner") {
                            window.location.href = "/cleaner";
                          } else {
                            navigate("home");
                          }
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-100"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500" />
                        <span>Dashboard</span>
                      </button>
                      <button
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          navigate("contact");
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-100"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-500" />
                        <span>Help</span>
                      </button>
                      <div className="my-1 h-px bg-slate-100" />
                      <button
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <Link
                href="/quote"
                className="inline-flex items-center justify-center rounded-full bg-[#14B8A6] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#0D9488] sm:px-5 sm:text-sm"
              >
                Get Free Quote
              </Link>
              <button
                type="button"
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {!isBookingConfirmed && !isHomePage && (
      <nav className="fixed inset-x-0 top-0 z-50 w-full border-b border-white/15 bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-2 flex-shrink-0 text-white"
            >
              {currentPage !== "booking" && (
                <Image
                  src="/logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              )}
              <span
                className={`font-bold tracking-tight ${
                  currentPage === "booking" ? "text-base sm:text-lg" : "text-lg"
                }`}
              >
                Shalean{currentPage === "booking" ? "." : ""}
              </span>
            </Link>

            {/* Center: either nav links or booking stepper */}
            <div className="flex-1 flex justify-center min-w-0">
              {currentPage === "booking" ? (
                <div
                  className="hidden min-w-0 sm:flex sm:items-center sm:justify-center sm:gap-1.5 md:gap-2 lg:gap-3 max-w-4xl lg:max-w-5xl w-full"
                  role="list"
                  aria-label="Booking steps"
                >
                  {(
                    [
                      "Service",
                      "Preferences",
                      "Schedule",
                      "Cleaner",
                      "Details",
                      "Pay",
                    ] as const
                  ).map((label, idx) => {
                    const current = idx === bookingStepperActiveIdx;
                    const completed = idx < bookingStepperActiveIdx;
                    return (
                      <React.Fragment key={label}>
                        <div
                          className="flex w-[3.35rem] shrink-0 flex-col items-center gap-1 sm:w-16 md:w-[4.25rem]"
                          role="listitem"
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-black transition-all sm:h-9 sm:w-9 sm:text-xs ${
                              current
                                ? "border-white bg-white text-primary shadow-sm"
                                : completed
                                  ? "border-teal-400 bg-teal-500 text-white shadow-sm"
                                  : "border-white/25 bg-white/15 text-white/90"
                            }`}
                            aria-current={current ? "step" : undefined}
                            aria-label={label}
                          >
                            {completed && !current ? (
                              <CheckCircle2 className="h-4 w-4 stroke-[2.5] text-white sm:h-[18px] sm:w-[18px]" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <span className="hidden max-w-[5rem] text-center text-[7px] font-bold uppercase leading-tight tracking-wide text-white/60 sm:block sm:text-[8px] lg:max-w-none lg:text-[9px] lg:tracking-[0.1em]">
                            {label}
                          </span>
                        </div>
                        {idx < 5 && (
                          <div
                            className="hidden h-px w-2 shrink-0 bg-white/25 sm:block md:w-4 lg:w-6"
                            aria-hidden
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-8 text-sm">
                  <Link href="/" className="font-medium text-white/80 hover:text-white transition-colors">Home</Link>
                  <Link href="/about" className="font-medium text-white/80 hover:text-white transition-colors">About</Link>
                  <Link href="/services" className="font-medium text-white/80 hover:text-white transition-colors">Service</Link>
                  <Link href="/pricing" className="font-medium text-white/80 hover:text-white transition-colors">Pricing</Link>
                  {!isAuthenticated && (
                    <button
                      onClick={() => {
                        window.location.href = "/login";
                      }}
                      className="font-medium text-white/80 hover:text-white transition-colors"
                    >
                      Login or Sign Up
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Contact CTA, Avatar & Mobile Menu Button */}
            <div className="relative flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {currentPage === "booking" && (
                <Link
                  href="/"
                  className="hidden md:inline text-xs sm:text-sm font-medium text-white/80 hover:text-white transition-colors whitespace-nowrap"
                >
                  Back to home
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  router.push("/quote");
                }}
                className="hidden sm:inline-flex rounded-full bg-[#14B8A6] hover:bg-[#0D9488] text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 text-white shadow-sm transition-colors whitespace-nowrap"
              >
                Get Free Quote
              </button>
              {isAuthenticated && (
                <div className="hidden lg:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAvatarMenuOpen((open) => !open)}
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center text-sm font-semibold border border-slate-200 hover:border-blue-400 transition-colors flex-shrink-0"
                  >
                    {session?.user?.name
                      ? session.user.name.charAt(0).toUpperCase()
                      : session?.user?.email
                      ? session.user.email.charAt(0).toUpperCase()
                      : "U"}
                  </button>
                  {avatarMenuOpen && (
                    <div className="absolute right-0 top-11 mt-2 w-44 rounded-xl bg-white text-slate-900 shadow-lg border border-slate-100 py-2 text-sm z-[100]">
                      <button
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          const role = (session?.user as any)?.role;
                          if (role === "admin") {
                            window.location.href = "/admin";
                          } else if (role === "customer") {
                            window.location.href = "/customer";
                          } else if (role === "cleaner") {
                            window.location.href = "/cleaner";
                          } else {
                            navigate("home");
                          }
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-100"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500" />
                        <span>Dashboard</span>
                      </button>
                      <button
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          navigate("contact");
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-100"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-500" />
                        <span>Help</span>
                      </button>
                      <div className="my-1 h-px bg-slate-100" />
                      <button
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
        </div>
      </nav>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {!isBookingConfirmed && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[60] bg-black text-white p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                {isHomePage && (
                  <span className="text-xl font-bold text-white tracking-tight">
                    Shalean
                  </span>
                )}
                {!isHomePage && isAuthenticated && (
                  <div
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-base font-semibold border-2 border-blue-400/50 flex-shrink-0"
                    aria-hidden
                  >
                    {session?.user?.name
                      ? session.user.name.charAt(0).toUpperCase()
                      : session?.user?.email
                      ? session.user.email.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}
                {!isHomePage && !isAuthenticated && (
                  <Image
                    src="/logo.png"
                    alt="Shalean"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                )}
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="flex flex-col gap-6 text-lg">
              {isHomePage ? (
                <>
                  <Link
                    href="/services"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-medium text-white/90 hover:text-white transition-colors"
                  >
                    Services
                  </Link>
                  <Link
                    href="/#how-it-works"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-medium text-white/90 hover:text-white transition-colors"
                  >
                    How it works
                  </Link>
                  <Link
                    href="/locations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-medium text-white/90 hover:text-white transition-colors"
                  >
                    Locations
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-medium text-white/90 hover:text-white transition-colors"
                  >
                    About
                  </Link>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-left font-medium text-white/90 hover:text-white transition-colors"
                    aria-label="Language: English"
                  >
                    <Globe className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden />
                    <span className="text-sm font-semibold tracking-wide">EN</span>
                  </button>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-medium text-white/90 hover:text-white transition-colors"
                  >
                    Help
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="font-medium text-white/80 hover:text-white transition-colors">Home</Link>
                  <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="font-medium text-white/80 hover:text-white transition-colors">About</Link>
                  <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="font-medium text-white/80 hover:text-white transition-colors">Service</Link>
                  <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="font-medium text-white/80 hover:text-white transition-colors">Pricing</Link>
                </>
              )}
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const role = (session?.user as any)?.role;
                      if (role === "admin") window.location.href = "/admin";
                      else if (role === "customer") window.location.href = "/customer";
                      else if (role === "cleaner") window.location.href = "/cleaner";
                      else navigate("home");
                    }}
                    className="flex items-center gap-2 font-medium text-white/80 hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex items-center gap-2 font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.href = "/login";
                    }}
                    className={`text-left font-medium transition-colors ${
                      isHomePage
                        ? "text-white/90 hover:text-white"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {isHomePage ? "Log in" : "Login or Sign Up"}
                  </button>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-left font-medium transition-colors ${
                      isHomePage
                        ? "text-white/90 hover:text-white"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    Create account
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  router.push("/quote");
                }}
                className={`mt-4 inline-flex justify-center rounded-full px-6 py-3 text-sm font-bold shadow-md transition-colors ${
                  isHomePage
                    ? "bg-[#14B8A6] text-white hover:bg-[#0D9488]"
                    : "bg-blue-600 font-semibold text-white hover:bg-blue-700"
                }`}
              >
                Get Free Quote
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <main
        className={`flex-grow ${
          isDashboardPage
            ? ""
            : isHomePage
            ? "bg-[#EFF6FF] pt-14 md:pt-16"
            : "pt-24 md:pt-28"
        }`}
      >
        {currentPage === "home" && <HomePage onNavigate={navigate} />}
        {currentPage === "booking" && (
          <BookingPage onNavigate={navigate} onStepChange={setBookingStep} />
        )}
        {currentPage === "services" && <ServicesPage onNavigate={navigate} />}
        {currentPage === "pricing" && <PricingPage onNavigate={navigate} />}
        {currentPage === "locations" && <LocationsPage onNavigate={navigate} />}
        {currentPage === "about" && <AboutPage onNavigate={navigate} />}
        {currentPage === "careers" && <CareersPage onNavigate={navigate} />}
        {currentPage === "contact" && <ContactPage onNavigate={navigate} />}
        {currentPage === "blog" && <BlogPage onNavigate={navigate} />}
      </main>

      {/* Footer */}
      {!isDashboardPage && !isBookingConfirmed && (
        currentPage === "booking" ? (
          <footer className="flex h-20 items-center bg-[#0a0a0a] text-neutral-400">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 text-xs sm:text-sm">
              <span>© 2026 Shalean. All rights reserved</span>
              <div className="flex items-center gap-4">
                <Link
                  href="/terms"
                  className="transition hover:text-white"
                >
                  Terms of service
                </Link>
                <Link
                  href="/cancellation-policy"
                  className="transition hover:text-white"
                >
                  Cancellation policy
                </Link>
              </div>
            </div>
          </footer>
        ) : (
          <Footer />
        )
      )}

      {/* Floating Action Buttons */}
      {!isDashboardPage && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 bg-teal-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-teal-600"
          >
            <Phone className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="hidden md:flex w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg items-center justify-center hover:bg-blue-700"
            onClick={() => navigate("booking")}
          >
            <Calendar className="w-6 h-6" />
          </motion.button>
        </div>
      )}

      {/* Sticky Mobile Book Button */}
      {currentPage !== "booking" &&
        currentPage !== "home" &&
        currentPage !== "about" &&
        currentPage !== "services" &&
        currentPage !== "pricing" &&
        !isDashboardPage && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-40 flex gap-4">
          <Button
            onClick={() => navigate("booking")}
            className="flex-1 py-4 text-lg shadow-lg"
          >
            Book Now
          </Button>
          <button className="bg-teal-500 text-white p-4 rounded-full shadow-lg">
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Dashboards now live on dedicated routes; dev navigation helper removed. */}
    </div>
  );
};

