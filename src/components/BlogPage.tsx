"use client";

import React from "react";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Sparkles } from "lucide-react";

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

const cleaningArticles = [
  {
    title: "Complete Guide to Deep Cleaning Your Home",
    category: "Deep Cleaning",
    readTime: "7 min read",
    level: "Intermediate",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    summary:
      "Tackle those forgotten corners with a room‑by‑room checklist for a true deep clean that feels like a reset for your whole home.",
    tags: ["Checklist", "Kitchen", "Bathroom"],
  },
  {
    title: "Weekly Cleaning Routine for Busy Households",
    category: "Routine Cleaning",
    readTime: "5 min read",
    level: "Easy",
    image:
      "https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?auto=format&fit=crop&w=900&q=80",
    summary:
      "A realistic, time‑boxed routine you can actually stick to — broken into quick 15‑minute sessions throughout the week.",
    tags: ["Routine", "Time‑saving", "Family"],
  },
  {
    title: "Airbnb & Short‑Stay Turnover Cleaning Checklist",
    category: "Airbnb & Hosts",
    readTime: "6 min read",
    level: "Pro",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80",
    summary:
      "Everything hosts need between guests — from linens to little touches that help you maintain 5‑star cleanliness ratings.",
    tags: ["Airbnb", "Checklist", "Hosts"],
  },
  {
    title: "Move‑In / Move‑Out Cleaning Essentials",
    category: "Moving",
    readTime: "4 min read",
    level: "Intermediate",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    summary:
      "Secure your deposit and hand over a truly spotless space with a structured approach to move‑related cleaning.",
    tags: ["Moving", "Landlords", "Deposits"],
  },
  {
    title: "Kid‑ and Pet‑Friendly Cleaning Tips",
    category: "Family Homes",
    readTime: "5 min read",
    level: "Easy",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80",
    summary:
      "Safer, low‑tox options and routines designed for busy homes with little ones and furry friends.",
    tags: ["Family", "Pets", "Safety"],
  },
  {
    title: "How Often Should You Really Clean Everything?",
    category: "Home Care",
    readTime: "8 min read",
    level: "Easy",
    image:
      "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80",
    summary:
      "From bedding to the oven, find out what should be cleaned daily, weekly, monthly, and yearly.",
    tags: ["Schedules", "Planning", "Guide"],
  },
] as const;

export const BlogPage = ({
  onNavigate,
}: {
  onNavigate: (page: PageType) => void;
}) => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-24">
        {/* Hero Section - matches overall look of home hero */}
        <section className="mb-12 md:mb-16">
          <div className="grid lg:grid-cols-[1.2fr,1fr] gap-10 items-center">
            <div>
              <button
                onClick={() => onNavigate("home")}
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 mb-4">
                <Sparkles className="w-4 h-4" />
                Cleaning Guides &amp; Tips
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                Expert cleaning advice for a{" "}
                <span className="text-blue-600">consistently spotless home</span>
              </h1>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl mb-6">
                Practical, Cape Town‑ready guides written from our on‑the‑ground
                cleaning experience. Learn how to clean smarter, protect your
                home, and decide when it&apos;s time to bring in the pros.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate("booking")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 font-semibold text-base px-6 py-3 text-white shadow-md transition-colors"
                >
                  Book a Professional Clean
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.scrollTo({ top: 520, behavior: "smooth" })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 font-semibold text-base px-6 py-3 shadow-sm transition-colors"
                >
                  Browse all guides
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/10 via-blue-400/5 to-emerald-400/10 blur-2xl" />
              <div className="relative bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      Cleaning Guides
                    </p>
                    <p className="text-sm text-slate-500">
                      Trusted by 500+ Cape Town homes
                    </p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">
                      Popular topics this week
                    </span>
                    <span className="text-slate-400 text-xs">Updated daily</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                      <p className="font-semibold text-slate-900 mb-1">
                        Deep Cleaning
                      </p>
                      <p className="text-slate-500 text-xs">
                        Detailed room‑by‑room checklists
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                      <p className="font-semibold text-slate-900 mb-1">
                        Airbnb Turnovers
                      </p>
                      <p className="text-slate-500 text-xs">
                        Fast resets between guests
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                      <p className="font-semibold text-slate-900 mb-1">
                        Weekly Routines
                      </p>
                      <p className="text-slate-500 text-xs">
                        15‑minute daily habits
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                      <p className="font-semibold text-slate-900 mb-1">
                        Move‑Out Cleans
                      </p>
                      <p className="text-slate-500 text-xs">
                        Impress landlords &amp; buyers
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Prefer done‑for‑you cleaning? Book a professional team in
                    just a few clicks — we use the same checklists from these
                    guides in our real‑world bookings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Work - Blue Box (aligned with home page style) */}
        <section className="mb-12 md:mb-16">
          <div className="bg-[#316DF8] rounded-2xl px-6 py-8 md:px-12 md:py-10 lg:px-16 lg:py-12">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white/95 bg-white/20 border border-white/30">
              <Sparkles className="w-4 h-4" />
              How It Work
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-4 mb-3 leading-tight">
              Turn expert tips into an effortlessly clean home
            </h2>
            <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-2xl mb-8 md:mb-10">
              Use these guides on their own, or combine them with Shalean&apos;s
              professional cleaning service for the best results and a home that
              stays guest‑ready all week.
            </p>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {[
                {
                  step: "01",
                  title: "Pick a guide that matches your goal",
                  desc: "Deep clean, move‑out, Airbnb turnover, or just staying on top of the weekly routine — choose the guide that fits where you are right now.",
                },
                {
                  step: "02",
                  title: "Follow the room‑by‑room checklist",
                  desc: "Each guide breaks tasks into clear, bite‑sized actions so you know exactly what to do next and where to focus your time.",
                },
                {
                  step: "03",
                  title: "Layer in professional help when needed",
                  desc: "Short on time or facing a big job? Book Shalean to handle the heavy lifting and use the guides to maintain things between visits.",
                },
                {
                  step: "04",
                  title: "Enjoy a home that stays clean longer",
                  desc: "With smart habits and periodic professional cleans, your space feels fresh more often — not just after a once‑off blitz.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="text-4xl md:text-5xl lg:text-6xl font-black text-white/30 flex-shrink-0 leading-none">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1.5 md:mb-2">
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
        </section>

        {/* Articles grid */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Latest Cleaning Guides
              </h2>
              <p className="text-slate-600 max-w-xl">
                Start with whatever feels most urgent: deep cleaning, weekly
                routines, hosting guests, or getting ready to move.
              </p>
            </div>
            <button
              onClick={() => onNavigate("booking")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-black text-sm font-semibold px-5 py-2.5 text-white shadow-md transition-colors self-start md:self-auto"
            >
              Prefer done‑for‑you cleaning?
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cleaningArticles.map((article) => (
              <article
                key={article.title}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:border-blue-200 hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-white">
                    {article.category}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <Clock className="w-3 h-3" />
                    <span>{article.readTime}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="font-medium text-emerald-600">
                      {article.level}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                    {article.summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-slate-50 text-[11px] font-medium text-slate-600 border border-slate-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Read guide
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
