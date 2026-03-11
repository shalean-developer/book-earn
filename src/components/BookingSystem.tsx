"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Star,
  ShieldCheck,
  Clock,
  Calendar,
  Home,
  Building,
  Building2,
  Truck,
  DoorClosed,
  AppWindow,
  Archive,
  Layers,
  Sparkles,
  Wind,
  Refrigerator,
  Microwave,
  Sun,
  BrickWall,
  Bed,
  Maximize2,
  Sofa,
  CarFront,
  LayoutGrid,
  Plus,
  Minus,
  Users,
  CreditCard,
  AlertCircle,
  Loader2,
  ChevronDown,
  Award,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

type ServiceType = "standard" | "deep" | "move" | "airbnb" | "carpet";
type PropertyType = "apartment" | "house" | "office";
type OfficeScale = "small" | "medium" | "large" | "xlarge" | "";
type PaymentMethod = "online";
type CleaningFrequency = "once" | "weekly" | "multi_week";
type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface Extra {
  id: string;
  label: string;
  price: number;
  icon: React.ReactNode;
  recommended?: boolean;
}

interface Cleaner {
  id: string;
  name: string;
  photo: string;
  experience: string;
  rating: number;
  reviews: number;
  badge?: string;
  workingAreas: string[];
  unavailableDates: string[];
}

interface Team {
  id: string;
  name: string;
  size: number;
  experience: string;
  availability: "high" | "medium" | "low";
  speciality: string;
  workingAreas: string[];
  unavailableDates: string[];
}

interface BookingFormData {
  service: ServiceType;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  propertyType: PropertyType;
  officeSize: OfficeScale;
  privateOffices: number;
  meetingRooms: number;
  carpetedRooms: number;
  looseRugs: number;
  carpetExtraCleaners: number;
  extras: string[];
  cleanerId: string;
  teamId: string;
  workingArea: string;
  cleaningFrequency: CleaningFrequency;
  cleaningDays: DayOfWeek[];
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  apartmentUnit: string;
  instructions: string;
  paymentMethod: PaymentMethod;
  tipAmount: number;
  promoCode: string;
  discountAmount: number;
  acceptedTerms: boolean;
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

const PROMO_CODES: Record<string, number> = {
  SHALEAN10: 0.1,
  SAVE20: 0.2,
  FIRSTCLEAN: 100,
};

const SERVICES = [
  {
    id: "standard" as ServiceType,
    title: "Standard Cleaning",
    description: "Essential upkeep for your home.",
    price: 450,
    icon: <Sparkles className="w-6 h-6" />,
    color: "blue",
  },
  {
    id: "deep" as ServiceType,
    title: "Deep Cleaning",
    description: "Intensive top-to-bottom clean.",
    price: 850,
    icon: <Layers className="w-6 h-6" />,
    color: "indigo",
  },
  {
    id: "move" as ServiceType,
    title: "Moving Cleaning",
    description: "Perfect for moving days.",
    price: 1200,
    icon: <Truck className="w-6 h-6" />,
    color: "violet",
  },
  {
    id: "airbnb" as ServiceType,
    title: "Airbnb Cleaning",
    description: "Quick guest-ready refresh.",
    price: 650,
    icon: <Calendar className="w-6 h-6" />,
    color: "sky",
  },
  {
    id: "carpet" as ServiceType,
    title: "Carpet Cleaning",
    description: "Deep fibre carpet clean.",
    price: 350,
    icon: <LayoutGrid className="w-6 h-6" />,
    color: "teal",
  },
];

const STANDARD_EXTRAS: Extra[] = [
  {
    id: "fridge",
    label: "Inside Fridge",
    price: 150,
    icon: <Refrigerator className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "oven",
    label: "Inside Oven",
    price: 150,
    icon: <Microwave className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "windows",
    label: "Interior Windows",
    price: 200,
    icon: <AppWindow className="w-5 h-5" />,
  },
  {
    id: "cabinets",
    label: "Inside Cabinets",
    price: 180,
    icon: <Archive className="w-5 h-5" />,
  },
  {
    id: "walls",
    label: "Wall Spot Cleaning",
    price: 120,
    icon: <BrickWall className="w-5 h-5" />,
  },
  {
    id: "extra_cleaner",
    label: "Extra Cleaner",
    price: 350,
    icon: <User className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "equipment",
    label: "Equipment Request",
    price: 200,
    icon: <Award className="w-5 h-5" />,
  },
];

const DEEP_MOVE_EXTRAS: Extra[] = [
  {
    id: "balcony",
    label: "Balcony Cleaning",
    price: 250,
    icon: <Sun className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "carpet_deep",
    label: "Carpet Cleaning",
    price: 300,
    icon: <LayoutGrid className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "ceiling",
    label: "Ceiling Cleaning",
    price: 300,
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "couch",
    label: "Couch Cleaning",
    price: 130,
    icon: <Sofa className="w-5 h-5" />,
  },
  {
    id: "garage",
    label: "Garage Cleaning",
    price: 110,
    icon: <CarFront className="w-5 h-5" />,
  },
  {
    id: "mattress",
    label: "Mattress Cleaning",
    price: 350,
    icon: <Bed className="w-5 h-5" />,
  },
  {
    id: "outside_windows",
    label: "Exterior Windows",
    price: 125,
    icon: <Maximize2 className="w-5 h-5" />,
  },
];

const getExtrasForService = (service: ServiceType): Extra[] => {
  if (service === "deep" || service === "move") {
    return DEEP_MOVE_EXTRAS;
  }
  return STANDARD_EXTRAS;
};

const INDIVIDUAL_CLEANERS: Cleaner[] = [
  {
    id: "c1",
    name: "Ashley Byrd",
    photo:
      "https://images.unsplash.com/photo-1494790108755-2616b612b1e8?auto=format&fit=crop&w=150&q=80",
    experience: "3 years",
    rating: 4.9,
    reviews: 127,
    badge: "Top Rated",
    workingAreas: ["Sea Point", "Green Point", "Camps Bay"],
    unavailableDates: ["2024-05-20", "2024-05-25"],
  },
  {
    id: "c2",
    name: "Nomvula Dlamini",
    photo:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80",
    experience: "5 years",
    rating: 4.8,
    reviews: 214,
    badge: "Most Booked",
    workingAreas: ["Sea Point", "Gardens", "Vredehoek"],
    unavailableDates: ["2024-05-21"],
  },
  {
    id: "c3",
    name: "Fatima Hartley",
    photo:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    experience: "2 years",
    rating: 4.7,
    reviews: 89,
    workingAreas: ["Claremont", "Kenilworth", "Rondebosch"],
    unavailableDates: [],
  },
  {
    id: "c4",
    name: "Thandiwe Mokoena",
    photo:
      "https://images.unsplash.com/photo-1601288496920-b6154fe3626a?auto=format&fit=crop&w=150&q=80",
    experience: "4 years",
    rating: 4.9,
    reviews: 173,
    workingAreas: ["Durbanville", "Bellville"],
    unavailableDates: [],
  },
];

const TEAMS: Team[] = [
  {
    id: "t1",
    name: "Team A — Precision Squad",
    size: 3,
    experience: "Senior Level",
    availability: "high",
    speciality: "Deep & Move-In/Out specialists",
    workingAreas: ["Sea Point", "Green Point", "Gardens"],
    unavailableDates: [],
  },
  {
    id: "t2",
    name: "Team B — Speed Force",
    size: 4,
    experience: "Expert Level",
    availability: "medium",
    speciality: "Large property experts",
    workingAreas: ["Claremont", "Kenilworth", "Constantia"],
    unavailableDates: [],
  },
  {
    id: "t3",
    name: "Team C — Elite Clean",
    size: 2,
    experience: "Specialist Level",
    availability: "high",
    speciality: "Compact & fast turnaround",
    workingAreas: ["Vredehoek", "Gardens", "Sea Point"],
    unavailableDates: [],
  },
];

const TIME_SLOTS = ["08:00", "10:00", "13:00", "15:00"];
const DAYS_AHEAD = 90;

const WORKING_AREAS = [
  "Sea Point",
  "Green Point",
  "Camps Bay",
  "Gardens",
  "Vredehoek",
  "Claremont",
  "Kenilworth",
  "Rondebosch",
  "Durbanville",
  "Bellville",
  "Constantia",
];

const STEP_LABELS = ["Plan", "Schedule", "Details", "Payment"];

const STEP_SLUGS = ["your-cleaning-plan", "schedule", "details", "payment"] as const;

type StepSlug = (typeof STEP_SLUGS)[number];

const DEFAULT_FORM: BookingFormData = {
  service: "standard",
  bedrooms: 2,
  bathrooms: 1,
  extraRooms: 0,
  propertyType: "apartment",
  officeSize: "",
  privateOffices: 1,
  meetingRooms: 1,
  carpetedRooms: 2,
  looseRugs: 1,
  carpetExtraCleaners: 0,
  extras: [],
  cleanerId: "",
  teamId: "",
  workingArea: "",
  cleaningFrequency: "once",
  cleaningDays: [],
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  apartmentUnit: "",
  instructions: "",
  paymentMethod: "online",
  tipAmount: 0,
  promoCode: "",
  discountAmount: 0,
  acceptedTerms: false,
};

const SERVICE_TITLE_SLUGS: Record<ServiceType, string> = SERVICES.reduce(
  (acc, service) => {
    const slug = service.title
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    acc[service.id] = slug;
    return acc;
  },
  {} as Record<ServiceType, string>
);

const SERVICE_SLUG_TO_ID: Record<string, ServiceType> = Object.entries(
  SERVICE_TITLE_SLUGS
).reduce((acc, [id, slug]) => {
  acc[slug] = id as ServiceType;
  return acc;
}, {} as Record<string, ServiceType>);

function getStepSlug(step: number): StepSlug {
  const index = Math.max(1, Math.min(STEP_SLUGS.length, step)) - 1;
  return STEP_SLUGS[index];
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function getDatesForMonth(): string[] {
  const today = new Date();
  const dates: string[] = [];

  for (let i = 1; i <= DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }

  return dates;
}

function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay(); // 0 (Sun) - 6 (Sat)
  const map: DayOfWeek[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[dow === 0 ? 0 : dow] === "Sun" ? "Sun" : (map[dow] as DayOfWeek);
}

function generateTimeSlots(
  startHour: number,
  endHour: number,
  intervalMinutes: number
): string[] {
  const slots: string[] = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  for (let m = startMinutes; m <= endMinutes; m += intervalMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const hourStr = h.toString().padStart(2, "0");
    const minStr = min.toString().padStart(2, "0");
    slots.push(`${hourStr}:${minStr}`);
  }

  return slots;
}

function getDateAvailability(dateStr: string): "normal" | "limited" {
  if (!dateStr) return "normal";
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay();
  // Treat Fridays and Saturdays as busier days
  return dow === 5 || dow === 6 ? "limited" : "normal";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function useCalcTotal(
  data: BookingFormData
): {
  basePrice: number;
  bedroomAdd: number;
  bathroomAdd: number;
  extraRoomsAdd: number;
  officePrivateAdd: number;
  officeMeetingAdd: number;
  officeScaleAdd: number;
  carpetRoomsAdd: number;
  looseRugsAdd: number;
  carpetExtraCleanerAdd: number;
  extrasTotal: number;
  tipAmount: number;
  discountAmount: number;
  subtotal: number;
  total: number;
} {
  return useMemo(() => {
    const svc = SERVICES.find((s) => s.id === data.service);
    const basePrice = svc?.price ?? 0;
    let bedroomAdd = 0;
    let bathroomAdd = 0;
    let extraRoomsAdd = 0;
    let officePrivateAdd = 0;
    let officeMeetingAdd = 0;
    let officeScaleAdd = 0;
    let carpetRoomsAdd = 0;
    let looseRugsAdd = 0;
    let carpetExtraCleanerAdd = 0;

    if (data.service === "carpet") {
      carpetRoomsAdd = data.carpetedRooms * 120;
      looseRugsAdd = data.looseRugs * 80;
      carpetExtraCleanerAdd = data.carpetExtraCleaners * 300;
    } else {
      bedroomAdd = (data.bedrooms - 1) * 100;
      bathroomAdd = (data.bathrooms - 1) * 50;
      extraRoomsAdd = data.extraRooms * 80;
      if (data.propertyType === "office") {
        officePrivateAdd = data.privateOffices * 120;
        officeMeetingAdd = data.meetingRooms * 100;
        if (data.officeSize === "small") officeScaleAdd = 0;
        if (data.officeSize === "medium") officeScaleAdd = 250;
        if (data.officeSize === "large") officeScaleAdd = 500;
        if (data.officeSize === "xlarge") officeScaleAdd = 900;
      }
    }

    const availableExtras = getExtrasForService(data.service);

    const extrasTotal = data.extras.reduce((sum, id) => {
      const e = availableExtras.find((ex) => ex.id === id);
      return sum + (e?.price ?? 0);
    }, 0);

    const tipAmount = data.tipAmount;
    const subtotal =
      basePrice +
      bedroomAdd +
      bathroomAdd +
      extraRoomsAdd +
      officePrivateAdd +
      officeMeetingAdd +
      officeScaleAdd +
      carpetRoomsAdd +
      looseRugsAdd +
      carpetExtraCleanerAdd +
      extrasTotal;

    let discountAmount = 0;
    if (data.promoCode) {
      const discount = PROMO_CODES[data.promoCode.toUpperCase()];
      if (discount) {
        if (discount <= 1) {
          discountAmount = Math.round(subtotal * discount);
        } else {
          discountAmount = Math.min(subtotal, discount);
        }
      }
    }

    return {
      basePrice,
      bedroomAdd,
      bathroomAdd,
      extraRoomsAdd,
      officePrivateAdd,
      officeMeetingAdd,
      officeScaleAdd,
      carpetRoomsAdd,
      looseRugsAdd,
      carpetExtraCleanerAdd,
      extrasTotal,
      tipAmount,
      discountAmount,
      subtotal,
      total: Math.max(0, subtotal - discountAmount) + tipAmount,
    };
  }, [data]);
}

// ─── SHARED UI COMPONENTS ──────────────────────────────────────────────────────

const StepTitle = ({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) => (
  <div className="mb-6">
    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5 leading-tight">
      {children}
    </h3>
    {subtitle && (
      <p className="text-[11px] sm:text-sm font-medium text-slate-500 leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-4 pt-6 border-t border-slate-100 first:border-t-0 first:pt-0">
    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
    <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">
      {children}
    </h4>
  </div>
);

const SelectionCard = ({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    onClick={onClick}
    className={`rounded-xl border-2 cursor-pointer transition-all duration-200 p-4 ${
      selected
        ? "border-blue-600 bg-blue-50/50 shadow-sm"
        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
    } ${className}`}
  >
    {children}
  </div>
);

const FieldLabel = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const InputField = ({
  label,
  required,
  error,
  hint,
  ...props
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <FieldLabel required={required}>{label}</FieldLabel>
    {hint && (
      <p className="text-[10px] text-slate-400 mb-1 ml-1">{hint}</p>
    )}
    <input
      {...props}
      className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${
        error ? "border-red-400 bg-red-50" : "border-slate-200"
      }`}
    />
    {error && (
      <p className="text-[10px] text-red-500 mt-1 ml-1 font-medium">{error}</p>
    )}
  </div>
);

const SelectField = ({
  label,
  required,
  children,
  ...props
}: {
  label: string;
  required?: boolean;
} & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div>
    <FieldLabel required={required}>{label}</FieldLabel>
    <div className="relative">
      <select
        {...props}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const CounterRow = ({
  label,
  sub,
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  label: string;
  sub?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) => {
  const safeMin = min ?? 0;
  const safeMax = max ?? 999;
  const safeValue = Number.isFinite(value) ? value : safeMin;

  const handleDecrement = () => {
    const base = Number.isFinite(value) ? value : safeMin;
    onChange(Math.max(safeMin, base - 1));
  };

  const handleIncrement = () => {
    const base = Number.isFinite(value) ? value : safeMin;
    onChange(Math.min(safeMax, base + 1));
  };

  return (
    <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl">
      <div>
        <span className="block font-bold text-slate-900 text-sm">{label}</span>
        {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center active:bg-slate-100 hover:border-slate-300 transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-slate-600" />
        </button>
        <span className="text-base font-black text-slate-900 w-5 text-center">
          {safeValue}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center active:bg-slate-100 hover:border-slate-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-slate-600" />
        </button>
      </div>
    </div>
  );
};

// ─── STEP 1: PLAN (Service + Property + Area) ───────────────────────────────

const Step1Plan = ({
  data,
  setData,
  errors = {},
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  errors?: Partial<Record<keyof BookingFormData, string>>;
}) => {
  return (
    <div className="space-y-8">
      <div>
        <StepTitle subtitle="Set your service, property, and location below. Sections 1–3 guide you through the plan.">
          Your Cleaning Plan
        </StepTitle>

        <SectionHeader>1. Service type</SectionHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SERVICES.map((s) => {
            const selected = data.service === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setData((prev) => ({
                    ...prev,
                    service: s.id,
                    cleanerId: "",
                    teamId: "",
                  }));
                }}
                className={`w-full min-h-[120px] rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition-all flex flex-col gap-2 ${
                  selected
                    ? "border-blue-500 shadow-md"
                    : "border-slate-200 hover:shadow-md hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <div className="w-5 h-5 text-blue-600">{s.icon}</div>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm leading-snug break-words flex-1 min-w-0">
                    {s.title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug break-words">
                  {s.description}
                </p>
                <p className="text-xs font-bold text-blue-600">
                  From R{s.price}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionHeader>2. Property type & location</SectionHeader>
        <div className="space-y-6">
          {/* Property type + location aligned horizontally */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Property Type</FieldLabel>
              <p className="text-[10px] text-slate-500 mb-1.5 ml-1">
                Home, apartment, or office—we tailor the clean to your space.
              </p>
              <div className="flex flex-row gap-2 rounded-2xl bg-slate-50 p-1">
                {[
                  { id: "apartment", label: "Apartment", icon: <Building className="w-5 h-5" /> },
                  { id: "house", label: "House", icon: <Home className="w-5 h-5" /> },
                  { id: "office", label: "Office", icon: <Building2 className="w-5 h-5" /> },
                ].map((item) => {
                  const selected = data.propertyType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          propertyType: item.id as PropertyType,
                          officeSize:
                            item.id === "office" ? prev.officeSize : "",
                        }))
                      }
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all flex-1 ${
                        selected
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-900 hover:bg-white/70"
                      }`}
                    >
                      <span className={selected ? "text-blue-600" : "text-slate-500"}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <FieldLabel required>Your location</FieldLabel>
              <p className="text-[10px] text-slate-500 mb-1.5 ml-1">
                We use this to match you with cleaners in your area.
              </p>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Home className="w-4 h-4" />
                </div>
                <select
                  value={data.workingArea}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      workingArea: e.target.value,
                      cleanerId: "",
                      teamId: "",
                    }))
                  }
                  className={`w-full pl-9 pr-8 py-3 bg-white border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none ${
                    errors.workingArea ? "border-red-400 bg-red-50" : "border-slate-200"
                  }`}
                >
                  <option value="">Select an area</option>
                  {WORKING_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {errors.workingArea && (
                <p className="text-[10px] text-red-500 mt-1 ml-1 font-medium">{errors.workingArea}</p>
              )}
            </div>
          </div>

          {/* Office configuration & scale (only for office properties) */}
          {data.propertyType === "office" && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 -mt-1 ml-1">
                Pricing for offices is estimated; final quote may vary based on size and configuration.
              </p>
              <div>
                <FieldLabel>Office Configuration</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <DoorClosed className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-sm text-slate-900">
                        Private Offices
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            privateOffices: Math.max(0, prev.privateOffices - 1),
                          }))
                        }
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                      <span className="text-base font-black text-slate-900 w-5 text-center">
                        {data.privateOffices}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            privateOffices: Math.min(20, prev.privateOffices + 1),
                          }))
                        }
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Users className="w-4 h-4 text-purple-500" />
                      </div>
                      <span className="font-semibold text-sm text-slate-900">
                        Meeting Rooms
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            meetingRooms: Math.max(0, prev.meetingRooms - 1),
                          }))
                        }
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                      <span className="text-base font-black text-slate-900 w-5 text-center">
                        {data.meetingRooms}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            meetingRooms: Math.min(20, prev.meetingRooms + 1),
                          }))
                        }
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel>Office Scale</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      id: "small",
                      label: "Small (0–100m²)",
                    },
                    {
                      id: "medium",
                      label: "Medium (100–250m²)",
                    },
                    {
                      id: "large",
                      label: "Large (250m²+)",
                    },
                    {
                      id: "xlarge",
                      label: "XL (500m²+)",
                    },
                  ].map((option) => {
                    const selected = data.officeSize === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            officeSize: option.id as OfficeScale,
                          }))
                        }
                        className={`px-5 py-2.5 rounded-2xl text-xs font-semibold tracking-wide uppercase transition-all ${
                          selected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Rooms counters - only for apartment/house and not for carpet service */}
          {(data.service !== "carpet" &&
            (data.propertyType === "apartment" || data.propertyType === "house")) && (
            <div>
              <FieldLabel>Rooms</FieldLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CounterRow
                  label="Bedrooms"
                  sub="Sleeping areas"
                  value={data.bedrooms}
                  onChange={(v) =>
                    setData((prev) => ({
                      ...prev,
                      bedrooms: v,
                    }))
                  }
                  min={1}
                  max={10}
                />
                <CounterRow
                  label="Bathrooms"
                  sub="Incl. ensuites"
                  value={data.bathrooms}
                  onChange={(v) =>
                    setData((prev) => ({
                      ...prev,
                      bathrooms: v,
                    }))
                  }
                  min={1}
                  max={8}
                />
                <CounterRow
                  label="Extra Rooms"
                  sub="Study, loft, etc."
                  value={data.extraRooms}
                  onChange={(v) =>
                    setData((prev) => ({
                      ...prev,
                      extraRooms: v,
                    }))
                  }
                  min={0}
                  max={10}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {data.service === "carpet" && (
        <div>
          <SectionHeader>CARPET DETAILS</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CounterRow
              label="Rooms"
              sub="Main carpeted areas"
              value={data.carpetedRooms}
              onChange={(v) =>
                setData((prev) => ({ ...prev, carpetedRooms: v }))
              }
              min={0}
              max={20}
            />
            <CounterRow
              label="Loose Rugs"
              sub="Rugs and runners"
              value={data.looseRugs}
              onChange={(v) =>
                setData((prev) => ({ ...prev, looseRugs: v }))
              }
              min={0}
              max={20}
            />
            <CounterRow
              label="Extra cleaner"
              sub="Extra carpet cleaner"
              value={data.carpetExtraCleaners}
              onChange={(v) =>
                setData((prev) => ({ ...prev, carpetExtraCleaners: v }))
              }
              min={0}
              max={10}
            />
          </div>
        </div>
      )}

      <div>
        <SectionHeader>3. Optional add-ons</SectionHeader>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {getExtrasForService(data.service).map((extra) => {
            const selected = data.extras.includes(extra.id);
            return (
              <div
                key={extra.id}
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    extras: prev.extras.includes(extra.id)
                      ? prev.extras.filter((e) => e !== extra.id)
                      : [...prev.extras, extra.id],
                  }))
                }
                className={`group relative flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  selected
                    ? "text-blue-700"
                    : "text-slate-600 hover:text-blue-700"
                }`}
              >
                {extra.recommended && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                    Popular
                  </span>
                )}
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selected
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-blue-200 bg-white text-blue-500 group-hover:border-blue-500"
                  }`}
                >
                  <div className="w-5 h-5">{extra.icon}</div>
                </div>
                <p className="text-[11px] font-semibold text-center leading-snug max-w-[80px] whitespace-normal">
                  {extra.label}
                </p>
                <p className="text-[10px] font-bold text-blue-600">
                  +R{extra.price}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── STEP 2: SCHEDULE (Schedule + Extras) ───────────────────────────────────

function Step2Schedule({
  data,
  setData,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
}) {
  const timeSlots = useMemo(
    () => generateTimeSlots(7, 12, 30),
    []
  );

  const [availableDates, setAvailableDates] = useState<string[]>(() =>
    getDatesForMonth()
  );

  useEffect(() => {
    const updateDates = () => setAvailableDates(getDatesForMonth());

    updateDates();

    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateDates();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const toggleExtra = (id: string) => {
    setData((prev) => ({
      ...prev,
      extras: prev.extras.includes(id)
        ? prev.extras.filter((e) => e !== id)
        : [...prev.extras, id],
    }));
  };

  const [visibleStart, setVisibleStart] = useState(0);

  const maxVisibleStart = Math.max(0, availableDates.length - 7);

  const visibleDates = useMemo(
    () => availableDates.slice(visibleStart, visibleStart + 7),
    [availableDates, visibleStart]
  );

  const selectedDateLabel = data.date ? formatDate(data.date) : "";

  const monthYearLabel = useMemo(() => {
    const sourceDateStr = data.date || visibleDates[0];
    if (!sourceDateStr) return "";
    const d = new Date(sourceDateStr + "T00:00:00");
    return d.toLocaleDateString("en-ZA", {
      month: "long",
      year: "numeric",
    });
  }, [data.date, visibleDates]);

  return (
    <div className="space-y-6">
      <StepTitle subtitle="Pick the date and time that work best for you.">
        When &amp; What Time
      </StepTitle>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-6">
        <div>
          <SectionHeader>1. How often do you need cleaning?</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SelectionCard
              selected={data.cleaningFrequency === "once"}
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  cleaningFrequency: "once",
                  cleaningDays: [],
                }))
              }
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">Once</span>
                </div>
                <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                  <li>Book a one-time cleaning session</li>
                </ul>
              </div>
            </SelectionCard>

            <SelectionCard
              selected={data.cleaningFrequency === "weekly"}
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  cleaningFrequency: "weekly",
                  cleaningDays:
                    prev.date && prev.date.length > 0
                      ? [getDayOfWeekFromDate(prev.date)]
                      : [],
                }))
              }
              className="relative"
            >
              <div className="absolute -top-2 left-3 px-1.5 py-0.5 rounded-full bg-orange-500 text-[9px] font-bold uppercase tracking-wider text-white">
                Popular
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">Weekly</span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[10px] font-bold text-orange-600">
                    10% off per visit
                  </span>
                </div>
                <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                  <li>Get the same cleaner each time</li>
                  <li>Re-schedule easily through the app</li>
                </ul>
              </div>
            </SelectionCard>

            <SelectionCard
              selected={data.cleaningFrequency === "multi_week"}
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  cleaningFrequency: "multi_week",
                }))
              }
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    Multiple times a week
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[10px] font-bold text-orange-600">
                    15% off per visit
                  </span>
                </div>
                <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                  <li>Get the same cleaner each time</li>
                  <li>Re-schedule easily through the app</li>
                </ul>
              </div>
            </SelectionCard>
          </div>

          {data.cleaningFrequency === "multi_week" && (
            <div className="mt-4">
              <p className="text-[11px] text-slate-500 mb-2 ml-1">
                Choose which days of the week you&apos;d like your clean. We&apos;ll use these together with your start date below.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                  const typedDay = day as DayOfWeek;
                  const selected = data.cleaningDays.includes(typedDay);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          cleaningDays: selected
                            ? prev.cleaningDays.filter((d) => d !== typedDay)
                            : [...prev.cleaningDays, typedDay],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                        selected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <SectionHeader>2. Date &amp; Time</SectionHeader>
          <p className="text-[10px] text-slate-500 mb-2 ml-1">
            You can book up to 3 months in advance.
          </p>
          {monthYearLabel && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {monthYearLabel}
              </p>
            </div>
          )}
          <div className="mb-2">
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setVisibleStart((prev) => Math.max(0, prev - 1))
                }
                disabled={visibleStart === 0}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex gap-3">
                {visibleDates.map((dateStr) => {
                  const d = new Date(dateStr + "T00:00:00");
                  const dayName = d.toLocaleDateString("en-ZA", {
                    weekday: "short",
                  });
                  const dayNum = d.getDate();
                  const selected = data.date === dateStr;
                  const availability = getDateAvailability(dateStr);
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setData((prev) => ({
                          ...prev,
                          date: dateStr,
                          cleaningDays:
                            prev.cleaningFrequency === "weekly"
                              ? [getDayOfWeekFromDate(dateStr)]
                              : prev.cleaningFrequency === "multi_week" &&
                                prev.cleaningDays.length === 0
                              ? [getDayOfWeekFromDate(dateStr)]
                              : prev.cleaningDays,
                        }));
                      }}
                      className={`min-w-[72px] px-3 py-2 rounded-full text-center text-xs font-semibold transition-all border-2 ${
                        selected
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <p
                        className={`text-[9px] font-semibold mb-0.5 ${
                          selected ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {dayName}
                      </p>
                      <p className="text-sm font-black leading-none">{dayNum}</p>
                      {availability === "limited" && (
                        <p
                          className={`mt-0.5 text-[9px] font-semibold ${
                            selected ? "text-amber-200" : "text-amber-600"
                          }`}
                        >
                          Limited
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() =>
                  setVisibleStart((prev) => Math.min(maxVisibleStart, prev + 1))
                }
                disabled={visibleStart >= maxVisibleStart}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {data.date && (
          <div className="space-y-3">
            <p className="text-[11px] font-medium text-slate-500">
              {selectedDateLabel
                ? `Select a time on ${selectedDateLabel}.`
                : "Select a time that works best for you."}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      time: slot,
                    }))
                  }
                  className={`py-2.5 rounded-2xl border-2 font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                    data.time === slot
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  <span>{slot}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!data.date && (
          <p className="text-[11px] text-slate-500">
            Choose any available date above to see open time slots for your clean.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── STEP 3: DETAILS (Cleaner + Contact) ─────────────────────────────────────

const Step3Details = ({
  data,
  setData,
  errors,
  cleaners,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  errors: Partial<Record<keyof BookingFormData, string>>;
  cleaners: Cleaner[];
}) => {
  const showIndividual = data.service === "standard" || data.service === "airbnb";

  const filteredCleaners = useMemo(() => {
    return cleaners.filter((cleaner) => {
      const worksInArea =
        !data.workingArea || cleaner.workingAreas.includes(data.workingArea);
      const availableOnDate =
        !data.date || !cleaner.unavailableDates.includes(data.date);
      return worksInArea && availableOnDate;
    });
  }, [cleaners, data.workingArea, data.date]);

  const filteredTeams = useMemo(() => {
    return TEAMS.filter((team) => {
      const worksInArea =
        !data.workingArea || team.workingAreas.includes(data.workingArea);
      const availableOnDate =
        !data.date || !team.unavailableDates.includes(data.date);
      return worksInArea && availableOnDate;
    });
  }, [data.workingArea, data.date]);

  return (
    <div className="space-y-6">
      <StepTitle subtitle="Select your professional and tell us where to go.">
        Final Details
      </StepTitle>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5">
        <SectionHeader>
          1. Choose {showIndividual ? "Cleaner" : "Team"}
        </SectionHeader>

        {showIndividual ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredCleaners.length > 0 ? (
              filteredCleaners.map((cleaner) => (
                <SelectionCard
                  key={cleaner.id}
                  selected={data.cleanerId === cleaner.id}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      cleanerId: cleaner.id,
                    }))
                  }
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    {cleaner.photo ? (
                      <img
                        src={cleaner.photo}
                        alt={cleaner.name}
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-blue-500" />
                      </div>
                    )}
                    <h4 className="font-bold text-slate-900 text-sm truncate w-full">
                      {cleaner.name}
                    </h4>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-bold text-slate-800">
                        {cleaner.rating}
                      </span>
                    </div>
                  </div>
                </SelectionCard>
              ))
            ) : (
              <div className="space-y-3 col-span-full">
                <SelectionCard
                  selected={data.cleanerId === "any"}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      cleanerId: "any",
                    }))
                  }
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Any available cleaner
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      We'll match you with the best available professional for this area/date.
                    </p>
                  </div>
                </SelectionCard>
                <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-[11px] text-slate-500">
                  No individual cleaners visible for this exact area/date. You can select{" "}
                  <span className="font-semibold text-slate-700">any available cleaner</span>{" "}
                  above, or try another date or nearby area.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => (
                <SelectionCard
                  key={team.id}
                  selected={data.teamId === team.id}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      teamId: team.id,
                    }))
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {team.name}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full flex-shrink-0">
                      {team.availability}
                    </span>
                  </div>
                </SelectionCard>
              ))
            ) : (
              <div className="space-y-3">
                <SelectionCard
                  selected={data.teamId === "any"}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      teamId: "any",
                    }))
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          Any available team
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          We'll assign the best-matched team based on your area and date.
                        </p>
                      </div>
                    </div>
                  </div>
                </SelectionCard>
                <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-[11px] text-slate-500">
                  No specific teams visible for this exact area/date. You can select{" "}
                  <span className="font-semibold text-slate-700">any available team</span>{" "}
                  above, or try another date or nearby area.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5">
        <SectionHeader>2. Your Information</SectionHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Full Name"
              required
              value={data.name}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              error={errors.name}
            />
            <div className="w-full">
              <FieldLabel>Apartment or Unit Number (optional)</FieldLabel>
              <input
                type="text"
                value={data.apartmentUnit}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    apartmentUnit: e.target.value,
                  }))
                }
                placeholder="e.g. 12B, Unit 5, Apt 301"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Phone"
              required
              type="tel"
              value={data.phone}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              hint="South African mobile format, e.g. 082 123 4567 or +27 82 123 4567."
              error={errors.phone}
            />
            <InputField
              label="Email"
              required
              type="email"
              value={data.email}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              hint="We'll send your booking confirmation here."
              error={errors.email}
            />
          </div>
          <div className="w-full">
            <FieldLabel required>Address</FieldLabel>
            <p className="text-[10px] text-slate-400 mb-1 ml-1">
              Include street and number, suburb, city, and postal code so our team can find you easily.
            </p>
            <textarea
              value={data.address}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              placeholder="Street and number, suburb, city, postal code"
              className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y min-h-[80px] ${
                errors.address ? "border-red-400 bg-red-50" : "border-slate-200"
              }`}
            />
            {errors.address && (
              <p className="text-[10px] text-red-500 mt-1 ml-1 font-medium">
                {errors.address}
              </p>
            )}
          </div>
          <div className="w-full">
            <FieldLabel>Notes</FieldLabel>
            <textarea
              value={data.instructions}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  instructions: e.target.value,
                }))
              }
              placeholder="Any special instructions, access details, or notes for the cleaner..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y min-h-[72px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── STEP 4: PAYMENT (Payment + Review) ─────────────────────────────────────

const Step4Payment = ({
  data,
  setData,
  pricing,
  onPaystackPay,
  isProcessing,
  paymentError,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  pricing: ReturnType<typeof useCalcTotal>;
  onPaystackPay: () => void;
  isProcessing: boolean;
  paymentError: string;
}) => {
  const tipOptions = [0, 50, 100, 150];
  const [promoInput, setPromoInput] = useState(data.promoCode);
  const [promoMsg, setPromoMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [customTipMode, setCustomTipMode] = useState(
    !tipOptions.includes(data.tipAmount)
  );
  const [customTipInput, setCustomTipInput] = useState(
    !tipOptions.includes(data.tipAmount) && data.tipAmount > 0
      ? String(data.tipAmount)
      : ""
  );

  const applyPromo = () => {
    const code = promoInput.toUpperCase().trim();
    if (!code) {
      setData((prev) => ({
        ...prev,
        promoCode: "",
      }));
      setPromoMsg(null);
      return;
    }
    if (PROMO_CODES[code]) {
      setData((prev) => ({
        ...prev,
        promoCode: code,
      }));
      setPromoMsg({
        text: "Promo code applied successfully!",
        type: "success",
      });
    } else {
      setPromoMsg({
        text: "This promo code is not recognized or may have expired.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <StepTitle subtitle="Choose how to pay and confirm your booking.">
          Payment &amp; Confirm
        </StepTitle>

        <div className="space-y-10">
          <div className="space-y-4">
            <SectionHeader>1. How you&apos;ll pay</SectionHeader>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-left text-xs">
                <p className="font-bold text-slate-900">
                  Pay by card or EFT – secure checkout
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  We currently only support secure online payments. You&apos;ll be redirected to an encrypted payment page to complete your booking.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeader>2. Add a tip</SectionHeader>
            <div className="grid grid-cols-5 gap-2 max-w-md">
              {tipOptions.map((amount) => {
                const isSelected = !customTipMode && data.tipAmount === amount;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setCustomTipMode(false);
                      setCustomTipInput("");
                      setData((prev) => ({
                        ...prev,
                        tipAmount: amount,
                      }));
                    }}
                    className={`py-2.5 rounded-xl border-2 text-[10px] font-bold transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-100 hover:border-blue-200"
                    }`}
                  >
                    {amount === 0 ? "None" : `R${amount}`}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setCustomTipMode(true);
                  if (!customTipInput && data.tipAmount > 0) {
                    setCustomTipInput(String(data.tipAmount));
                  }
                }}
                className={`py-2.5 rounded-xl border-2 text-[10px] font-bold transition-all ${
                  customTipMode
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-100 hover:border-blue-200"
                }`}
              >
                Custom
              </button>
            </div>
            {customTipMode && (
              <div className="max-w-md space-y-1">
                <label className="text-[10px] font-medium text-slate-500 ml-1">
                  Enter custom tip amount (R)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={customTipInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setCustomTipInput(raw);
                    const parsed = Number(raw);
                    if (!Number.isNaN(parsed) && parsed >= 0) {
                      setData((prev) => ({
                        ...prev,
                        tipAmount: parsed,
                      }));
                    }
                  }}
                  placeholder="E.g. 75"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            )}
          </div>

          <div className="space-y-4 max-w-md">
            <SectionHeader>3. Promo code</SectionHeader>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Enter code (e.g. SAVE20)"
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm uppercase"
                />
                <button
                  onClick={applyPromo}
                  className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm"
                >
                  Apply
                </button>
              </div>
              {promoMsg && (
                <p
                  className={`text-[10px] font-medium ml-1 flex items-center gap-1 ${
                    promoMsg.type === "success"
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {promoMsg.type === "success" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {promoMsg.text}
                </p>
              )}
              {promoMsg?.type === "error" && (
                <a
                  href="/promotions"
                  className="text-[10px] font-semibold text-blue-600 underline ml-1"
                >
                  View current offers
                </a>
              )}
            </div>
          </div>

          {paymentError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p className="text-xs font-medium">{paymentError}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <SectionHeader>4. Terms &amp; cancellation</SectionHeader>
            <label className="flex items-start gap-2 text-[11px] text-slate-600">
              <input
                type="checkbox"
                checked={!!data.acceptedTerms}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    acceptedTerms: e.target.checked,
                  }))
                }
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I have read and agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 underline"
                >
                  terms of service
                </a>{" "}
                and{" "}
                <a
                  href="/cancellation-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 underline"
                >
                  cancellation policy
                </a>
                .
              </span>
            </label>
          </div>

          <div className="pt-4">
            <button
              onClick={onPaystackPay}
              disabled={isProcessing || !data.acceptedTerms}
              className="w-full sm:w-auto px-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-100 text-sm"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Securely Pay R{pricing.total}
            </button>
            <p className="text-[10px] text-slate-400 mt-3 ml-1">
              Subtotal R{pricing.subtotal}
              {pricing.discountAmount > 0 && (
                <>
                  {" "}
                  − Discount R{pricing.discountAmount}
                </>
              )}
              {pricing.tipAmount > 0 && (
                <>
                  {" "}
                  + Tip R{pricing.tipAmount}
                </>
              )}{" "}
              = R{pricing.total} total.
            </p>
            <p className="text-[10px] text-slate-400 mt-1 ml-1">
              Your payment is processed securely. You&apos;ll receive a confirmation email with all booking details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── STEP 5: CONFIRMATION ───────────────────────────────────────────────────

const Step5Confirmation = ({
  data,
  pricing,
  bookingRef,
  onBookAnother,
  cleaners,
}: {
  data: BookingFormData;
  pricing: ReturnType<typeof useCalcTotal>;
  bookingRef: string;
  onBookAnother: () => void;
  cleaners: Cleaner[];
}) => {
  const service = SERVICES.find((s) => s.id === data.service);
  const formattedDate = data.date
    ? (() => {
        const d = new Date(data.date + "T00:00:00");
        return d.toLocaleDateString("en-ZA", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      })()
    : "";

  const showIndividual = data.service === "standard" || data.service === "airbnb";

  const professionalLabel = (() => {
    if (showIndividual) {
      if (!data.cleanerId) return "Cleaner: To be assigned";
      if (data.cleanerId === "any") return "Cleaner: Any available cleaner";
      const cleaner = cleaners.find((c) => c.id === data.cleanerId);
      return `Cleaner: ${cleaner?.name ?? "To be assigned"}`;
    }
    if (!data.teamId) return "Team: To be assigned";
    if (data.teamId === "any") return "Team: Any available team";
    const team = TEAMS.find((t) => t.id === data.teamId);
    return `Team: ${team?.name ?? "To be assigned"}`;
  })();

  const handleCopyRef = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(bookingRef);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = bookingRef;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error("Failed to copy booking reference", err);
    }
  };

  const handleAddToCalendar = () => {
    if (!data.date || !data.time || !service) return;
    const [hour, minute] = data.time.split(":").map(Number);
    const start = new Date(data.date + "T00:00:00");
    start.setHours(hour || 0, minute || 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const formatForCalendar = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const startStr = formatForCalendar(start);
    const endStr = formatForCalendar(end);

    const title = encodeURIComponent(`${service.title} – Shalean Cleaning`);
    const details = encodeURIComponent(
      `Booking reference: ${bookingRef}\nService: ${service.title}\nAddress: ${data.address}${
        data.apartmentUnit ? `, ${data.apartmentUnit}` : ""
      }`
    );
    const location = encodeURIComponent(data.address);

    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md mx-auto"
      >
        {/* Success header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200"
          >
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.5} />
          </motion.div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5">
            You’re all set!
          </h3>
          <p className="text-slate-500 text-sm">
            Booking confirmed. We’ve sent the details to{" "}
            <span className="font-semibold text-slate-700">{data.email}</span>.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Ref
            </span>
            <span className="font-mono font-bold text-blue-600 text-sm">
              {bookingRef}
            </span>
            <button
              type="button"
              onClick={handleCopyRef}
              className="ml-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Booking summary card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6"
        >
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Booking summary
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                {service?.icon ?? <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  {service?.title ?? "Cleaning"}
                </p>
                {formattedDate && (
                  <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formattedDate}
                    {data.time && (
                      <>
                        <span className="text-slate-300">·</span>
                        <Clock className="w-3.5 h-3.5 inline" />
                        {data.time}
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2 pt-2">
              <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-slate-600 text-sm leading-snug">{professionalLabel}</p>
            </div>
            {data.address && (
              <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
                <Home className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-slate-600 text-sm leading-snug">
                  {data.address}
                  {data.apartmentUnit && `, ${data.apartmentUnit}`}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">Total paid</span>
            <span className="font-black text-slate-900 text-lg">
              R{pricing.total}
            </span>
          </div>
        </motion.div>

        {/* Next steps & actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold text-slate-700">
              What happens next?
            </p>
            <p className="text-[11px] text-slate-500">
              We’ll review your booking and confirm the assigned{" "}
              {showIndividual ? "cleaner" : "team"} within 2 hours. You’ll get an
              email with any updates before your clean.
            </p>
            {data.date && data.time && (
              <button
                type="button"
                onClick={handleAddToCalendar}
                className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                <Calendar className="w-3.5 h-3.5" />
                Add to calendar
              </button>
            )}
          </div>
          <button
            onClick={onBookAnother}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-blue-200/60 transition-colors"
          >
            Book another clean
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

// ─── MAIN BOOKING SYSTEM ───────────────────────────────────────────────────────

export const BookingSystem = ({
  onNavigateContact,
  onStepChange,
}: {
  onNavigateContact?: () => void;
  onStepChange?: (step: number) => void;
}) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BookingFormData, string>>
  >({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [redirectedFromDeepLink, setRedirectedFromDeepLink] = useState(false);
  const [cleaners, setCleaners] = useState<Cleaner[]>(INDIVIDUAL_CLEANERS);

  const pricing = useCalcTotal(data);

  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { pathname, search } = window.location;

    const storedDataRaw = window.localStorage.getItem("bookingFormData");
    const storedStepRaw = window.localStorage.getItem("bookingStep");

    let initialData = DEFAULT_FORM;
    if (storedDataRaw) {
      try {
        const parsed = JSON.parse(storedDataRaw) as BookingFormData;
        initialData = { ...DEFAULT_FORM, ...parsed };
      } catch {
        initialData = DEFAULT_FORM;
      }
    }

    let desiredStep = 1;
    if (pathname.startsWith("/booking")) {
      const parts = pathname.split("/").filter(Boolean);
      const slug = (parts[1] as StepSlug | undefined) ?? STEP_SLUGS[0];
      const index = STEP_SLUGS.indexOf(slug);
      if (index >= 0) {
        desiredStep = index + 1;
      }
    } else if (storedStepRaw) {
      const parsedStep = Number(storedStepRaw);
      if (Number.isFinite(parsedStep) && parsedStep >= 1 && parsedStep <= 5) {
        desiredStep = parsedStep;
      }
    }

    setData(initialData);

    const hasStep1Requirements = !!initialData.workingArea;
    if (desiredStep > 1 && !hasStep1Requirements) {
      setStep(1);
      setRedirectedFromDeepLink(true);
      const path = `/booking/${STEP_SLUGS[0]}`;
      window.history.replaceState(null, "", path + window.location.search);
    } else {
      setStep(desiredStep);
    }

    if (search) {
      const params = new URLSearchParams(search);
      const serviceSlug = params.get("service");
      if (serviceSlug) {
        const id = SERVICE_SLUG_TO_ID[serviceSlug];
        if (id) {
          setData((prev) => ({
            ...prev,
            service: id,
          }));
        }
      }
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const controller = new AbortController();

    const loadCleaners = async () => {
      try {
        const res = await fetch("/api/cleaners", {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as { cleaners?: Cleaner[] };
        if (json.cleaners && Array.isArray(json.cleaners) && json.cleaners.length > 0) {
          setCleaners(json.cleaners);
        }
      } catch {
        // Ignore fetch errors and keep fallback cleaners
      }
    };

    loadCleaners();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("bookingFormData", JSON.stringify(data));
    } catch {
      // ignore write failures
    }
  }, [data]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("bookingStep", String(step));
    } catch {
      // ignore write failures
    }
  }, [step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentStepSlug = getStepSlug(step);
    const path = `/booking/${currentStepSlug}`;

    const params = new URLSearchParams(window.location.search);
    params.delete("service");
    const serviceSlug = SERVICE_TITLE_SLUGS[data.service];
    if (serviceSlug) {
      params.set("service", serviceSlug);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${path}?${queryString}` : path;

    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [step, data.service]);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};
    if (step === 1) {
      if (!data.workingArea) newErrors.workingArea = "Area required";
    }
    if (step === 3) {
      if (!data.name.trim()) newErrors.name = "Name required";
      if (
        !data.email.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
      )
        newErrors.email = "Valid email required";
      if (!data.phone.trim()) {
        newErrors.phone = "Phone required";
      } else {
        const normalizedPhone = data.phone.replace(/\s+/g, "");
        const saPattern = /^(0\d{9}|(\+27|27)\d{9})$/;
        if (!saPattern.test(normalizedPhone)) {
          newErrors.phone = "Enter a valid South African mobile number.";
        }
      }
      if (!data.address.trim()) newErrors.address = "Address required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, data]);

  const canProceed = useCallback((): boolean => {
    if (step === 1) return !!data.workingArea;
    if (step === 2) return !!data.date && !!data.time;
    if (step === 3) {
      const needsIndividual = data.service === "standard" || data.service === "airbnb";
      return (
        (needsIndividual ? !!data.cleanerId : !!data.teamId) &&
        !!data.name &&
        !!data.email &&
        !!data.phone &&
        !!data.address
      );
    }
    return true;
  }, [step, data]);

  const nextStep = useCallback(() => {
    if (!validate()) return;
    if (!canProceed()) return;

    setStep((s) => Math.min(s + 1, 5));

    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [step, validate, canProceed]);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
    setPaymentError("");
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  const handlePaystackPay = useCallback(async () => {
    if (typeof window === "undefined") return;
    setIsProcessing(true);
    setPaymentError("");
    try {
      const res = await fetch("/api/booking/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking: data,
          pricing,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const message =
          (errorData && errorData.error) ||
          "Payment initialization failed. Please try again.";
        setPaymentError(message);
        return;
      }

      const json = (await res.json()) as {
        authorizationUrl: string;
        reference: string;
      };

      if (!json.authorizationUrl || !json.reference) {
        setPaymentError(
          "Unexpected response from payment provider. Please try again."
        );
        return;
      }

      setBookingRef(json.reference);
      window.location.href = json.authorizationUrl;
    } catch {
      setPaymentError("Payment initialization failed. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [data, pricing]);

  return (
    <div className="w-full py-10 font-sans">
      <main className="max-w-7xl mx-auto px-6 w-full pb-24">
        <div aria-live="polite" className="sr-only">
          {`Step ${step}: ${STEP_LABELS[step - 1]}`}
        </div>
        <div className={`grid gap-8 items-start ${step < 5 ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,360px)]" : "max-w-xl mx-auto"}`}>
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
              {redirectedFromDeepLink && step === 1 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  To finish your booking, start with your cleaning plan. We brought you back to Step 1 so you can complete the details above first.
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{
                    opacity: 0,
                    x: 10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -10,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >
                  {step === 1 && <Step1Plan data={data} setData={setData} errors={errors} />}
                  {step === 2 && <Step2Schedule data={data} setData={setData} />}
                  {step === 3 && (
                    <Step3Details
                      data={data}
                      setData={setData}
                      errors={errors}
                      cleaners={cleaners}
                    />
                  )}
                  {step === 4 && (
                    <Step4Payment
                      data={data}
                      setData={setData}
                      pricing={pricing}
                      onPaystackPay={handlePaystackPay}
                      isProcessing={isProcessing}
                      paymentError={paymentError}
                    />
                  )}
                  {step === 5 && (
                    <Step5Confirmation
                      data={data}
                      pricing={pricing}
                      bookingRef={bookingRef}
                      onBookAnother={() => {
                        setStep(1);
                        setData(DEFAULT_FORM);
                        setBookingRef("");
                      }}
                      cleaners={cleaners}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {step < 5 && (
                <div className="flex gap-4 mt-12 pt-8 border-t border-slate-100">
                  {step > 1 && (
                    <button
                      onClick={prevStep}
                      className="flex items-center gap-2 px-6 py-4 border-2 border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all text-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>
                  )}
                  {step < 4 && (
                    <button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    >
                      {`Continue to ${STEP_LABELS[step]}`}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {step < 5 && (
          <aside className="sticky top-6 z-10 self-start space-y-6">
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl">
              <div className="flex items-center gap-2 opacity-60 mb-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Order Summary
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">R{pricing.total}</span>
                <span className="text-xs opacity-40 ml-1">Total Estimate</span>
              </div>

              <div className="mt-6 space-y-3.5">
                <div className="flex justify-between text-[11px] pb-2 border-b border-white/5">
                  <span className="opacity-50">Service</span>
                  <span className="font-bold">
                    {SERVICES.find((s) => s.id === data.service)?.title}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] pb-2 border-b border-white/5">
                  <span className="opacity-50">Frequency</span>
                  <span className="font-bold text-right">
                    {data.cleaningFrequency === "once"
                      ? "Once"
                      : data.cleaningFrequency === "weekly"
                      ? "Weekly"
                      : "Multiple times a week"}
                    {data.cleaningFrequency === "multi_week" &&
                      data.cleaningDays.length > 0 &&
                      ` · ${data.cleaningDays.join(", ")}`}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] pb-2 border-b border-white/5">
                  <span className="opacity-50">Schedule</span>
                  <span className="font-bold text-right">
                    {data.date ? formatDate(data.date) : "Not set"}
                    {data.time && data.date && ` · ${data.time}`}
                  </span>
                </div>
                {data.propertyType === "office" && (
                  <div className="flex justify-between text-[11px] pb-2 border-b border-white/5">
                    <span className="opacity-50">Office details</span>
                    <span className="font-bold text-right">
                      {data.privateOffices} private · {data.meetingRooms} rooms
                      {data.officeSize &&
                        ` · ${
                          data.officeSize === "small"
                            ? "Small"
                            : data.officeSize === "medium"
                            ? "Medium"
                            : data.officeSize === "large"
                            ? "Large"
                            : "XL"
                        }`}
                    </span>
                  </div>
                )}
                {data.service === "carpet" && (
                  <div className="flex justify-between text-[11px] pb-2 border-b border-white/5">
                    <span className="opacity-50">Carpet details</span>
                    <span className="font-bold text-right">
                      {data.carpetedRooms} rooms · {data.looseRugs} rugs ·{" "}
                      {data.carpetExtraCleaners} extra cleaner
                    </span>
                  </div>
                )}
                {data.extras.length > 0 && (
                  <div className="flex justify-between text-[11px] pb-2 border-b border-white/5">
                    <span className="opacity-50">Extras</span>
                    <span className="font-bold">
                      {data.extras.length} items (R{pricing.extrasTotal})
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] pb-2 border-b border-white/5">
                  <span className="opacity-50">Professional</span>
                  <span className="font-bold">
                    {data.cleanerId
                      ? data.cleanerId === "any"
                        ? "Any available cleaner"
                        : cleaners.find((c) => c.id === data.cleanerId)
                            ?.name
                      : data.teamId
                      ? data.teamId === "any"
                        ? "Any available team"
                        : TEAMS.find((t) => t.id === data.teamId)?.name
                      : "TBD"}
                  </span>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="opacity-50">Subtotal</span>
                    <span className="font-medium">R{pricing.subtotal}</span>
                  </div>
                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-400">
                      <span className="opacity-70 text-white">
                        Discount ({data.promoCode})
                      </span>
                      <span className="font-bold">
                        -R{pricing.discountAmount}
                      </span>
                    </div>
                  )}
                  {pricing.tipAmount > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="opacity-50">Tip</span>
                      <span className="font-medium">R{pricing.tipAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 bg-white/10 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed opacity-80">
                  Your booking is protected by our 100% Satisfaction Guarantee.
                  We&apos;ll re-clean for free if you&apos;re not happy.
                </p>
              </div>
            </div>

          </aside>
          )}
        </div>
      </main>

      {step < 5 && step !== 4 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Total Estimate
              </span>
              <span className="text-2xl font-black text-slate-900">
                R{pricing.total}
              </span>
            </div>
            <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
              Step {step} of 4
            </div>
          </div>
          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="p-4 border-2 border-slate-200 rounded-2xl text-slate-600"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingSystem;

