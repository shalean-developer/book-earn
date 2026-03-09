'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  CheckCircle2,
  Star,
  ShieldCheck,
  Clock,
  Phone,
  MessageSquare,
  Mail,
  Menu,
  X,
  Calendar,
  Home,
  Trash2,
  Layers,
  Sparkles,
  MapPin,
  ArrowRight,
  Plus,
  Minus,
  Briefcase,
  Users,
  Globe,
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
  ClipboardList,
  ListOrdered,
  User,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ServicesPage } from './ServicesPage';
import { PricingPage } from './PricingPage';
import { LocationsPage } from './LocationsPage';
import { AboutPage } from './AboutPage';
import { CareersPage } from './CareersPage';
import { ContactPage } from './ContactPage';
import { BlogPage } from './BlogPage';
import { QuoteRequestForm } from './QuoteRequestForm';
import { AdminDashboard, type AdminDashboardTab } from './AdminDashboard';
import { CustomerDashboard, type CustomerDashboardTab } from './CustomerDashboard';
import { CleanerDashboard, type CleanerDashboardTab } from './CleanerDashboard';
import { AuthModal } from './AuthModal';
import {
  getMyBookings,
  getMyCleanerJobs,
  getAdminStatsForSession,
  getAdminBookingsForSession,
} from '@/app/actions/dashboard';
import { getCleanersForAdmin } from '@/app/actions/admin';
import { getProfileForSession } from '@/app/actions/profile';
import { getPlatformRatingStats } from '@/app/actions/ratings';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile, CleanerProfile, AdminProfile } from '@/lib/dashboard-types';
import type { AdminBookingRow, AdminBookingFilters } from '@/app/actions/dashboard';

type ServiceType = 'standard' | 'deep' | 'move' | 'airbnb' | 'carpet';
type PageType =
  | 'home'
  | 'services'
  | 'booking'
  | 'quote'
  | 'locations'
  | 'about'
  | 'blog'
  | 'contact'
  | 'careers'
  | 'pricing'
  | 'admin'
  | 'customer'
  | 'cleaner';

interface Service {
  id: ServiceType;
  title: string;
  description: string;
  price: number;
  icon: React.ReactNode;
}

const StandardCleaningIcon = () => (
  <div className="relative">
    <Home className="w-7 h-7" />
    <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1" />
  </div>
);

const VacuumIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {/* Canister body */}
    <path d="M8 5h8a2 2 0 012 2v5a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2z" />
    {/* Hose down to nozzle */}
    <path d="M12 12v6" />
    {/* Nozzle / floor head */}
    <path d="M8 18h8a1 1 0 001-1v-1H7v1a1 1 0 001 1z" />
  </svg>
);

const SERVICES: Service[] = [
  {
    id: 'standard',
    title: 'Standard Cleaning',
    description: 'Regular upkeep for your living space.',
    price: 450,
    icon: <StandardCleaningIcon />
  },
  {
    id: 'deep',
    title: 'Deep Cleaning',
    description: 'Thorough intensive cleaning for every corner.',
    price: 850,
    icon: <Layers className="w-6 h-6" />
  },
  {
    id: 'move',
    title: 'Move In / Out',
    description: 'Specialized cleaning for transitions.',
    price: 1200,
    icon: <Home className="w-6 h-6" />
  },
  {
    id: 'airbnb',
    title: 'Airbnb Cleaning',
    description: 'Fast turnaround for guest satisfaction.',
    price: 650,
    icon: <Calendar className="w-6 h-6" />
  },
  {
    id: 'carpet',
    title: 'Carpet Cleaning',
    description: 'Professional stain and dirt removal.',
    price: 350,
    icon: <VacuumIcon />
  }
];

const LOCATIONS = [
  { name: 'Sea Point', slug: 'sea-point' },
  { name: 'Claremont', slug: 'claremont' },
  { name: 'Durbanville', slug: 'durbanville' },
  { name: 'Observatory', slug: 'observatory' },
  { name: 'Century City', slug: 'century-city' },
  { name: 'Table View', slug: 'table-view' },
  { name: 'Gardens', slug: 'gardens' },
  { name: 'Constantia', slug: 'constantia' }
];

const FAQS = [
  {
    q: 'Are your cleaners vetted?',
    a: 'Yes, every professional on our platform undergoes a rigorous background check and vetting process.'
  },
  {
    q: 'Do I need to be home?',
    a: "It's entirely up to you. Many clients provide access instructions, while others prefer to be present."
  },
  {
    q: "What if I'm not happy?",
    a: "We offer a 100% satisfaction guarantee. If anything is missed, we'll return to fix it at no cost."
  },
  {
    q: 'Do you bring your own supplies?',
    a: 'By default, our cleaners bring standard supplies. Heavy equipment like vacuum cleaners can be requested for a small fee.'
  }
] as { q: string; a: string }[];

const SectionHeading = ({
  children,
  subtitle,
  centered = false
}: {
  children: React.ReactNode;
  subtitle?: string;
  centered?: boolean;
}) => (
  <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
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
  variant = 'primary',
  className = '',
  onClick
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  onClick?: () => void;
}) => {
  const baseClasses =
    'px-6 py-3 rounded-full font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
    secondary: 'bg-emerald-500 text-white hover:bg-emerald-600',
    outline: 'border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50',
    ghost: 'text-slate-700 bg-transparent hover:text-blue-600 hover:bg-slate-100'
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({
  children,
  className = ''
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

const LocalSEOSection = ({ onNavigate }: { onNavigate: (page: PageType) => void }) => (
  <section className="px-6 md:px-6 mt-8 md:mt-10">
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-4">
              <MapPin className="w-4 h-4 text-slate-500" />
              Areas We Serve
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Professional Cleaning Services Across Cape Town
            </h2>
            <div className="space-y-4 text-slate-600 text-base md:text-lg leading-relaxed">
              <p>
                Shalean Cleaning Services proudly serves homeowners, landlords,
                and Airbnb hosts across all major Cape Town suburbs. From the
                vibrant streets of{' '}
                <strong className="text-slate-900">Sea Point</strong> and{' '}
                <strong className="text-slate-900">Gardens</strong> to the leafy
                avenues of <strong className="text-slate-900">Constantia</strong>{' '}
                and <strong className="text-slate-900">Claremont</strong>, our
                professionally trained team is never far away.
              </p>
              <p>
                Whether you're in{' '}
                <strong className="text-slate-900">Century City</strong>,{' '}
                <strong className="text-slate-900">Durbanville</strong>,{' '}
                <strong className="text-slate-900">Table View</strong>, or{' '}
                <strong className="text-slate-900">Observatory</strong>, we offer
                fast scheduling with same-week availability across the greater
                Cape Town metro. Our local teams know your area and are ready to
                deliver a spotless clean every time.
              </p>
            </div>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => onNavigate('booking')}
                className="inline-flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base px-6 py-3.5 transition-colors"
              >
                Book Cleaning in Cape Town <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
            {LOCATIONS.map((loc) => (
              <a
                key={loc.slug}
                href={`/locations/${loc.slug}`}
                className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
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

const BlogPreviewSection = ({ onNavigate }: { onNavigate: (page: PageType) => void }) => {
  const [featured, ...sidebar] = [
    {
      title: 'Complete Guide to Deep Cleaning Your Cape Town Home',
      category: 'Deep Cleaning',
      readTime: '5 min read',
      img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      excerpt:
        "Everything you need to know about scheduling a professional deep clean, what's covered, and how to prepare your home."
    },
    {
      title: 'How Much Does Cleaning Cost in Cape Town?',
      category: 'Pricing Guide',
      readTime: '4 min read',
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      excerpt:
        'A transparent breakdown of cleaning service costs across Cape Town suburbs, including seasonal pricing factors.'
    },
    {
      title: 'Airbnb Cleaning Checklist for Hosts',
      category: 'Airbnb',
      readTime: '6 min read',
      img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80',
      excerpt:
        'The complete turnaround checklist top-rated Cape Town Airbnb hosts use to maintain 5-star cleanliness ratings.'
    }
  ];

  return (
    <section className="px-6 md:px-6 mt-8 md:mt-10">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
          {/* Header: same pill + heading pattern as About, Service, Testimonial */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-6 md:mb-8">
            <div>
              <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-4">
                <BookOpen className="w-4 h-4 text-slate-500" />
                From the blog
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-2">
                Cleaning Guides & Tips
              </h2>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-xl">
                Practical advice from the Cape Town experts — deep cleans, pricing, and checklists.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('blog')}
              className="inline-flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base px-6 py-3.5 transition-colors w-fit shrink-0"
            >
              View All Articles <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Layout: featured (large) + 2 sidebar cards — same card style as rest of site */}
          <div className="grid lg:grid-cols-12 gap-5 md:gap-6">
          {/* Featured article */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4 }}
            onClick={() => onNavigate('blog')}
            className="lg:col-span-7 group cursor-pointer"
          >
            <div className="h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col">
              <div className="aspect-[16/10] overflow-hidden relative">
                <img
                  src={featured.img}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-full">
                    {featured.category}
                  </span>
                  <span className="text-xs font-medium text-white/90 bg-black/40 px-2.5 py-1 rounded-full">
                    {featured.readTime}
                  </span>
                </div>
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-grow">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                  {featured.title}
                </h3>
                <p className="text-slate-600 leading-relaxed flex-grow mb-6">
                  {featured.excerpt}
                </p>
                <span className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
                  Read full guide <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </motion.article>

          {/* Sidebar articles */}
          <div className="lg:col-span-5 flex flex-col gap-5 md:gap-6">
            {sidebar.map((post, idx) => (
              <motion.article
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: (idx + 1) * 0.08 }}
                onClick={() => onNavigate('blog')}
                className="group cursor-pointer"
              >
                <div className="flex gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 hover:shadow-md transition-all duration-300 h-full">
                  <div className="w-28 sm:w-32 flex-shrink-0 rounded-xl overflow-hidden aspect-[4/3] bg-slate-100">
                    <img
                      src={post.img}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col flex-grow">
                    <span className="text-xs font-semibold text-blue-600 mb-1">
                      {post.category}
                    </span>
                    <h4 className="font-bold text-slate-900 leading-snug mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-3 flex-grow">
                      {post.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold mt-auto">
                      Read <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};

type PlatformRatingStats = { averageRating: number; totalReviews: number } | null;

const HomePage = ({
  onNavigate,
  platformRatingStats,
}: {
  onNavigate: (page: PageType) => void;
  platformRatingStats: PlatformRatingStats;
}) => {
  const displayRating = platformRatingStats?.averageRating ?? 4.5;
  const totalReviews = platformRatingStats?.totalReviews ?? 0;
  const reviewLabel =
    platformRatingStats === null
      ? '(4234+ review)'
      : totalReviews > 0
        ? `(${totalReviews}+ review)`
        : 'No reviews yet';
  const socialProofText =
    totalReviews > 0
      ? `Over ${Math.max(500, totalReviews)} people have trusted us and left positive reviews. Join them!`
      : 'Over 500 people have trusted us and left positive reviews. Join them!';

  return (
  <div className="pb-24">
    {/* Hero: same width as navbar (max-w-7xl, px-6) */}
    <div className="px-6 md:px-6 mt-2">
      <section className="relative max-w-7xl mx-auto rounded-2xl overflow-hidden min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/hero-cleaning-team.png)' }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div className="relative z-10 px-8 md:px-12 lg:px-16 py-16 md:py-24 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-5 md:space-y-6"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Custom home cleaning services in Cape Town
            </h1>
            <p className="text-lg md:text-xl text-white/95 max-w-xl leading-relaxed font-normal">
              Enjoy a spotless space with our trusted cleaning professionals. Eco-friendly, flexible, and always on time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('booking')}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-white font-semibold text-base px-8 py-3.5 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              >
                Book Now
              </button>
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="inline-flex items-center justify-center rounded-full border-2 border-white text-white font-semibold text-base px-8 py-3.5 hover:bg-white/10 transition-colors"
              >
                WhatsApp Us
              </button>
            </div>
            <p className="mt-3 text-sm text-white/90">
              Are you a worker?{' '}
              <button
                type="button"
                onClick={() => onNavigate('careers')}
                className="underline font-semibold hover:text-white"
              >
                Apply Here
              </button>
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-5 flex justify-end"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5 md:p-6 max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-white/80 border-2 border-white/30 flex items-center justify-center text-slate-600 text-xs font-semibold"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-white">{displayRating}</span>
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-white/90 text-sm">{reviewLabel}</span>
                </div>
              </div>
              <p className="text-white/95 text-sm leading-relaxed">
                {totalReviews === 0 ? 'No reviews yet. Be the first to leave one!' : socialProofText}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      </section>
    </div>

    {/* About Us: same width and spacing as navbar / hero (max-w-7xl, px-6, generous top margin below hero) */}
    <div className="px-6 md:px-6 mt-8 md:mt-12">
      <section className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-5 md:gap-8 items-stretch">
          {/* Left: text card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col justify-center min-h-[320px] lg:min-h-0"
          >
            <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-6">
              <Home className="w-4 h-4 text-slate-500" />
              About Us
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-5 leading-tight">
              Bringing Freshness, Comfort, and Care to Every Home
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-6">
              At Shalean, we go beyond surface cleaning – we bring life back to your space. Our dedicated team combines expert care, eco-friendly solutions, and attention to detail to ensure every home feels fresh.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Professional & Trusted Team',
                'Eco-Friendly Cleaning Products',
                'Satisfaction Guaranteed',
                'Flexible Scheduling',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 text-base">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="inline-flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base px-6 py-3.5 transition-colors w-fit"
            >
              Learn More
            </button>
          </motion.div>
          {/* Right: image card – same height as left; replace src with /about-team.png when you have a dedicated image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full min-h-[320px] lg:min-h-0 relative"
          >
            <img
              src="/hero-cleaning-team.png"
              alt="Shalean cleaning team – professional cleaners"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>
    </div>

    {/* Stats + Service cards below About */}
    <div className="px-6 md:px-6 mt-8 md:mt-10">
      <section className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Top row: three stat cards */}
        <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
          {[
            {
              value: '500+',
              title: 'Happy Clients',
              description: 'Trusted by hundreds of homeowners and offices, Shalean delivers spotless results that bring real satisfaction every time.',
            },
            {
              value: '1,200+',
              title: 'Completed Cleanings',
              description: "From cozy apartments to large offices, we've successfully completed over a thousand cleaning sessions with consistent quality.",
            },
            {
              value: '100%',
              title: 'Service Commitment',
              description: 'We take pride in our reliability, attention to detail, and 100% commitment to creating healthier, fresher spaces.',
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8"
            >
              <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{stat.value}</p>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{stat.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{stat.description}</p>
            </motion.div>
          ))}
        </div>
        {/* Bottom: single wide service intro card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10"
        >
          <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-lg px-3 py-1.5 w-fit mb-5">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            Service
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-4">
            Complete Home and Office Cleaning You Can Trust
          </h2>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-3xl">
            At Shalean, we provide a full range of cleaning solutions for every space — whether it&apos;s your cozy home or a busy office. Our goal is to deliver spotless results with care, reliability, and consistency.
          </p>
        </motion.div>

        {/* Three service cards: Home, Office, Deep — same spacing as hero/navbar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mt-6 md:mt-8">
          {[
            {
              title: 'Home Cleaning',
              description:
                'Keep your living space fresh and organized with regular or one-time cleaning tailored to your schedule.',
              img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
              alt: 'Home cleaning – cleaner in kitchen'
            },
            {
              title: 'Office Cleaning',
              description:
                'Maintain a clean, productive workspace that boosts focus and leaves a lasting impression on clients.',
              img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
              alt: 'Office cleaning – professional cleaner'
            },
            {
              title: 'Deep Cleaning',
              description:
                'Thorough intensive cleaning for every corner — from inside cupboards to grout and appliances.',
              img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
              alt: 'Deep cleaning – professional equipment'
            }
          ].map((card, idx) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -4 }}
              onClick={() => onNavigate('booking')}
              className="group relative rounded-2xl overflow-hidden shadow-md border border-slate-100 cursor-pointer min-h-[320px] md:min-h-[360px] flex flex-col justify-end"
            >
              <img
                src={card.img}
                alt={card.alt}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
                aria-hidden
              />
              <div className="relative z-10 p-6 md:p-8 flex flex-col items-start">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-white/90 text-sm md:text-base leading-relaxed mb-5 max-w-md">
                  {card.description}
                </p>
                <span className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 hover:bg-blue-700 transition-colors shadow-lg">
                  Book Now
                </span>
              </div>
            </motion.article>
          ))}
        </div>

        {/* How It Work – simple steps in one blue card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8 md:mt-10 rounded-2xl md:rounded-3xl bg-blue-600 shadow-xl p-6 md:p-8 lg:p-10"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div>
              <span className="inline-flex items-center gap-2 text-blue-200 bg-blue-500/40 rounded-full px-4 py-2 text-sm font-medium mb-4 shadow-sm">
                <ListOrdered className="w-4 h-4" />
                How It Works
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3">
                Simple Steps to a Cleaner Home
              </h2>
              <p className="text-white/90 text-base md:text-lg max-w-2xl">
                Our cleaning process is simple, quick, and reliable – from booking to enjoying your spotless home.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {[
              {
                num: '01',
                title: 'Book Your Service',
                description:
                  'Easily select your preferred date, time, and cleaning plan through our user-friendly online platform.',
              },
              {
                num: '02',
                title: 'Confirmation & Preparation',
                description:
                  'We confirm your booking and prepare all the tools and supplies needed.',
              },
              {
                num: '03',
                title: 'We Do the Cleaning',
                description:
                  'Our expert team arrives on time, making your space shine and creating a warm atmosphere.',
              },
              {
                num: '04',
                title: 'Relax & Enjoy',
                description:
                  'Sit back, unwind, and experience the comfort of a freshly cleaned home.',
              },
            ].map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10px' }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="flex gap-4"
              >
                <span className="text-4xl md:text-5xl font-bold text-white/30 tabular-nums shrink-0 leading-none">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-white/85 text-sm md:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonial — right below blue How It Works card */}
        <section className="relative mt-8 md:mt-10 overflow-hidden">
          <div className="absolute inset-0 bg-slate-100/80 rounded-2xl md:rounded-3xl" aria-hidden />
          <div className="absolute inset-0 opacity-[0.03] rounded-2xl md:rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)', backgroundSize: '24px 24px' }} aria-hidden />
          <div className="relative rounded-2xl md:rounded-3xl bg-white/60 border border-slate-200/80 shadow-sm p-8 md:p-12 lg:p-14">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-10">
              <div>
                <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium bg-slate-100 border border-slate-200 rounded-full px-4 py-2 w-fit mb-4">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  Testimonial
                </span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
                  Over 500 Positive Reviews
                </h2>
                <p className="text-slate-600 text-base md:text-lg max-w-xl">
                  Real stories from happy homeowners who trust Shalean to keep their spaces fresh, spotless, and worry-free.
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <div className="flex -space-x-2">
                    {[
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=80',
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&q=80',
                      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80'
                    ].map((src, i) => (
                      <div key={i} className="w-10 h-10 rounded-full ring-2 ring-white overflow-hidden bg-slate-200 flex-shrink-0">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-xl font-bold text-slate-900">{displayRating}</span>
                    <span className="text-slate-500 text-sm">{reviewLabel}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  quote: 'Nobody has ever cleaned my place with such attention to detail. The team was friendly, on time, and left my home sparkling!',
                  name: 'Fallah Maulana',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=80',
                  rating: 5.0
                },
                {
                  quote: "It's the first time my apartment has felt this fresh. Shalean really exceeded my expectations.",
                  name: 'Hanifa Maulina',
                  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
                  rating: 5.0
                },
                {
                  quote: 'They made my move-out cleaning effortless. Everything looked brand new again — totally worth it.',
                  name: 'Sarah Jenkins',
                  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80',
                  rating: 5.0
                }
              ].map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 md:p-7 flex flex-col h-full"
                >
                  <p className="text-slate-800 font-semibold text-base md:text-lg leading-relaxed mb-6 flex-grow">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                      <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{t.name}</p>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 text-amber-400 fill-amber-400" />
                        ))}
                        <span className="text-slate-700 font-semibold text-sm ml-0.5">{t.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Hero CTA: Let's Bring Freshness Back — below testimonial */}
        <section className="relative mt-8 md:mt-10 rounded-2xl md:rounded-3xl overflow-hidden min-h-[420px] md:min-h-[480px] flex flex-col justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80)'
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/70 from-0% via-black/40 via-45% to-transparent to-100%"
            aria-hidden
          />
          <div className="relative z-10 px-8 md:px-12 lg:px-16 py-14 md:py-20 max-w-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-4 md:mb-5">
              Let&apos;s Bring Freshness Back to Your Home
            </h2>
            <p className="text-base md:text-lg text-white/95 leading-relaxed mb-6 md:mb-8 max-w-xl">
              Book your trusted cleaning service today and enjoy the comfort of a spotless, stress-free space — because every home deserves to feel fresh.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('booking')}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white font-semibold text-base px-8 py-3.5 hover:bg-blue-700 transition-colors shadow-lg"
            >
              Book a Cleaning Now
            </button>
          </div>
        </section>
      </section>
    </div>

    <BlogPreviewSection onNavigate={onNavigate} />
    <LocalSEOSection onNavigate={onNavigate} />

    <section className="px-6 md:px-6 mt-8 md:mt-10">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4 }}
            className="mb-8 md:mb-10"
          >
            <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-4">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-2">
              Common Questions
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-xl">
              Quick answers to what our clients ask most.
            </p>
          </motion.div>
          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <motion.details
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className="group border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300"
              >
                <summary className="flex items-center gap-4 p-5 sm:p-6 cursor-pointer list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl bg-white">
                  <span className="flex-1 text-left font-semibold text-slate-800 text-base sm:text-lg pr-2 group-hover:text-slate-900">
                    {faq.q}
                  </span>
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-open:bg-blue-100 group-open:text-blue-600 transition-colors duration-200">
                    <Plus className="w-5 h-5 group-open:rotate-45 transition-transform duration-200" />
                  </span>
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <div className="pl-0 border-l-2 border-blue-200 bg-slate-50/70 rounded-r-xl py-4 px-5 text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              </motion.details>
            ))}
          </div>
        </div>
      </div>
    </section>
  </div>
  );
};

export const ShaleanWebsite: React.FC<{ initialPage?: PageType }> = ({ initialPage }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? '';
  const [currentPage, setCurrentPage] = useState<PageType>(initialPage ?? 'home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | CleanerProfile | AdminProfile | null>(null);
  const [customerBookings, setCustomerBookings] = useState<Awaited<ReturnType<typeof getMyBookings>>>([]);
  const [cleanerTodayBookings, setCleanerTodayBookings] = useState<Awaited<ReturnType<typeof getMyCleanerJobs>>>([]);
  const [adminStats, setAdminStats] = useState<Awaited<ReturnType<typeof getAdminStatsForSession>> | null>(null);
  const [adminBookings, setAdminBookings] = useState<AdminBookingRow[]>([]);
  const [adminBookingFilters, setAdminBookingFilters] = useState<AdminBookingFilters>({});
  const [adminCleaners, setAdminCleaners] = useState<Awaited<ReturnType<typeof getCleanersForAdmin>>>([]);
  const [platformRatingStats, setPlatformRatingStats] = useState<PlatformRatingStats>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [customerTab, setCustomerTab] = useState<CustomerDashboardTab>('overview');
  const [cleanerTab, setCleanerTab] = useState<CleanerDashboardTab>('schedule');
  const [adminTab, setAdminTab] = useState<AdminDashboardTab>('overview');

  // Sync URL pathname to currentPage so back/forward and direct links work.
  useEffect(() => {
    if (pathname === '/dashboard/customer') {
      setCurrentPage('customer');
      const mode = new URLSearchParams(searchParamsString).get('mode');
      if (mode === 'signup') setAuthModalMode('signup');
      else setAuthModalMode('login');
    } else if (pathname === '/dashboard/cleaner') setCurrentPage('cleaner');
    else if (pathname === '/dashboard/admin') setCurrentPage('admin');
    else if (pathname === '/quote') setCurrentPage('quote');
    else if (pathname === '/services') setCurrentPage('services');
    else if (pathname === '/pricing') setCurrentPage('pricing');
    else if (pathname === '/locations') setCurrentPage('locations');
    else if (pathname === '/about') setCurrentPage('about');
    else if (pathname === '/careers') setCurrentPage('careers');
    else if (pathname === '/contact') setCurrentPage('contact');
    else if (pathname === '/blog') setCurrentPage('blog');
    else if (pathname === '/') setCurrentPage('home');
  }, [pathname, searchParamsString]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    getPlatformRatingStats().then(setPlatformRatingStats);
  }, []);

  const supabase = useMemo(() => createClient(), []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        getProfileForSession().then((profile) => {
          if (profile) setCurrentUser(profile);
        });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
        return;
      }
      getProfileForSession().then((profile) => {
        if (profile) setCurrentUser(profile);
      });
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!currentUser) {
      setCustomerBookings([]);
      setCleanerTodayBookings([]);
      setAdminStats(null);
      setAdminBookings([]);
      return;
    }
    if (currentUser.role === 'customer') {
      getMyBookings().then(setCustomerBookings);
    } else if (currentUser.role === 'cleaner') {
      const today = new Date().toISOString().slice(0, 10);
      getMyCleanerJobs({ date: today }).then(setCleanerTodayBookings);
    } else if (currentUser.role === 'admin') {
      Promise.all([
        getAdminStatsForSession(),
        getAdminBookingsForSession({ limit: 50 }),
        getCleanersForAdmin(),
      ]).then(([stats, list, cleaners]) => {
        setAdminStats(stats ?? null);
        setAdminBookings(list ?? []);
        setAdminCleaners(cleaners ?? []);
      });
    }
  }, [currentUser]);

  // Refetch customer bookings when they open the customer dashboard so the list is up to date (e.g. after a new booking).
  useEffect(() => {
    if (currentPage === 'customer' && currentUser?.role === 'customer') {
      getMyBookings().then(setCustomerBookings);
    }
  }, [currentPage, currentUser?.role]);

  // Refetch cleaner jobs when they open the cleaner dashboard so the list is up to date (e.g. after admin assigns).
  useEffect(() => {
    if (currentPage === 'cleaner' && currentUser?.role === 'cleaner') {
      const today = new Date().toISOString().slice(0, 10);
      getMyCleanerJobs({ date: today }).then(setCleanerTodayBookings);
    }
  }, [currentPage, currentUser?.role]);

  // Refetch customer/cleaner data when tab regains focus so they see admin assignment updates from another tab.
  useEffect(() => {
    const onFocus = () => {
      if (currentPage === 'customer' && currentUser?.role === 'customer') {
        getMyBookings().then(setCustomerBookings);
      }
      if (currentPage === 'cleaner' && currentUser?.role === 'cleaner') {
        const today = new Date().toISOString().slice(0, 10);
        getMyCleanerJobs({ date: today }).then(setCleanerTodayBookings);
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [currentPage, currentUser?.role]);

  // Realtime: refetch customer bookings when a booking is updated (e.g. admin assigns a cleaner).
  useEffect(() => {
    if (currentPage !== 'customer' || currentUser?.role !== 'customer' || !currentUser?.email) {
      return;
    }
    const email = String(currentUser.email).trim();
    if (!email) return;
    const escaped = email.replace(/"/g, '\\"');
    const channel = supabase
      .channel('customer-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_email=eq."${escaped}"`,
        },
        () => {
          getMyBookings().then(setCustomerBookings);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentPage, currentUser?.role, currentUser?.email]);

  // Periodic refetch so status updates in real time as slot times pass (e.g. Upcoming → Completed).
  useEffect(() => {
    if (currentPage === 'customer' && currentUser?.role === 'customer') {
      const id = setInterval(() => getMyBookings().then(setCustomerBookings), 60_000);
      return () => clearInterval(id);
    }
    if (currentPage === 'admin' && currentUser?.role === 'admin' && adminTab === 'all-bookings') {
      const id = setInterval(
        () =>
          getAdminBookingsForSession({ limit: 50, ...adminBookingFilters }).then((list) =>
            setAdminBookings(list ?? [])
          ),
        60_000
      );
      return () => clearInterval(id);
    }
  }, [currentPage, currentUser?.role, adminTab, adminBookingFilters]);

  const navigate = (page: PageType) => {
    if (page === 'booking') {
      router.push('/booking/standard-cleaning');
      setMobileMenuOpen(false);
      return;
    }
    if (page === 'quote') {
      router.push('/quote');
      setMobileMenuOpen(false);
      return;
    }
    if (page === 'blog') {
      router.push('/blog');
      setMobileMenuOpen(false);
      return;
    }
    if (page === 'customer' || page === 'cleaner' || page === 'admin') {
      router.push('/dashboard/' + page);
      setMobileMenuOpen(false);
      return;
    }
    if (page === 'home') {
      router.push('/');
      setMobileMenuOpen(false);
      return;
    }
    if (page === 'services') {
      router.push('/services');
      setMobileMenuOpen(false);
      return;
    }
    if (page === 'pricing') {
      router.push('/pricing');
      setMobileMenuOpen(false);
      return;
    }
    if (page === 'locations') {
      router.push('/locations');
      setMobileMenuOpen(false);
      return;
    }
    if (page === 'about') {
      router.push('/about');
      setMobileMenuOpen(false);
      return;
    }
    if (page === 'careers') {
      router.push('/careers');
      setMobileMenuOpen(false);
      return;
    }
    if (page === 'contact') {
      router.push('/contact');
      setMobileMenuOpen(false);
      return;
    }
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks: { label: string; id: PageType }[] = [
    { label: 'Home', id: 'home' },
    { label: 'About', id: 'about' },
    { label: 'Services', id: 'services' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'Locations', id: 'locations' },
    { label: 'Blog', id: 'blog' },
    { label: 'Contact', id: 'contact' },
  ];

  const allNavLinks: { label: string; id: PageType }[] = [
    ...navLinks,
    { label: 'Portal', id: 'customer' },
  ];

  const isDashboardPage = ['customer', 'cleaner', 'admin'].includes(currentPage);
  const customerNavTabs: { id: CustomerDashboardTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'rewards', label: 'Rewards' },
    { id: 'profile', label: 'Profile' },
  ];
  const cleanerNavTabs: { id: CleanerDashboardTab; label: string }[] = [
    { id: 'schedule', label: 'Jobs' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'profile', label: 'Ratings' },
    { id: 'settings', label: 'Account' },
  ];
  const adminNavTabs: { id: AdminDashboardTab; label: string }[] = [
    { id: 'overview', label: 'Admin' },
    { id: 'all-bookings', label: 'Bookings' },
    { id: 'quote-requests', label: 'Quotes' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'blog', label: 'Blog' },
    { id: 'crew', label: 'Crew' },
    { id: 'finance', label: 'Finance' },
    { id: 'settings', label: 'Settings' },
  ];

  const renderDashboardNav = () => {
    const tabs = currentPage === 'customer' ? customerNavTabs : currentPage === 'cleaner' ? cleanerNavTabs : adminNavTabs;
    const activeTab = currentPage === 'customer' ? customerTab : currentPage === 'cleaner' ? cleanerTab : adminTab;
    const setTab = currentPage === 'customer' ? setCustomerTab : currentPage === 'cleaner' ? setCleanerTab : setAdminTab;
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 pt-4 px-6 md:pt-6">
        <div
          className={`max-w-7xl mx-auto rounded-2xl bg-black flex items-center justify-between gap-4 px-6 py-3 md:px-8 md:py-4 transition-shadow duration-300 ${
            isScrolled ? 'shadow-lg shadow-black/20' : 'shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
          }`}
        >
          <button
            type="button"
            className="flex items-center gap-2 text-white font-bold text-lg md:text-xl tracking-tight uppercase shrink-0 cursor-pointer"
            onClick={() => navigate('home')}
          >
            <img src="/shalean-logo.png" alt="" className="h-7 w-7 md:h-8 md:w-8 rounded-lg object-contain" />
            SHALEAN
          </button>
          <div className="hidden md:flex items-center justify-center flex-1 gap-4 lg:gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id as never)}
                className={`text-sm font-normal text-white transition-colors hover:opacity-90 ${
                  activeTab === tab.id ? 'opacity-100' : 'opacity-80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {currentPage === 'customer' && (
              <button
                type="button"
                onClick={() => navigate('booking')}
                className="hidden md:inline-flex items-center justify-center rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-white text-sm font-medium px-5 py-2.5 hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
              >
                New Booking
              </button>
            )}
            {currentUser && (
              <div className="relative hidden md:block" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((o) => !o)}
                  className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/20 shadow-md hover:ring-white/40 transition-all flex-shrink-0 bg-white/10 flex items-center justify-center"
                >
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </button>
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-[60]"
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-black text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-xs font-bold text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { navigate('home'); setProfileDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Home className="w-4 h-4 text-slate-400" />
                        Home
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentUser(null);
                          setProfileDropdownOpen(false);
                          setCurrentPage('home');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button
              type="button"
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>
    );
  };

  const renderHomeNav = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 pt-4 px-6 md:pt-6">
      <div
        className={`max-w-7xl mx-auto rounded-2xl bg-black flex items-center justify-between gap-4 px-6 py-3 md:px-8 md:py-4 transition-shadow duration-300 ${
          isScrolled ? 'shadow-lg shadow-black/20' : 'shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
        }`}
      >
        <button
          type="button"
          className="flex items-center gap-2 text-white font-bold text-lg md:text-xl tracking-tight uppercase shrink-0 cursor-pointer"
          onClick={() => navigate('home')}
        >
          <img src="/shalean-logo.png" alt="" className="h-7 w-7 md:h-8 md:w-8 rounded-lg object-contain" />
          SHALEAN
        </button>
        <div className="hidden md:flex items-center justify-center flex-1 gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <button
              key={`${link.id}-${link.label}`}
              type="button"
              onClick={() => navigate(link.id)}
              className={`text-sm font-normal text-white transition-colors hover:opacity-90 ${
                currentPage === link.id ? 'opacity-100' : 'opacity-80'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('quote')}
            className="hidden md:inline-flex items-center justify-center rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-white text-sm font-medium px-5 py-2.5 hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
          >
            Get Quote
          </button>
          {currentUser ? (
            <div className="relative hidden md:block" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((o) => !o)}
                className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/20 shadow-md hover:ring-white/40 transition-all flex-shrink-0 bg-white/10 flex items-center justify-center"
              >
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </button>
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-[60]"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-black text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-xs font-bold text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { navigate(currentUser.role); setProfileDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => { navigate(currentUser.role); setProfileDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        supabase.auth.signOut();
                        setCurrentUser(null);
                        setProfileDropdownOpen(false);
                        setCurrentPage('home');
                        navigate('home');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => router.push('/dashboard/customer')}
                className="hidden md:inline-flex items-center justify-center rounded-full border border-white/40 text-white text-sm font-medium px-5 py-2.5 hover:bg-white/10 transition-all"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/customer?mode=signup')}
                className="hidden md:inline-flex items-center justify-center rounded-full bg-white text-slate-900 text-sm font-medium px-5 py-2.5 hover:bg-slate-100 transition-all"
              >
                Sign up
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => navigate('booking')}
            className="md:hidden rounded-full bg-[#4285F4] text-white text-sm font-medium px-4 py-2"
          >
            Book
          </button>
          <button
            type="button"
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-[#e5e7eb]">
      {isDashboardPage ? renderDashboardNav() : renderHomeNav()}

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-white p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="flex items-center gap-2 text-2xl font-black text-blue-600">
                <img src="/shalean-logo.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
                SHALEAN
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 bg-slate-100 rounded-full"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              {isDashboardPage ? (
                <>
                  {currentPage === 'customer' && customerNavTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { setCustomerTab(tab.id); setMobileMenuOpen(false); }}
                      className="text-2xl font-bold text-slate-800 text-left"
                    >
                      {tab.label}
                    </button>
                  ))}
                  {currentPage === 'cleaner' && cleanerNavTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { setCleanerTab(tab.id); setMobileMenuOpen(false); }}
                      className="text-2xl font-bold text-slate-800 text-left"
                    >
                      {tab.label}
                    </button>
                  ))}
                  {currentPage === 'admin' && adminNavTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { setAdminTab(tab.id); setMobileMenuOpen(false); }}
                      className="text-2xl font-bold text-slate-800 text-left"
                    >
                      {tab.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { navigate('home'); setMobileMenuOpen(false); }}
                    className="text-2xl font-bold text-slate-800 text-left"
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentUser(null);
                      setCurrentPage('home');
                      setMobileMenuOpen(false);
                    }}
                    className="text-xl font-bold text-red-500 text-left flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Log out
                  </button>
                  {currentPage === 'customer' && (
                    <Button onClick={() => { navigate('booking'); setMobileMenuOpen(false); }} className="w-full text-lg mt-4 py-4">
                      New Booking
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {allNavLinks.map((link) => (
                    <button
                      key={`${link.id}-${link.label}`}
                      type="button"
                      onClick={() => navigate(link.id === 'customer' && currentUser ? currentUser.role : link.id)}
                      className="text-2xl font-bold text-slate-800 text-left"
                    >
                      {link.label}
                    </button>
                  ))}
                  {currentUser ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { navigate(currentUser.role); setMobileMenuOpen(false); }}
                        className="text-2xl font-bold text-slate-800 text-left flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-6 h-6 text-blue-600" />
                        Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentUser(null);
                          setCurrentPage('home');
                          setMobileMenuOpen(false);
                        }}
                        className="text-xl font-bold text-red-500 text-left flex items-center gap-2"
                      >
                        <LogOut className="w-5 h-5" />
                        Log out
                      </button>
                    </>
                  ) : null}
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => navigate('booking')} className="flex-1 text-lg py-4">
                      Book a Clean
                    </Button>
                    <Button variant="outline" onClick={() => { navigate('quote'); setMobileMenuOpen(false); }} className="flex-1 text-lg py-4">
                      Get Quote
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-24">
        {currentPage === 'home' && <HomePage onNavigate={navigate} platformRatingStats={platformRatingStats} />}
        {currentPage === 'services' && <ServicesPage onNavigate={(page: string) => navigate(page as PageType)} />}
{currentPage === 'pricing' && <PricingPage onNavigate={(page: string) => navigate(page as PageType)} />}
         {currentPage === 'locations' && <LocationsPage onNavigate={(page: string) => navigate(page as PageType)} />}
        {currentPage === 'about' && <AboutPage onNavigate={(page: string) => navigate(page as PageType)} />}
        {currentPage === 'careers' && <CareersPage onNavigate={(page: string) => navigate(page as PageType)} />}
        {currentPage === 'contact' && <ContactPage onNavigate={(page: string) => navigate(page as PageType)} />}
        {currentPage === 'quote' && (
          <div className="min-h-[60vh] px-6 py-24 bg-slate-50">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Get a cleaning quote in Cape Town
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                Tell us what you need and we&apos;ll send you a custom quote by email or phone.
              </p>
              <QuoteRequestForm onNavigate={(page: string) => navigate(page as PageType)} />
            </div>
          </div>
        )}
        {currentPage === 'admin' && (
          currentUser?.role === 'admin' ? (
            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-20">
            <AdminDashboard
              admin={{
                ...(currentUser as AdminProfile),
                stats: adminStats ?? (currentUser as AdminProfile).stats,
              }}
              adminBookings={adminBookings}
              adminCleaners={adminCleaners}
              bookingFilters={adminBookingFilters}
              onRefreshCleaners={() => getCleanersForAdmin().then(setAdminCleaners)}
              onRefreshBookings={() =>
                getAdminBookingsForSession({ limit: 50, ...adminBookingFilters }).then((list) =>
                  setAdminBookings(list ?? [])
                )
              }
              onBookingFiltersChange={(filters) => {
                setAdminBookingFilters(filters);
                getAdminBookingsForSession({ limit: 50, ...filters }).then((list) =>
                  setAdminBookings(list ?? [])
                );
              }}
              onLogout={() => { supabase.auth.signOut(); setCurrentUser(null); navigate('home'); }}
              activeTab={adminTab}
              onTabChange={setAdminTab}
            />
            </div>
          ) : (
            <AuthModal
              isOpen
              onClose={() => navigate('home')}
              mode={authModalMode}
              onAuthSuccess={(user) => {
                setCurrentUser(user);
                router.push('/dashboard/' + user.role);
              }}
            />
          )
        )}
        {currentPage === 'customer' && (
          currentUser?.role === 'customer' ? (
            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-20">
            <CustomerDashboard
              user={{ ...currentUser, bookings: customerBookings }}
              onLogout={() => { supabase.auth.signOut(); setCurrentUser(null); navigate('home'); }}
              onNewBooking={() => navigate('booking')}
              onRefreshUser={async () => {
                const profile = await getProfileForSession();
                if (profile) setCurrentUser(profile);
              }}
              onRefreshBookings={() => getMyBookings().then(setCustomerBookings)}
              activeTab={customerTab}
              onTabChange={setCustomerTab}
            />
            </div>
          ) : (
            <AuthModal
              isOpen
              onClose={() => navigate('home')}
              mode={authModalMode}
              onAuthSuccess={(user) => {
                setCurrentUser(user);
                router.push('/dashboard/' + user.role);
              }}
            />
          )
        )}
        {currentPage === 'cleaner' && (
          currentUser?.role === 'cleaner' ? (
            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-20">
            <CleanerDashboard
              cleaner={{
                ...(currentUser as CleanerProfile),
                todayBookings: cleanerTodayBookings,
              }}
              onLogout={() => { supabase.auth.signOut(); setCurrentUser(null); navigate('home'); }}
              activeTab={cleanerTab}
              onTabChange={setCleanerTab}
              onRefreshCleaner={async () => {
                const profile = await getProfileForSession();
                if (profile) setCurrentUser(profile);
                if (profile?.role === 'cleaner') {
                  const today = new Date().toISOString().slice(0, 10);
                  getMyCleanerJobs({ date: today }).then(setCleanerTodayBookings);
                }
              }}
            />
            </div>
          ) : (
            <AuthModal
              isOpen
              onClose={() => navigate('home')}
              mode={authModalMode}
              onAuthSuccess={(user) => {
                setCurrentUser(user);
                router.push('/dashboard/' + user.role);
              }}
            />
          )
        )}
        {currentPage === 'blog' && <BlogPage onNavigate={(page: string) => navigate(page as PageType)} />}
      </main>

      {!['admin', 'customer', 'cleaner'].includes(currentPage) && (
        <footer className="px-6 md:px-6 mt-0 md:mt-0 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.12)] p-6 md:p-8 lg:p-10">
              {/* Top section: brand + tagline + social | nav columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-10">
                {/* Left: brand, tagline, social */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <img src="/shalean-logo.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
                    <span className="text-xl font-bold text-white tracking-tight">
                      Shalean
                    </span>
                  </div>
                  <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-md">
                    Premium cleaning services for homeowners and businesses in Cape Town. Quality you can trust, prices you can afford.
                  </p>
                  <div className="flex gap-3">
                    <a
                      href="#"
                      aria-label="Website"
                      className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                    <a
                      href="#"
                      aria-label="X (Twitter)"
                      className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a
                      href="#"
                      aria-label="Instagram"
                      className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  </div>
                </div>
                {/* Right: three nav columns */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-10">
                  <div>
                    <h4 className="font-bold text-white mb-5">Navigation</h4>
                    <ul className="space-y-3 text-white/80 text-sm">
                      {[
                        { label: 'Home', page: 'home' as PageType },
                        { label: 'About', page: 'about' as PageType },
                        { label: 'Service', page: 'services' as PageType },
                        { label: 'How it works', page: 'home' as PageType },
                        { label: 'Pricing', page: 'pricing' as PageType },
                        { label: 'FAQ', page: 'contact' as PageType }
                      ].map((link) => (
                        <li key={link.label}>
                          <button
                            type="button"
                            onClick={() => navigate(link.page)}
                            className="text-left hover:text-white transition-colors"
                          >
                            {link.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-5">What we do</h4>
                    <ul className="space-y-3 text-white/80 text-sm">
                      {[
                        'Standard Cleaning',
                        'Deep Cleaning',
                        'Move In/Out',
                        'Airbnb Cleaning',
                        'Carpet Cleaning'
                      ].map((item) => (
                        <li key={item}>
                          <button
                            type="button"
                            onClick={() => navigate('services')}
                            className="text-left hover:text-white transition-colors"
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-5">Support</h4>
                    <ul className="space-y-3 text-white/80 text-sm">
                      {[
                        { label: 'FAQ', page: 'contact' as PageType },
                        { label: 'Contact', page: 'contact' as PageType },
                        { label: 'Careers', page: 'careers' as PageType },
                        { label: 'Privacy Policy', page: 'home' as PageType },
                        { label: 'Feedback', page: 'contact' as PageType },
                        { label: 'Blog', page: 'blog' as PageType }
                      ].map((link) => (
                        <li key={link.label}>
                          <button
                            type="button"
                            onClick={() => navigate(link.page)}
                            className="text-left hover:text-white transition-colors"
                          >
                            {link.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              {/* Bottom: copyright + legal */}
              <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/60">
                <p>©2025 Shalean. All rights reserved</p>
                <div className="flex gap-6">
                  <button
                    type="button"
                    onClick={() => navigate('home')}
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('home')}
                    className="hover:text-white transition-colors"
                  >
                    Term of Use
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}

      {!['admin', 'customer', 'cleaner'].includes(currentPage) && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          <motion.a
            href="tel:+27871535250"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 pl-5 pr-5 py-3.5 bg-emerald-500 text-white rounded-full shadow-xl shadow-emerald-500/30 font-semibold text-sm hover:bg-emerald-600 transition-colors border border-emerald-400/20"
          >
            <Phone className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Call now</span>
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="hidden md:flex w-14 h-14 bg-slate-800 text-white rounded-full shadow-xl border border-white/10 items-center justify-center hover:bg-slate-700 transition-colors"
            onClick={() => navigate('booking')}
          >
            <Calendar className="w-6 h-6" />
          </motion.button>
        </div>
      )}

      {currentPage !== 'booking' &&
        !['admin', 'customer', 'cleaner'].includes(currentPage) && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-40 flex gap-4">
            <Button
              onClick={() => navigate('booking')}
              className="flex-1 py-4 text-lg shadow-lg"
            >
              Book Now
            </Button>
            <a
              href="https://wa.me/27825915525"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
            >
              <MessageSquare className="w-6 h-6" />
            </a>
          </div>
        )}
    </div>
  );
};

export default ShaleanWebsite;

