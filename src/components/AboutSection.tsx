"use client";

import React from "react";
import {
  Sparkles,
  Droplet,
  Home,
  Briefcase,
  Building2,
  Hotel,
  ArrowRight,
} from "lucide-react";
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

/** Matches home marketing palette in ShaleanWebsite (home route only). */
const BG = "#EFF6FF";
const CARD = "#FFFFFF";
const PRIMARY = "#2563EB";
const TEXT = "#0F172A";

const SERVICES = [
  {
    title: "Standard Clean",
    description:
      "Recurring cleans for every room. Surfaces, floors, and fixtures covered.",
    Icon: Sparkles,
  },
  {
    title: "Deep Clean",
    description:
      "Top-to-bottom reset for a full refresh. More than a standard clean.",
    Icon: Droplet,
  },
  {
    title: "Airbnb Clean",
    description:
      "Quick turnovers between guests. Checklist-style, review-ready results.",
    Icon: Hotel,
  },
  {
    title: "Move In / Out",
    description:
      "Spotless handovers and move-in prep. Ready for keys or your first night in.",
    Icon: Home,
  },
  {
    title: "Office Clean",
    description:
      "Professional, hygienic workspace care. Booked around your business hours.",
    Icon: Briefcase,
  },
  {
    title: "Post Construction",
    description:
      "Dust and debris cleared after builds. Move in once the site is finished.",
    Icon: Building2,
  },
] as const;

export const AboutSection = ({ onNavigate }: AboutSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      aria-labelledby="what-we-offer-heading"
      style={{ backgroundColor: BG }}
    >
      <div className="mb-8 flex flex-col gap-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8 md:mb-12">
        <div>
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: PRIMARY }}
          >
            What we offer
          </p>
          <h2
            id="what-we-offer-heading"
            className="text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: TEXT }}
          >
            Every clean, tailored to you
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("services")}
          className="flex shrink-0 items-center gap-1 self-start text-sm font-medium text-[#2563EB] underline decoration-[#93C5FD] underline-offset-4 transition-colors hover:text-[#1D4ED8] sm:self-auto"
        >
          View all services
          <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ title, description, Icon }) => (
          <article
            key={title}
            className="flex min-h-[200px] flex-col gap-5 rounded-xl border border-[#BFDBFE] p-6 shadow-sm sm:min-h-[220px] sm:flex-row sm:items-stretch sm:gap-4 sm:p-6"
            style={{ backgroundColor: CARD }}
          >
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <h3
                  className="text-lg font-bold leading-snug md:text-xl"
                  style={{ color: TEXT }}
                >
                  {title}
                </h3>
                <p className="mt-2 max-w-[min(100%,17rem)] text-pretty text-sm leading-[1.35] text-slate-600 md:max-w-[18rem] md:text-[15px]">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("services")}
                className="mt-5 inline-flex w-fit rounded-full bg-[#2563EB] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1D4ED8] sm:mt-6"
              >
                Details
              </button>
            </div>
            <div
              className="flex shrink-0 items-end justify-center sm:w-[112px] md:w-[120px]"
              aria-hidden
            >
              <div className="flex h-[100px] w-[100px] items-center justify-center rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:h-[112px] sm:w-[112px]">
                <Icon
                  className="h-[52px] w-[52px] sm:h-14 sm:w-14"
                  style={{ color: PRIMARY }}
                  strokeWidth={1.35}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );
};
