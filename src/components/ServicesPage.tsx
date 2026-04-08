/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Award,
  Repeat,
  Zap,
  ThumbsUp,
  Sparkles,
  Layers,
  Home,
  Calendar,
  Wind,
  ArrowRight,
  Star,
  MapPin,
  HelpCircle,
  Plus,
} from "lucide-react";

type PageType =
  | "home"
  | "services"
  | "booking"
  | "locations"
  | "about"
  | "blog"
  | "contact"
  | "careers"
  | "pricing"
  | "admin"
  | "customer"
  | "cleaner";

interface ServicesPageProps {
  onNavigate: (page: PageType) => void;
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
  const base =
    "px-6 py-3 rounded-full font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
    secondary: "bg-teal-500 text-white hover:bg-teal-600",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
    ghost: "text-slate-600 hover:text-blue-600 hover:bg-slate-100",
  } as const;

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
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

const SERVICES_DETAIL = [
  {
    id: "standard",
    title: "Standard Cleaning",
    slug: "/services/standard-cleaning",
    description:
      "Perfect for regular home upkeep. Our standard clean covers all living areas, bedrooms, kitchen surfaces, and bathrooms. Ideal for weekly or bi-weekly scheduling.",
    price: 450,
    icon: <Sparkles className="w-7 h-7" />,
    features: [
      "Kitchen surface wipe-down",
      "Bathroom sanitizing",
      "Dusting all surfaces",
      "Vacuuming & mopping",
      "Bin emptying",
      "General tidying",
    ],
    badge: "Most Popular",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "deep",
    title: "Deep Cleaning",
    slug: "/services/deep-cleaning",
    description:
      "A top-to-bottom intensive clean for homes that need extra attention. Includes skirting boards, inside appliances, grout scrubbing, and detailed room cleaning.",
    price: 850,
    icon: <Layers className="w-7 h-7" />,
    features: [
      "Detailed scrubbing of all surfaces",
      "Inside cupboards & cabinets",
      "Skirting boards & door frames",
      "Interior windows",
      "Behind appliances",
      "Grout & tile scrubbing",
    ],
    badge: null,
    badgeColor: "",
  },
  {
    id: "move",
    title: "Move In / Out Cleaning",
    slug: "/services/move-in-out-cleaning",
    description:
      "Leaving a rental or moving into a new home? Our thorough property reset ensures every surface, cupboard, and corner is spotless for the next chapter.",
    price: 1200,
    icon: <Home className="w-7 h-7" />,
    features: [
      "Full property reset clean",
      "Appliances inside & out",
      "Wall spot cleaning",
      "Deep bathroom sanitize",
      "All cupboards & drawers",
      "Carpet & floor prep",
    ],
    badge: null,
    badgeColor: "",
  },
  {
    id: "airbnb",
    title: "Airbnb Cleaning",
    slug: "/services/airbnb-cleaning",
    description:
      "Fast, reliable turnaround cleaning for Airbnb and short-term rental hosts in Cape Town. We work around your guest schedule to maintain 5-star standards every time.",
    price: 650,
    icon: <Calendar className="w-7 h-7" />,
    features: [
      "Fresh linen change",
      "Guest amenity restocking",
      "Quick turnaround scheduling",
      "Photo-ready presentation",
      "Full bathroom sanitize",
      "Host communication support",
    ],
    badge: "Host Favourite",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    id: "carpet",
    title: "Carpet Cleaning",
    slug: "/services/carpet-cleaning",
    description:
      "Professional stain removal and deep carpet cleaning using industry-grade equipment. Restore the look and freshness of your carpets across Cape Town homes.",
    price: 350,
    icon: <Wind className="w-7 h-7" />,
    features: [
      "Deep extraction cleaning",
      "Stain removal treatment",
      "Odour neutralizing",
      "Quick-dry technique",
      "Per room pricing",
      "Pre-treatment inspection",
    ],
    badge: null,
    badgeColor: "",
  },
];

const WHY_CHOOSE = [
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Fully Insured & Vetted",
    desc: "Every cleaner passes rigorous background checks and is fully insured for your peace of mind.",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Trained Professionals",
    desc: "Our team undergoes ongoing training to deliver consistently premium results in every home.",
  },
  {
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: "Transparent Pricing",
    desc: "No hidden costs. You see your exact price upfront before confirming any booking.",
  },
  {
    icon: <Repeat className="w-6 h-6" />,
    title: "Flexible Scheduling",
    desc: "Book 7 days a week, including weekends and public holidays, at a time that suits your life.",
  },
  {
    icon: <ThumbsUp className="w-6 h-6" />,
    title: "Satisfaction Guarantee",
    desc: "If anything is missed, we return and fix it free of charge. That's our promise.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Same-Week Availability",
    desc: "Need a clean urgently? We offer same-week and even same-day slots across Cape Town.",
  },
];

const SERVICE_FAQS = [
  {
    q: "How do I choose the right service?",
    a: "If your home needs regular upkeep, Standard Cleaning is ideal. For a first clean, after a renovation, or if your home hasn't been professionally cleaned in a while, go with Deep Cleaning. Moving? Choose Move In/Out.",
  },
  {
    q: "Can I book recurring services?",
    a: "Absolutely. We offer weekly, bi-weekly, and monthly recurring bookings at discounted rates. Set it up once and we handle the rest.",
  },
  {
    q: "What areas in Cape Town do you serve?",
    a: "We serve Sea Point, Claremont, Gardens, Constantia, Durbanville, Century City, Table View, Observatory, and many more. Book online and enter your suburb to confirm availability.",
  },
  {
    q: "Do I need to be home during the clean?",
    a: "No. Many clients provide access instructions. You can monitor progress remotely and we'll let you know when the job is complete.",
  },
  {
    q: "What's the difference between Standard and Deep Cleaning?",
    a: "Standard Cleaning maintains a clean home through regular visits. Deep Cleaning is more intensive — covering hidden areas, inside appliances, grout, skirting boards, and areas not usually touched in a regular clean.",
  },
];

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-slate-100">
      {/* Hero */}
      <section className="mt-0">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="relative rounded-3xl shadow-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-800 text-white"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id="services-grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#services-grid)" />
              </svg>
            </div>
            <div className="relative z-10 max-w-4xl mx-auto text-center px-6 md:px-10 py-16 md:py-20">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs md:text-sm font-medium mb-6">
                <Star className="w-4 h-4 fill-white" />
                <span>Rated 4.9/5 by 2,000+ Cape Town customers</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 md:mb-6 leading-tight">
                Cleaning Services in Cape Town
              </h1>
              <p className="text-sm md:text-lg lg:text-xl text-blue-100 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
                From weekly standard cleans to intensive deep cleaning services, Shalean
                delivers professional, vetted, and fully insured cleaning across all major
                Cape Town suburbs.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                <Button
                  onClick={() => onNavigate("booking")}
                  variant="outline"
                  className="bg-white border-transparent text-blue-600 hover:bg-blue-50 text-base md:text-lg px-8 md:px-10"
                >
                  Book a Service <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
                <Button
                  onClick={() => onNavigate("pricing")}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-base md:text-lg px-8 md:px-10"
                >
                  View Pricing
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <SectionHeading
            centered
            subtitle="Professional cleaning solutions for every home and lifestyle in Cape Town. Click any service to learn more."
          >
            Our Cleaning Services
          </SectionHeading>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES_DETAIL.map((service, idx) => (
              <motion.div
                key={service.id}
                id={service.id}
                className="scroll-mt-28"
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  delay: idx * 0.08,
                }}
                onClick={() => onNavigate("booking")}
                style={{
                  cursor: "pointer",
                }}
              >
                <Card className="h-full flex flex-col hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {service.icon}
                    </div>
                    {service.badge && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${service.badgeColor}`}
                      >
                        {service.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-grow">
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-5">
                    {service.features.slice(0, 4).map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">
                        Starting from
                      </p>
                      <p className="text-xl font-black text-blue-600">
                        R{service.price}
                      </p>
                    </div>
                    <Button
                      onClick={() => onNavigate("booking")}
                      variant="outline"
                      className="text-sm py-2 px-4"
                    >
                      Book Now <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Our Services */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <SectionHeading centered subtitle="We go beyond the clean — delivering trust, reliability, and results you can count on.">
            Why Choose Our Services?
          </SectionHeading>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{
                  y: -4,
                }}
              >
                <Card className="h-full hover:border-blue-200 group transition-all">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas Strip */}
      <section className="py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="rounded-3xl bg-blue-600 text-white px-6 py-10 md:px-10 md:py-12 text-center shadow-xl border border-blue-500/60">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-blue-100 mb-4">
              Serving All Major Cape Town Suburbs
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 md:gap-3">
              {[
                "Sea Point",
                "Claremont",
                "Gardens",
                "Constantia",
                "Durbanville",
                "Century City",
                "Table View",
                "Observatory",
              ].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => onNavigate("locations")}
                  className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-1.5 rounded-full border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" /> {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 px-6 py-10 md:px-10 md:py-12 max-w-3xl mx-auto">
            <SectionHeading centered>Frequently Asked Questions</SectionHeading>
            <div className="space-y-4">
              {SERVICE_FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-bold text-slate-800 pr-4">{faq.q}</span>
                    <Plus
                      className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                        openFaq === idx ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100"
                    >
                      <div className="pt-4">{faq.a}</div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-600 rounded-3xl p-10 md:p-12 lg:p-14 text-center text-white relative overflow-hidden shadow-xl border border-blue-500/60">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern
                      id="grid-s"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-s)" />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 relative z-10">
                Book Professional Cleaning Today
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto relative z-10">
                Join thousands of satisfied Cape Town homeowners who trust Shalean for a
                spotless, reliable clean every time.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                <Button
                  onClick={() => onNavigate("booking")}
                  variant="outline"
                  className="bg-white border-transparent text-blue-600 hover:bg-blue-50 text-lg px-10"
                >
                  Book a Clean Now <ChevronRight className="w-5 h-5" />
                </Button>
                <Button
                  onClick={() => onNavigate("contact")}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg px-10"
                >
                  Get a Quote
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;

