/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Star,
  ShieldCheck,
  CheckCircle2,
  Award,
  Heart,
  Users,
  ThumbsUp,
  MapPin,
  Sparkles,
  Target,
  Eye,
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

interface AboutPageProps {
  onNavigate: (page: PageType) => void;
}

const Button = ({
  children,
  variant = "primary",
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  onClick?: () => void;
}) => {
  const base =
    "px-6 py-3 rounded-full font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
    ghost: "text-slate-600 hover:text-blue-600 hover:bg-slate-100",
  } as const;

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const TEAM_MEMBERS = [
  {
    name: "Ashleigh van Wyk",
    role: "Founder & CEO",
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    bio: "Ashleigh founded Shalean after recognizing a gap in Cape Town's cleaning market for a service that combined professionalism, reliability, and fair pricing.",
  },
  {
    name: "Nomsa Dlamini",
    role: "Head of Operations",
    photo:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80",
    bio: "Nomsa oversees our team scheduling, quality control, and cleaner training programme — ensuring every Shalean clean meets our premium standard.",
  },
  {
    name: "Bradley Adams",
    role: "Customer Experience Manager",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    bio: "Bradley leads our customer support and satisfaction processes, making sure every client interaction reflects the Shalean commitment to excellence.",
  },
  {
    name: "Fatima Hartley",
    role: "Senior Cleaning Specialist",
    photo:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    bio: "Fatima is one of our most experienced cleaners with 5+ years at Shalean, specializing in deep cleaning and move-in/out projects across Cape Town.",
  },
];

const VALUES = [
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Trust & Safety",
    desc: "Every cleaner is rigorously vetted and fully insured. We take your safety seriously — every time.",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Professional Excellence",
    desc: "We invest in continuous training and quality checks to ensure our team delivers outstanding results consistently.",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Genuine Care",
    desc: "We treat every home as if it were our own. Attention to detail, respect for your space, and care in every clean.",
  },
  {
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: "Transparency",
    desc: "No hidden fees, no surprises. We believe in honest pricing and clear communication at every step.",
  },
  {
    icon: <ThumbsUp className="w-6 h-6" />,
    title: "Accountability",
    desc: "If something isn't right, we fix it. Our 100% satisfaction guarantee backs every booking we take.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Community Focus",
    desc: "We're proud to be a Cape Town-based business, supporting local employment and serving our own community.",
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-100">
      {/* Hero — same shell as home, uniquely About */}
      <section className="mt-0">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-3xl shadow-xl overflow-hidden border border-slate-200 min-h-[420px] lg:min-h-[500px] bg-slate-950"
          >
            {/* Background image, slightly softened for About */}
            <img
              src="/hero-cleaning-team.png"
              alt="Shalean team at work in a Cape Town home"
              className="absolute inset-0 w-full h-full object-cover object-left-top opacity-80"
            />

            {/* Deep blue gradient overlay with subtle tint */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-slate-900/10"
              aria-hidden
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-stretch min-h-[420px] lg:min-h-[500px]">
              {/* Left — About narrative */}
              <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10 lg:max-w-[55%] order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-xs md:text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span>Inside Shalean Cleaning Services</span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 md:mb-6">
                  People-first home cleaning services in Cape Town.
                </h1>
                <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl mb-4 md:mb-6">
                  Shalean Cleaning Services is a Cape Town-based home and Airbnb cleaning company,
                  trusted for professional, reliable service and a team built on trust, care, and consistency.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <button
                    onClick={() => onNavigate("booking")}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-4 text-white shadow-md transition-colors"
                  >
                    Book a Clean <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => onNavigate("contact")}
                    className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border-2 border-white/80 font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-4 transition-colors"
                  >
                    Talk to Our Team
                  </button>
                </div>
              </div>

              {/* Right — culture snapshot card */}
              <div className="relative flex-1 order-1 lg:order-2 min-h-[220px] lg:min-h-0">
                <div className="absolute inset-4 lg:inset-6 flex items-end justify-end">
                  <div className="bg-white/95 rounded-2xl shadow-xl border border-slate-100 p-3 max-w-xs w-full backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                          Team culture
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          Fair pay. Real support.
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">
                      Every cleaner is an employee, not a gig worker — with training, protections,
                      and room to grow.
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Vetted & insured
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-blue-600" />
                        4.9★ rated
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Text card */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 h-full">
              <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm mb-4 bg-blue-50 px-4 py-1.5 rounded-full">
                <Sparkles className="w-4 h-4" /> Our Story
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Born in Cape Town. Built on Trust.
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Shalean Cleaning Services was founded in Cape Town with a simple but
                  powerful idea: every home deserves to be cleaned by someone who
                  genuinely cares. We saw a gap in the market for professional home
                  cleaning services that weren&apos;t unreliable, overpriced, or failing
                  to deliver on their promises.
                </p>
                <p>
                  We started small, serving a handful of homes in Sea Point and Gardens,
                  and grew steadily through word of mouth — one satisfied client at a
                  time. Today, Shalean serves hundreds of homes across Cape Town&apos;s
                  most sought-after suburbs, from Constantia to Durbanville, Claremont to
                  Century City.
                </p>
                <p>
                  What makes us different isn&apos;t just the quality of our clean — it&apos;s
                  the people behind it. Our team of professionally trained, vetted
                  cleaners are more than employees. They&apos;re the face of Shalean, and
                  we invest in them the same way we invest in our clients.
                </p>
              </div>
            </div>
            {/* Image card */}
            <div className="relative h-full">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-slate-900/5">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
                  alt="Shalean professional cleaning team at work in Cape Town"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-xl border border-blue-50 max-w-[220px]">
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-900 mb-1">
                  2,000+ Happy Homes
                </p>
                <p className="text-xs text-slate-500">Cleaned across Cape Town</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm"
          >
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">
              To provide Cape Town homeowners, landlords, and Airbnb hosts with a
              cleaning service that&apos;s truly reliable, transparent, and professional —
              delivered by a team that takes genuine pride in every home they touch. We
              exist to make your life easier and your home a place you love coming back
              to.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-blue-600 text-white rounded-3xl p-8 shadow-sm"
          >
            <div className="w-14 h-14 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6">
              <Eye className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-blue-100 leading-relaxed">
              To become South Africa&apos;s most trusted residential cleaning service — a
              brand synonymous with quality, integrity, and innovation. We envision a
              future where booking a professional clean is as simple and reliable as any
              essential service, and where our team members are valued, empowered, and
              proud to wear the Shalean name.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why We Started */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 w-full text-center">
          <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm mb-4 bg-blue-50 px-4 py-1.5 rounded-full">
            <Heart className="w-4 h-4" /> Why We Started
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
            The Problem We Set Out to Solve
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                title: "Unreliable Services",
                desc: "Too many Cape Town homeowners experienced cleaners who cancelled last-minute, arrived late, or simply didn't show up. We built systems to eliminate this.",
              },
              {
                title: "Hidden Costs",
                desc: "Quotes that changed after the clean. Surprise charges. We built transparent, upfront pricing that's shown before any booking is confirmed.",
              },
              {
                title: "Lack of Accountability",
                desc: "Unsatisfied clients with no recourse. We introduced a 100% satisfaction guarantee — if it's not right, we fix it at no cost.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
              >
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-lg font-black">{idx + 1}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 px-6 py-10 md:px-10 md:py-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Our Values
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                These values aren&apos;t just words on a wall — they guide every decision,
                every hire, and every clean we deliver.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {VALUES.map((value, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 h-full hover:border-blue-200 hover:shadow-sm transition-all group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {value.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {value.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Commitment to Quality */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-video rounded-3xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80"
                  alt="Shalean quality commitment"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-4 py-1.5 rounded-full w-fit">
                <Award className="w-4 h-4" /> Commitment to Quality
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                The Shalean Standard
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900 mb-2">
                    Trusted, Trained Team
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    Every cleaner is carefully vetted and professionally trained so you
                    get the same reliable standard every visit.
                  </p>
                  <div className="space-y-2">
                    {[
                      "Background & reference checks",
                      "Hands-on skills assessment",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-slate-700">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900 mb-2">
                    Guarantees You Can Feel
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    We back every clean with clear guarantees and support so you never
                    have to worry about the details.
                  </p>
                  <div className="space-y-2">
                    {[
                      "Post-clean quality follow-ups",
                      "100% satisfaction guarantee",
                      "Fully insured for peace of mind",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-slate-700">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 px-6 py-10 md:px-10 md:py-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Meet Our Professional Team
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                The people behind Shalean — dedicated professionals who make clean homes a
                reality across Cape Town every single day.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TEAM_MEMBERS.map((member, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 hover:border-blue-200 hover:shadow-md transition-all group">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-bold text-slate-900 mb-1">
                        {member.name}
                      </h3>
                      <p className="text-blue-600 text-sm font-semibold mb-3">
                        {member.role}
                      </p>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        {member.bio}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="rounded-3xl bg-blue-600 text-white px-6 py-10 md:px-10 md:py-12 shadow-xl">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 items-center text-center">
              {[
                {
                  value: "2,000+",
                  label: "Homes cleaned in Cape Town",
                },
                {
                  value: "4.9★",
                  label: "Average customer rating",
                },
                {
                  value: "500+",
                  label: "Recurring monthly clients",
                },
                {
                  value: "100%",
                  label: "Satisfaction guarantee",
                },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="space-y-1"
                >
                  <p className="text-3xl md:text-4xl font-black tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs md:text-sm text-blue-100">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 w-full text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Book With Confidence
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            You now know who we are, what we stand for, and why hundreds of Cape Town
            homeowners trust Shalean every week. Join them today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => onNavigate("booking")}
              variant="primary"
              className="text-lg px-10"
            >
              Book a Clean Now <ChevronRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => onNavigate("contact")}
              variant="outline"
              className="text-lg px-10"
            >
              Get in Touch
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

