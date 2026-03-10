"use client";

import React from "react";
import { CheckCircle2, Home } from "lucide-react";
import { motion } from "framer-motion";

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

interface AboutSectionProps {
  onNavigate: (page: PageType) => void;
}

const FEATURES = [
  "Professional & Trusted Team",
  "Eco-Friendly Cleaning Products",
  "Satisfaction Guaranteed",
  "Flexible Booking",
];

export const AboutSection = ({ onNavigate }: AboutSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="grid lg:grid-cols-2 gap-6 lg:gap-8 min-h-[400px]"
    >
      {/* Left — Text card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10 lg:p-12 flex flex-col justify-center order-2 lg:order-1">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-sm font-medium mb-6 w-fit">
          <Home className="w-4 h-4" />
          About Us
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
          Bringing Freshness, Comfort, and Care to Every Home
        </h2>
        <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-8">
          At Shalean, we go beyond surface cleaning – we bring life back to
          your space. Our dedicated team combines expert care, eco-friendly
          solutions, and attention to detail to ensure every home feels fresh.
        </p>
        <ul className="space-y-4 mb-8">
          {FEATURES.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
              <span className="text-slate-800 font-medium">{feature}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => onNavigate("about")}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 font-semibold text-base px-8 py-4 text-white shadow-md transition-colors w-fit"
        >
          Learn More
        </button>
      </div>

      {/* Right — Image card */}
      <div className="relative min-h-[280px] lg:min-h-0 order-1 lg:order-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <img
          src="/hero-cleaning-team.png"
          alt="Professional cleaning team"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </div>
    </motion.div>
  );
};
