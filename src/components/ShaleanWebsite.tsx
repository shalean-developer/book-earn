 "use client";

import React, { useState, useEffect } from "react";
import {
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
  ArrowRight,
  Plus,
  Minus,
  Briefcase,
  Users,
  Facebook,
  Instagram,
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
  ExternalLink,
  FileText,
  Twitter,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BookingSystem } from "./BookingSystem";
import { ServicesPage } from "./ServicesPage";
import { PricingPage } from "./PricingPage";
import { LocationsPage } from "./LocationsPage";
import { AboutPage } from "./AboutPage";
import { AboutSection } from "./AboutSection";
import { CareersPage } from "./CareersPage";
import { ContactPage } from "./ContactPage";
import { BlogPage } from "./BlogPage";
import { useSession, signOut } from "next-auth/react";
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
    q: "Are your cleaners vetted?",
    a: "Yes, every professional on our platform undergoes a rigorous background check and vetting process.",
  },
  {
    q: "Do I need to be home?",
    a: "It's entirely up to you. Many clients provide access instructions, while others prefer to be present.",
  },
  {
    q: "What if I'm not happy?",
    a: "We offer a 100% satisfaction guarantee. If anything is missed, we'll return to fix it at no cost.",
  },
  {
    q: "Do you bring your own supplies?",
    a: "By default, our cleaners bring standard supplies. Heavy equipment like vacuum cleaners can be requested for a small fee.",
  },
] as { q: string; a: string }[];

// --- Sub-components ---

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
    secondary: "bg-emerald-500 text-white hover:bg-emerald-600",
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
      title: "Complete Guide to Deep Cleaning Your Cape Town Home",
      category: "Deep Cleaning",
      readTime: "5 min read",
      img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      excerpt:
        "Everything you need to know about scheduling a professional deep clean, what's covered, and how to prepare your home.",
    },
    {
      title: "How Much Does Cleaning Cost in Cape Town?",
      category: "Pricing Guide",
      readTime: "4 min read",
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      excerpt:
        "A transparent breakdown of cleaning service costs across Cape Town suburbs, including seasonal pricing factors.",
    },
    {
      title: "Airbnb Cleaning Checklist for Hosts",
      category: "Airbnb",
      readTime: "6 min read",
      img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
      excerpt:
        "The complete turnaround checklist top-rated Cape Town Airbnb hosts use to maintain 5-star cleanliness ratings.",
    },
  ];

  return (
    <section className="bg-slate-100 pt-1 pb-8">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 md:p-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 text-slate-500 bg-slate-100 w-fit px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                <FileText className="w-4 h-4" />
                <span>Cleaning Guides & Tips</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Practical Guides from Our Cleaning Experts
              </h2>
              <p className="text-slate-500 text-base md:text-lg max-w-2xl">
                Short, actionable guides to help you get more from every clean — whether you book with us or DIY.
              </p>
            </div>
            <Button
              onClick={() => onNavigate("blog")}
              variant="outline"
              className="whitespace-nowrap self-start sm:self-auto"
            >
              View All Articles <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((post, idx) => (
              <motion.div
                key={idx}
                whileHover={{
                  y: -4,
                }}
              >
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col cursor-pointer overflow-hidden">
                  <div className="px-6 pt-6 pb-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-600">
                          {post.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-3 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="mt-4">
                    <img
                      src={post.img}
                      alt={post.title}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                  <div className="px-6 pt-4 pb-6 mt-auto">
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold">
                      Read Guide <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HomePage = ({ onNavigate }: { onNavigate: (page: PageType) => void }) => {
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

  const displayRating =
    reviewSummary.averageRating !== null
      ? reviewSummary.averageRating.toFixed(1)
      : "4.5";
  const displayTotalReviews =
    reviewSummary.totalReviews !== null
      ? `${reviewSummary.totalReviews}+`
      : "4284+";

  return (
    <div className="pb-24">
      {/* Hero Section — full image background with left overlay, same width as navbar */}
      <section className="mt-[-12px] sm:mt-0">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-3xl shadow-xl overflow-hidden border border-slate-200 min-h-[35vh] sm:min-h-[420px] lg:min-h-[500px]"
          >
            {/* Full-bleed background image — visible on all breakpoints */}
            <img
              src="/hero-cleaning-team.png"
              alt="Professional cleaning team"
              className="absolute inset-0 w-full h-full object-cover object-left-top"
            />
            {/* Dark gradient overlay — left to right for text contrast */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent"
              aria-hidden
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-stretch min-h-[35vh] sm:min-h-[420px] lg:min-h-[500px]">
              {/* Left — white text over dark overlay */}
              <div className="flex flex-col justify-start lg:justify-center px-4 pt-6 pb-6 sm:p-8 md:p-10 lg:p-12 lg:max-w-[55%] order-2 lg:order-1">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-3 sm:mb-6">
                  Custom home cleaning services
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/95 leading-relaxed max-w-xl mb-4 sm:mb-8">
                  Enjoy a spotless space with our trusted cleaning professionals. Eco-friendly, flexible, and always on time.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                  <button
                    onClick={() => onNavigate("booking")}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-4 text-white shadow-md transition-colors"
                  >
                    Book Now <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => onNavigate("services")}
                    className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border-2 border-white/80 font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-4 transition-colors"
                  >
                    WhatsApp Us
                  </button>
                </div>
              </div>

              {/* Right — image shows through; trust overlay bottom-right */}
              <div className="relative flex-1 order-1 lg:order-2 min-h-[40px] sm:min-h-[260px] lg:min-h-0" />
            </div>

            {/* Trust badge — bottom right over image on tablet/desktop, hidden on very small screens */}
            <div className="hidden sm:block absolute bottom-4 right-4 left-4 lg:left-auto lg:right-20 lg:w-[280px] z-20 bg-slate-900/70 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-2">
                  {[
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-white/80 object-cover"
                    />
                  ))}
                </div>
                <span className="flex items-center gap-1 text-white font-semibold text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {displayRating} ({displayTotalReviews} reviews)
                </span>
              </div>
              <p className="text-white/90 text-xs leading-snug">
                Over 500 people have trusted us and left positive reviews. Join them!
              </p>
            </div>
          </motion.div>

          {/* Mobile trust badge — stacked under hero for better responsiveness */}
          <div className="sm:hidden mt-3">
            <div className="bg-slate-900 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-7 h-7 rounded-full border-2 border-white/80 object-cover"
                    />
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-white text-xs font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {displayRating} ({displayTotalReviews} reviews)
                  </span>
                  <span className="text-[11px] text-white/80">
                    Over 500 people trust our cleaners.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section — gap matches visible space between navbar and hero */}
      <section className="mt-12">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <AboutSection onNavigate={onNavigate} />
        </div>
      </section>

      {/* Stats cards — below About Us */}
      <section className="mt-8 lg:mt-8">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-left">
              <p className="text-3xl md:text-4xl font-bold text-slate-900">500+</p>
              <h3 className="text-lg font-semibold text-slate-900 mt-4">Happy Clients</h3>
              <p className="text-base text-slate-500 leading-relaxed mt-2">
                Trusted by hundreds of homeowners and offices, Shalean delivers spotless results that bring real satisfaction every time.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-left">
              <p className="text-3xl md:text-4xl font-bold text-slate-900">1,200+</p>
              <h3 className="text-lg font-semibold text-slate-900 mt-4">Completed Cleanings</h3>
              <p className="text-base text-slate-500 leading-relaxed mt-2">
                From cozy apartments to large offices, we&apos;ve successfully completed over a thousand cleaning sessions with consistent quality.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-left">
              <p className="text-3xl md:text-4xl font-bold text-slate-900">100%</p>
              <h3 className="text-lg font-semibold text-slate-900 mt-4">Service Commitment</h3>
              <p className="text-base text-slate-500 leading-relaxed mt-2">
                We take pride in our reliability, attention to detail, and 100% commitment to creating healthier, fresher spaces.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service highlight card — same spacing as above */}
      <section className="mt-8 lg:mt-8">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 bg-slate-100 border border-slate-200">
              <Sparkles className="w-4 h-4 text-slate-500" />
              Service
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-6 mb-5 leading-tight">
              Complete Home and Office Cleaning You Can Trust
            </h2>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-3xl">
              At Shalean, we provide a full range of cleaning solutions for every space — whether it&apos;s your cozy home or a busy office. Our goal is to deliver spotless results with care, reliability, and consistency.
            </p>
          </div>
        </div>
      </section>

      {/* Service cards with full-bleed images — below Service highlight card */}
      <section className="mt-8 lg:mt-8">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Home Cleaning",
                description:
                  "Keep your living space fresh and organized with regular or one-time cleaning tailored to your schedule.",
                image:
                  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
              },
              {
                title: "Office Cleaning",
                description:
                  "Maintain a clean, productive workspace that boosts focus and leaves a lasting impression on clients.",
                image:
                  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
              },
              {
                title: "Deep Cleaning",
                description:
                  "Thorough intensive cleaning for every corner — from upholstery to hard-to-reach spaces.",
                image:
                  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                className="group relative aspect-[4/5] min-h-[320px] rounded-2xl overflow-hidden cursor-pointer"
                whileHover={{ y: -4 }}
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-left">
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-white/95 leading-relaxed mb-4 max-w-md">
                    {card.description}
                  </p>
                  <Button
                    onClick={() => onNavigate("booking")}
                    className="w-fit bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium"
                  >
                    Book Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Steps to a Cleaner Home — same spacing as above */}
      <section className="mt-8 lg:mt-8">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="bg-[#316DF8] rounded-2xl px-6 py-8 md:px-12 md:py-10 lg:px-16 lg:py-12">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white/95 bg-white/20 border border-white/30">
              <Sparkles className="w-4 h-4" />
              How It Work
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-5 leading-tight">
              Simple Steps to a Cleaner Home
            </h2>
            <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-2xl mb-8 md:mb-10">
              Our cleaning process is simple, quick, and reliable — from booking to enjoying your spotless home.
            </p>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {[
                {
                  step: "01",
                  title: "Book Your Service",
                  desc: "Easily select your preferred date, time, and cleaning plan through our user-friendly online platform.",
                },
                {
                  step: "02",
                  title: "Confirmation & Preparation",
                  desc: "We confirm your booking and prepare all the tools and supplies needed.",
                },
                {
                  step: "03",
                  title: "We Do the Cleaning",
                  desc: "Our expert team arrives on time, making your space shine and creating a warm atmosphere.",
                },
                {
                  step: "04",
                  title: "Relax & Enjoy",
                  desc: "Sit back, unwind, and experience the comfort of a freshly cleaned home.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="text-4xl md:text-5xl lg:text-6xl font-black text-white/30 flex-shrink-0 leading-none">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial — white card block */}
      <section className="mt-8 lg:mt-8 bg-slate-100 pb-6">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 md:p-12">
            <div className="flex items-center gap-2 text-slate-500 bg-slate-100 w-fit px-3 py-1.5 rounded-full text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              <span>Testimonial</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-5">
              Over 500 Positive Reviews
            </h2>
            <p className="text-slate-500 text-base md:text-lg mb-6 max-w-2xl">
              Real stories from happy homeowners who trust Shalean to keep their
              spaces fresh, spotless, and worry-free.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80",
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-900">
                  {displayRating}
                </span>
              </div>
              <span className="text-slate-500 text-sm">
                ({displayTotalReviews} reviews)
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    "Nobody has ever cleaned my place with such attention to detail. The team was friendly, on time, and left my home sparkling!",
                  name: "Fallah Maulana",
                  avatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
                },
                {
                  quote:
                    "It's the first time my apartment has felt this fresh. Shalean really exceeded my expectations.",
                  name: "Hanifa Maulina",
                  avatar:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80",
                },
                {
                  quote:
                    "They made my move-out cleaning effortless. Everything looked brand new again - totally worth it.",
                  name: "Hanifa Maulina",
                  avatar:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
                >
                  <p className="text-slate-900 font-bold text-base leading-snug mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{t.name}</p>
                      <div className="flex items-center gap-1 text-slate-700">
                        {[1, 2, 3, 4, 5].map((_) => (
                          <Star
                            key={_}
                            className="w-4 h-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                        <span className="text-sm font-semibold ml-1">5.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <BlogPreviewSection onNavigate={onNavigate} />

      {/* Local SEO Authority */}
      <LocalSEOSection onNavigate={onNavigate} />

      {/* Freshness Promo Banner – match design exactly */}
      <section className="bg-slate-100 pt-2 pb-8">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-xl min-h-[320px] lg:min-h-[380px]">
            {/* Background image */}
            <img
              src="/hero-cleaning-team.png"
              alt="Professional cleaning team in a modern living room"
              className="absolute inset-0 h-full w-full object-cover object-left"
            />

            {/* Dark gradient overlay for text contrast on left side */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"
              aria-hidden
            />

            {/* Left text content */}
            <div className="relative z-10 flex h-full items-center">
              <div className="px-8 py-10 md:px-12 lg:px-16 lg:py-14 max-w-xl">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                  Let&apos;s Bring Freshness
                  <br />
                  Back to Your Home
                </h2>
                <p className="text-sm md:text-base text-white/90 leading-relaxed mb-7 max-w-md">
                  Book your trusted cleaning service today and enjoy the comfort of a
                  spotless, stress-free space — because every home deserves to feel
                  fresh.
                </p>
                <Button
                  onClick={() => onNavigate("booking")}
                  variant="primary"
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                >
                  Book a Cleaning Now
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mt-8 lg:mt-8 bg-slate-100 pb-0">
        <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 md:p-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 text-slate-500 bg-slate-100 w-fit px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                  <HelpCircle className="w-4 h-4" />
                  <span>Support & FAQs</span>
                </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-5">
                  Common Questions
                </h2>
                <p className="text-slate-500 text-base md:text-lg max-w-2xl">
                  Everything you need to know about booking, our cleaners, and how our service works.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <details
                  key={idx}
                  className="group border border-slate-200 rounded-xl overflow-hidden bg-white"
                >
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                    <span className="font-semibold text-slate-800 text-left">
                      {faq.q}
                    </span>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 group-open:bg-blue-50 group-open:border-blue-200">
                      <Plus className="w-4 h-4 text-slate-500 group-open:text-blue-600 group-open:rotate-45 transition-transform" />
                    </div>
                  </summary>
                  <div className="p-5 pt-0 text-slate-600 border-t border-slate-100">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

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

// ─── NAVIGATION & LAYOUT ──────────────────────────────────────────────────────
export const ShaleanWebsite = () => {
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { pathname } = window.location;
    if (pathname.startsWith("/booking")) {
      setCurrentPage("booking");
      const parts = pathname.split("/").filter(Boolean);
      const slug = parts[1] ?? "";
      const slugToStep: Record<string, number> = {
        "your-cleaning-plan": 1,
        schedule: 2,
        details: 3,
        payment: 4,
      };
      setBookingStep(slugToStep[slug] ?? 1);
    }
  }, []);

  const navigate = (page: PageType) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const isBookingConfirmed = currentPage === "booking" && bookingStep === 5;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-100">
      {/* Navigation */}
      {!isBookingConfirmed && (
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pb-2">
        <div className="w-full max-w-7xl px-6">
          <div className="flex items-center justify-between rounded-full bg-black text-white px-6 py-2 shadow-lg gap-6">
            {/* Brand */}
            <button
              className="flex items-center gap-2 cursor-pointer flex-shrink-0"
              onClick={() => navigate("home")}
            >
              <span className="text-lg font-black tracking-[0.2em]">
                Shalean
              </span>
            </button>

            {/* Center: either nav links or booking stepper */}
            <div className="flex-1 flex justify-center">
              {currentPage === "booking" ? (
                <div
                  className="hidden md:flex items-center gap-3 max-w-md w-full"
                  role="list"
                  aria-label="Booking steps"
                >
                  {["Plan", "Schedule", "Details", "Payment"].map(
                    (label, idx) => {
                      const current = idx + 1 === bookingStep;
                      const completed = idx + 1 < bookingStep;
                      return (
                        <React.Fragment key={label}>
                          <div
                            className="flex flex-col items-center gap-1 flex-1"
                            role="listitem"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                current
                                  ? "bg-blue-600 text-white shadow-md"
                                  : completed
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                              aria-current={current ? "step" : undefined}
                              aria-label={label}
                            >
                              {idx + 1}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-300">
                              {label}
                            </span>
                          </div>
                          {idx < 3 && (
                            <div className="h-px flex-1 bg-slate-700/40 rounded-full" />
                          )}
                        </React.Fragment>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-8 text-sm">
                  {["Home", "About", "Service", "Pricing"].map((label) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (label === "Home") navigate("home");
                        if (label === "About") navigate("about");
                        if (label === "Service") navigate("services");
                        if (label === "Pricing") navigate("pricing");
                      }}
                      className="font-medium text-white/80 hover:text-white transition-colors"
                    >
                      {label}
                    </button>
                  ))}
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
            <div className="relative flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => navigate("contact")}
                className="hidden sm:inline-flex rounded-full bg-blue-600 hover:bg-blue-700 text-sm font-semibold px-5 py-2 text-white shadow-md transition-colors"
              >
                Get Quote
              </button>
              {isAuthenticated && (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAvatarMenuOpen((open) => !open)}
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center text-sm font-semibold border border-slate-200 hover:border-blue-400 transition-colors"
                  >
                    {session?.user?.name
                      ? session.user.name.charAt(0).toUpperCase()
                      : session?.user?.email
                      ? session.user.email.charAt(0).toUpperCase()
                      : "U"}
                  </button>
                  {avatarMenuOpen && (
                    <div className="absolute right-0 top-11 mt-2 w-44 rounded-xl bg-white text-slate-900 shadow-lg border border-slate-100 py-2 text-sm z-50">
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
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
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
              <span className="text-xl font-black tracking-[0.2em]">
                Shalean
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="flex flex-col gap-6 text-lg">
              {[
                "Home",
                "About",
                "Service",
                "Pricing",
              ].map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (label === "Home") navigate("home");
                    if (label === "About") navigate("about");
                    if (label === "Service") navigate("services");
                    if (label === "Pricing") navigate("pricing");
                  }}
                  className="text-left font-medium text-white/80 hover:text-white transition-colors"
                >
                  {label}
                </button>
              ))}
              {!isAuthenticated && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = "/login";
                  }}
                  className="text-left font-medium text-white/80 hover:text-white transition-colors"
                >
                  Login or Sign Up
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("contact");
                }}
                className="mt-4 inline-flex justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-sm font-semibold px-6 py-3 text-white shadow-md transition-colors"
              >
                Get Quote
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <main className={`flex-grow ${isDashboardPage ? "" : "pt-24 md:pt-28"}`}>
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
          <footer className="bg-black text-white h-20 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between text-xs sm:text-sm">
              <span>©2026 Shalean. All rights reserved</span>
              <div className="flex items-center gap-4">
                <span className="cursor-pointer text-white/70 hover:text-white">
                  Privacy Policy
                </span>
                <span className="cursor-pointer text-white/70 hover:text-white">
                  Terms of Use
                </span>
              </div>
            </div>
          </footer>
        ) : (
          <footer className="bg-slate-100 text-neutral-100 pt-0 pb-10 -mt-4">
            <div className="max-w-7xl mx-auto w-full px-6">
              <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-black/90 px-6 py-10 md:px-10 md:py-12">
              {/* Big watermark text */}
              <div className="pointer-events-none absolute inset-x-0 bottom-[-10%] flex justify-center opacity-10">
                <span className="font-semibold tracking-[0.2em] text-[60px] md:text-[96px] lg:text-[128px]">
                  SHALEAN
                </span>
              </div>

              <div className="relative grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                {/* Left: Brand */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold tracking-tight">
                      Shalean
                    </h2>
                    <p className="max-w-sm text-sm text-neutral-400">
                      Crafting meaningful designs that blend creativity,
                      usability, and impact.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-neutral-400">
                    {[Facebook, Twitter, Instagram].map((Icon, idx) => (
                      <button
                        key={idx}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/60 text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Columns */}
                <div className="grid gap-8 text-sm md:grid-cols-3">
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Navigation
                    </h3>
                    <ul className="space-y-2">
                      {["Home", "Features", "Service", "How it works", "Pricing", "FAQ"].map(
                        (item) => (
                          <li key={item}>
                            <span className="cursor-pointer text-neutral-300 transition hover:text-white">
                              {item}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      What we do
                    </h3>
                    <ul className="space-y-2">
                      {[
                        "Workflow Automation",
                        "Collaboration Tools",
                        "Integrations",
                        "How it works",
                        "Policy",
                      ].map((item) => (
                        <li key={item}>
                          <span className="text-neutral-300 transition hover:text-white">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Support
                    </h3>
                    <ul className="space-y-2">
                      {[
                        "FAQ",
                        "Collaboration",
                        "Hire Me",
                        "Licensing & Usage",
                        "Feedback",
                        "Resources",
                      ].map((item) => (
                        <li key={item}>
                          <span className="text-neutral-300 transition hover:text-white">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

                {/* Bottom bar */}
                <div className="relative mt-10 flex flex-col gap-4 border-t border-neutral-800 pt-6 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
                  <p>©2026 Shalean. All rights reserved</p>
                  <div className="flex items-center gap-6">
                    <span className="cursor-pointer transition hover:text-neutral-200">
                      Privacy Policy
                    </span>
                    <span className="cursor-pointer transition hover:text-neutral-200">
                      Term of Use
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        )
      )}

      {/* Floating Action Buttons */}
      {!isDashboardPage && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600"
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
          <button className="bg-emerald-500 text-white p-4 rounded-full shadow-lg">
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Dashboards now live on dedicated routes; dev navigation helper removed. */}
    </div>
  );
};

