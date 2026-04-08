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
  User,
  MapPin,
  Check,
  Bath,
  Heart,
  Tag,
  Phone,
  Shirt,
  Package,
  Droplets,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { WORKING_AREA_GROUPS, inferWorkingAreaFromAddress } from "@/lib/working-areas";
import { useSession } from "next-auth/react";
import { computeEstimatedDurationMinutes, formatEstimatedDuration } from "@/lib/duration";
import { computeDynamicPricing } from "@/lib/pricing-engine";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

type ServiceType =
  | "standard"
  | "deep"
  | "move"
  | "airbnb"
  | "laundry"
  | "carpet";
type PropertyType = "apartment" | "house" | "office";
type OfficeScale = "small" | "medium" | "large" | "xlarge" | "";
type PaymentMethod = "online";
type CleaningFrequency = "once" | "weekly" | "bi_weekly" | "monthly" | "multi_week";
type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface Extra {
  id: string;
  label: string;
  /** Short line shown on Preferences step cards */
  description?: string;
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
  /** Server-validated promo discount (ZAR), applied at pay */
  appliedPromoDiscount: number;
  discountAmount: number;
  acceptedTerms: boolean;
  /** Supplies: Shalean brings products (+equipment fee from config) vs customer supplies */
  equipmentMode: "shalean" | "customer";
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

type ServiceMultipliers = {
  bedroomAddPer?: number | null;
  bathroomAddPer?: number | null;
  extraRoomAddPer?: number | null;
  officePrivateAddPer?: number | null;
  officeMeetingAddPer?: number | null;
  officeScaleSmall?: number | null;
  officeScaleMedium?: number | null;
  officeScaleLarge?: number | null;
  officeScaleXlarge?: number | null;
  carpetRoomPer?: number | null;
  looseRugPer?: number | null;
  carpetExtraCleanerPer?: number | null;
  /**
   * Optional recurring frequency discounts and per-booking fees,
   * mirrored from ServicePricingConfig so the client-side estimate
   * matches the server-side computation.
   */
  weeklyDiscount?: number | null;
  multiWeekDiscount?: number | null;
  biWeeklyDiscount?: number | null;
  monthlyDiscount?: number | null;
  serviceFee?: number | null;
  equipmentCharge?: number | null;
};

type ServicePricingState = {
  /**
   * Optional base price override per service, sourced from Supabase
   * `pricing_config` when available.
   */
  baseByService: Partial<Record<ServiceType, number>>;
  /**
   * Optional extra price overrides per service and extra id, sourced
   * from Supabase `pricing_config` when available.
   */
  extrasByService: Partial<Record<ServiceType, Record<string, number>>>;
  /**
   * Optional per-unit multipliers per service, mirroring
   * the fields from ServicePricingConfig.
   */
  multipliersByService: Partial<Record<ServiceType, ServiceMultipliers>>;
};

const SERVICES = [
  {
    id: "standard" as ServiceType,
    title: "Standard Cleaning",
    description: "Essential upkeep for your home.",
    price: 250,
    icon: <Sparkles className="w-6 h-6" />,
    color: "blue",
  },
  {
    id: "deep" as ServiceType,
    title: "Deep Cleaning",
    description: "Intensive top-to-bottom clean.",
    price: 1200,
    icon: <Layers className="w-6 h-6" />,
    color: "indigo",
  },
  {
    id: "move" as ServiceType,
    title: "Moving Cleaning",
    description: "Perfect for moving days.",
    price: 980,
    icon: <Truck className="w-6 h-6" />,
    color: "violet",
  },
  {
    id: "airbnb" as ServiceType,
    title: "Airbnb Cleaning",
    description: "Quick guest-ready refresh.",
    price: 230,
    icon: <Calendar className="w-6 h-6" />,
    color: "sky",
  },
  {
    id: "laundry" as ServiceType,
    title: "Laundry & Ironing Cleaning",
    description: "Wash, dry, fold, and press at your home.",
    price: 280,
    icon: <Shirt className="w-6 h-6" />,
    color: "rose",
  },
  {
    id: "carpet" as ServiceType,
    title: "Carpet Cleaning",
    description: "Deep fibre carpet clean.",
    price: 150,
    icon: <LayoutGrid className="w-6 h-6" />,
    color: "teal",
  },
];

const STANDARD_EXTRAS: Extra[] = [
  {
    id: "fridge",
    label: "Inside fridge",
    description: "Full interior clean and deodorize",
    price: 30,
    icon: <Refrigerator className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "oven",
    label: "Inside oven",
    description: "Racks, door, and interior degrease",
    price: 30,
    icon: <Microwave className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "windows",
    label: "Interior windows",
    description: "Streak-free glass and tracks",
    price: 40,
    icon: <AppWindow className="w-5 h-5" />,
  },
  {
    id: "cabinets",
    label: "Inside cabinets",
    description: "Shelves, hinges, and doors",
    price: 30,
    icon: <Archive className="w-5 h-5" />,
  },
  {
    id: "walls",
    label: "Interior walls",
    description: "Spot marks and light scuffs",
    price: 35,
    icon: <BrickWall className="w-5 h-5" />,
  },
  {
    id: "laundry_load",
    label: "Laundry (per load)",
    description: "Wash, dry & fold — per machine load",
    price: 85,
    icon: <Package className="w-5 h-5" />,
  },
  {
    id: "ironing",
    label: "Ironing (per item)",
    description: "Shirts, trousers, and linen",
    price: 28,
    icon: <Shirt className="w-5 h-5" />,
  },
  {
    id: "extra_cleaner",
    label: "Extra cleaner",
    description: "Additional pro on the day",
    price: 350,
    icon: <User className="w-5 h-5" />,
    recommended: true,
  },
];

const DEEP_MOVE_EXTRAS: Extra[] = [
  {
    id: "balcony",
    label: "Balcony cleaning",
    description: "Floors, rails, and glass",
    price: 250,
    icon: <Sun className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "carpet_deep",
    label: "Carpet cleaning",
    description: "Deep fibre treatment",
    price: 300,
    icon: <LayoutGrid className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "ceiling",
    label: "Ceiling cleaning",
    description: "Cobwebs, vents, and dust",
    price: 300,
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "couch",
    label: "Couch cleaning",
    description: "Fabric refresh and vacuum",
    price: 130,
    icon: <Sofa className="w-5 h-5" />,
  },
  {
    id: "garage",
    label: "Garage cleaning",
    description: "Sweep, dust, and tidy",
    price: 110,
    icon: <CarFront className="w-5 h-5" />,
  },
  {
    id: "mattress",
    label: "Mattress cleaning",
    description: "Sanitise and deodorise",
    price: 350,
    icon: <Bed className="w-5 h-5" />,
  },
  {
    id: "outside_windows",
    label: "Exterior windows",
    description: "Reach-and-wash where safe",
    price: 125,
    icon: <Maximize2 className="w-5 h-5" />,
  },
];

/** Airbnb hosts: turnover-focused add-ons plus shared home extras. */
const AIRBNB_EXTRAS: Extra[] = [
  {
    id: "linen_refresh",
    label: "Full linen change",
    description: "Beds stripped and fresh linen",
    price: 95,
    icon: <Bed className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "guest_supplies",
    label: "Guest supplies restock",
    description: "Toiletries, tea & coffee basics",
    price: 45,
    icon: <Heart className="w-5 h-5" />,
  },
  {
    id: "fridge",
    label: "Inside fridge",
    description: "Full interior clean and deodorize",
    price: 30,
    icon: <Refrigerator className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "oven",
    label: "Inside oven",
    description: "Racks, door, and interior degrease",
    price: 30,
    icon: <Microwave className="w-5 h-5" />,
  },
  {
    id: "windows",
    label: "Interior windows",
    description: "Streak-free glass and tracks",
    price: 40,
    icon: <AppWindow className="w-5 h-5" />,
  },
  {
    id: "cabinets",
    label: "Inside cabinets",
    description: "Shelves, hinges, and doors",
    price: 30,
    icon: <Archive className="w-5 h-5" />,
  },
  {
    id: "walls",
    label: "Interior walls",
    description: "Spot marks and light scuffs",
    price: 35,
    icon: <BrickWall className="w-5 h-5" />,
  },
  {
    id: "laundry_load",
    label: "Laundry (per load)",
    description: "Wash, dry & fold — per machine load",
    price: 85,
    icon: <Package className="w-5 h-5" />,
  },
  {
    id: "ironing",
    label: "Ironing (per item)",
    description: "Shirts, trousers, and linen",
    price: 28,
    icon: <Shirt className="w-5 h-5" />,
  },
  {
    id: "extra_cleaner",
    label: "Extra cleaner",
    description: "Additional pro on the day",
    price: 350,
    icon: <User className="w-5 h-5" />,
    recommended: true,
  },
];

/** Standalone Laundry & Ironing service — step 2 focuses on fabric care only. */
const LAUNDRY_IRONING_EXTRAS: Extra[] = [
  {
    id: "laundry_load",
    label: "Wash & fold (per load)",
    description: "Machine wash, dry, and fold",
    price: 85,
    icon: <Package className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "ironing",
    label: "Ironing (per item)",
    description: "Pressed shirts, trousers, linen",
    price: 28,
    icon: <Shirt className="w-5 h-5" />,
    recommended: true,
  },
  {
    id: "delicates",
    label: "Delicates (per item)",
    description: "Hand wash or gentle cycle",
    price: 45,
    icon: <Droplets className="w-5 h-5" />,
  },
  {
    id: "stain_treatment",
    label: "Stain treatment",
    description: "Pre-treat spots before wash",
    price: 55,
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "extra_cleaner",
    label: "Extra cleaner",
    description: "Additional pro on the day",
    price: 350,
    icon: <User className="w-5 h-5" />,
  },
];

const QUANTITY_ENABLED_EXTRAS = new Set([
  "carpet_deep",
  "ceiling",
  "couch",
  "garage",
  "mattress",
  "outside_windows",
  "laundry_load",
  "ironing",
  "linen_refresh",
  "delicates",
]);

const getExtrasForService = (service: ServiceType): Extra[] => {
  if (service === "deep" || service === "move") {
    return DEEP_MOVE_EXTRAS;
  }
  if (service === "airbnb") {
    return AIRBNB_EXTRAS;
  }
  if (service === "laundry") {
    return LAUNDRY_IRONING_EXTRAS;
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
    workingAreas: ["Sea Point", "Gardens", "Vredehoek", "Observatory"],
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
    workingAreas: ["Durbanville", "Bellville", "Table View", "Century City"],
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
    workingAreas: ["Sea Point", "Green Point", "Gardens", "Observatory"],
    unavailableDates: [],
  },
  {
    id: "t2",
    name: "Team B — Speed Force",
    size: 4,
    experience: "Expert Level",
    availability: "medium",
    speciality: "Large property experts",
    workingAreas: ["Claremont", "Kenilworth", "Constantia", "Table View", "Century City"],
    unavailableDates: [],
  },
  {
    id: "t3",
    name: "Team C — Elite Clean",
    size: 2,
    experience: "Specialist Level",
    availability: "high",
    speciality: "Compact & fast turnaround",
    workingAreas: ["Vredehoek", "Gardens", "Sea Point", "Observatory"],
    unavailableDates: [],
  },
];

const TIME_SLOTS = ["08:00", "10:00", "13:00", "15:00"];
const DAYS_AHEAD = 90;

/** Icon chips — blue primary + teal accent only (matches marketing HOME palette). */
const SERVICE_DROPDOWN_ICON_WRAP: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  indigo: "bg-blue-100 text-blue-800",
  violet: "bg-teal-50 text-teal-600",
  sky: "bg-sky-50 text-sky-700",
  teal: "bg-teal-50 text-teal-700",
  rose: "bg-teal-100 text-teal-800",
};

const TOTAL_STEPS = 6;

const STEP_LABELS = [
  "Service & home",
  "Preferences",
  "Schedule",
  "Cleaner & team",
  "Your details",
  "Payment",
];

const STEP_SLUGS = [
  "your-cleaning-plan",
  "preferences",
  "schedule",
  "cleaner",
  "your-details",
  "checkout",
] as const;

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
  appliedPromoDiscount: 0,
  discountAmount: 0,
  acceptedTerms: false,
  equipmentMode: "shalean",
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

/** Value for `?service=` — matches keys in SERVICE_SLUG_TO_ID (e.g. standard → standard-cleaning). */
export function getBookingServiceUrlSlug(serviceId: string): string | undefined {
  if (serviceId in SERVICE_TITLE_SLUGS) {
    return SERVICE_TITLE_SLUGS[serviceId as ServiceType];
  }
  return undefined;
}

function getStepSlug(step: number): StepSlug {
  const index = Math.max(1, Math.min(STEP_SLUGS.length, step)) - 1;
  return STEP_SLUGS[index];
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function getDatesForMonth(): string[] {
  const today = new Date();
  const dates: string[] = [];

  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatLocalDate(d));
  }

  return dates;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD in local calendar (avoids UTC off-by-one with plain parseISO). */
function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date();
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

/** "HH:mm" slot string → readable label (e.g. 8:30 am). */
function formatTimeSlotLabel(slot: string): string {
  const parts = slot.split(":");
  if (parts.length < 2) return slot;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return slot;
  return format(new Date(2000, 0, 1, h, m), "h:mm a");
}

/**
 * Groups a list of dates (from today onward) into month blocks for mobile.
 * Block 0: current month from today to last day.
 * Block 1,2,...: full calendar months (1st to last day).
 * Returns up to 5 blocks. Used so mobile can show first 3 months then "next 2" on arrow.
 */
function getMonthBlocksFromDates(dates: string[]): string[][] {
  if (dates.length === 0) return [];
  const blocks: string[][] = [];
  let currentBlock: string[] = [];
  let lastMonth = -1;
  let lastYear = -1;

  for (const dateStr of dates) {
    const d = new Date(dateStr + "T00:00:00");
    const month = d.getMonth();
    const year = d.getFullYear();

    if (lastMonth !== -1 && (month !== lastMonth || year !== lastYear)) {
      blocks.push(currentBlock);
      currentBlock = [];
    }
    currentBlock.push(dateStr);
    lastMonth = month;
    lastYear = year;
  }
  if (currentBlock.length) blocks.push(currentBlock);
  return blocks;
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
  data: BookingFormData,
  overrides: {
    basePriceOverride?: number | null;
    extrasOverride?: Record<string, number> | null;
    multipliersOverride?: ServiceMultipliers | null;
    /**
     * Indicates that we have successfully loaded pricing configuration
     * for the current service from the backend. When false, we treat
     * all numeric values as zero so the UI shows a neutral estimate
     * and the payment step can be blocked until real pricing arrives.
     */
    pricingReady: boolean;
  }
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
  peakCharge: number;
  weekendCharge: number;
  areaMultiplier: number;
  afterAreaSubtotal: number;
  subtotal: number;
  total: number;
  estimatedDurationMinutes: number;
} {
  return useMemo(() => {
    const pricingReady = overrides.pricingReady;

    const serviceMeta = SERVICES.find((s) => s.id === data.service);
    const basePrice = pricingReady
      ? overrides.basePriceOverride ?? (serviceMeta?.price ?? 0)
      : serviceMeta?.price ?? 0;

    const multipliers = overrides.multipliersOverride ?? {};

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
      const carpetPer = multipliers.carpetRoomPer ?? 0;
      const rugPer = multipliers.looseRugPer ?? 0;
      const extraCleanerPer = multipliers.carpetExtraCleanerPer ?? 0;

      carpetRoomsAdd = data.carpetedRooms * carpetPer;
      looseRugsAdd = data.looseRugs * rugPer;
      carpetExtraCleanerAdd = data.carpetExtraCleaners * extraCleanerPer;
    } else {
      const bedroomPer = multipliers.bedroomAddPer ?? 0;
      const bathroomPer = multipliers.bathroomAddPer ?? 0;
      const extraRoomPer = multipliers.extraRoomAddPer ?? 0;

      bedroomAdd = Math.max(0, data.bedrooms - 1) * bedroomPer;
      bathroomAdd = Math.max(0, data.bathrooms - 1) * bathroomPer;
      extraRoomsAdd = Math.max(0, data.extraRooms) * extraRoomPer;
      if (data.propertyType === "office") {
        const privatePer = multipliers.officePrivateAddPer ?? 0;
        const meetingPer = multipliers.officeMeetingAddPer ?? 0;

        officePrivateAdd = Math.max(0, data.privateOffices) * privatePer;
        officeMeetingAdd = Math.max(0, data.meetingRooms) * meetingPer;

        if (data.officeSize === "small") {
          officeScaleAdd = multipliers.officeScaleSmall ?? 0;
        } else if (data.officeSize === "medium") {
          officeScaleAdd = multipliers.officeScaleMedium ?? 0;
        } else if (data.officeSize === "large") {
          officeScaleAdd = multipliers.officeScaleLarge ?? 0;
        } else if (data.officeSize === "xlarge") {
          officeScaleAdd = multipliers.officeScaleXlarge ?? 0;
        }
      }
    }

    const extrasForService = getExtrasForService(data.service);
    const extrasPriceMap: Record<string, number> = {};
    for (const extra of extrasForService) {
      const overridePrice = overrides.extrasOverride?.[extra.id];
      extrasPriceMap[extra.id] =
        overridePrice != null ? overridePrice : extra.price;
    }

    const extrasTotal = data.extras.reduce((sum, id) => {
      const price = extrasPriceMap[id] ?? 0;
      return sum + price;
    }, 0);

    const tipAmount = data.tipAmount;
    const serviceFee = multipliers.serviceFee ?? 0;
    const equipmentCharge =
      data.equipmentMode === "customer"
        ? 0
        : multipliers.equipmentCharge ?? 0;

    const lineSubtotal =
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
      extrasTotal +
      serviceFee +
      equipmentCharge;

    const dyn = computeDynamicPricing({
      lineSubtotal,
      cleaningFrequency: data.cleaningFrequency,
      weeklyDiscount: multipliers.weeklyDiscount,
      multiWeekDiscount: multipliers.multiWeekDiscount,
      biWeeklyDiscount: multipliers.biWeeklyDiscount,
      monthlyDiscount: multipliers.monthlyDiscount,
      date: data.date,
      time: data.time,
      workingArea: data.workingArea,
      promoDiscountAmount: data.appliedPromoDiscount ?? 0,
      tipAmount,
    });

    const estimatedDurationMinutes = computeEstimatedDurationMinutes({
      service: data.service,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      extraRooms: data.extraRooms,
      propertyType: data.propertyType,
      officeSize: data.officeSize,
      privateOffices: data.privateOffices,
      meetingRooms: data.meetingRooms,
      carpetedRooms: data.carpetedRooms,
      looseRugs: data.looseRugs,
      carpetExtraCleaners: data.carpetExtraCleaners,
      extras: data.extras,
    });

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
      discountAmount: dyn.discountAmount,
      peakCharge: dyn.peakCharge,
      weekendCharge: dyn.weekendCharge,
      areaMultiplier: dyn.areaMultiplier,
      afterAreaSubtotal: dyn.afterAreaSubtotal,
      subtotal: lineSubtotal,
      total: dyn.total,
      estimatedDurationMinutes,
    };
  }, [data, overrides]);
}

// ─── SHARED UI COMPONENTS ──────────────────────────────────────────────────────

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

const Step1CounterRow = ({
  icon,
  label,
  sub,
  value,
  onChange,
  min = 0,
  max = 10,
  layout = "row",
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  /** `column`: stacked label + controls for horizontal grid (e.g. home size). */
  layout?: "row" | "column";
}) => {
  const safeMin = min ?? 0;
  const safeMax = max ?? 999;
  const safeValue = Number.isFinite(value) ? value : safeMin;

  const controls = (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(safeMin, safeValue - 1))}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 active:scale-[0.98] transition-colors"
        aria-label={`Decrease ${label}`}
      >
        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-700" />
      </button>
      <span className="w-6 sm:w-7 text-center text-base font-bold text-neutral-900 tabular-nums">
        {safeValue}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(safeMax, safeValue + 1))}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 active:scale-[0.98] transition-colors"
        aria-label={`Increase ${label}`}
      >
        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-700" />
      </button>
    </div>
  );

  if (layout === "column") {
    return (
      <div className="flex flex-col items-center gap-2.5 sm:gap-3 py-3 sm:py-4 px-1 sm:px-2 min-w-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
          {icon}
        </div>
        <div className="text-center min-w-0 w-full">
          <p className="font-semibold text-neutral-900 text-xs sm:text-sm leading-tight">
            {label}
          </p>
          {sub && (
            <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 line-clamp-2">
              {sub}
            </p>
          )}
        </div>
        {controls}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-neutral-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900 text-sm">{label}</p>
          {sub && <p className="text-xs text-neutral-500">{sub}</p>}
        </div>
      </div>
      {controls}
    </div>
  );
};

// ─── STEP 1: PLAN (Service + Property + Area) ───────────────────────────────

const Step1Plan = ({
  data,
  setData,
  errors = {},
  pricingState,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  errors?: Partial<Record<keyof BookingFormData, string>>;
  pricingState: ServicePricingState;
}) => {
  const [serviceOpen, setServiceOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);

  const mult = pricingState.multipliersByService[data.service] ?? {};
  const overridesForExtras = pricingState.extrasByService[data.service] ?? {};
  const extraCleanerMeta = STANDARD_EXTRAS.find((e) => e.id === "extra_cleaner");
  const extraCleanerDisplayPrice =
    overridesForExtras.extra_cleaner ?? extraCleanerMeta?.price ?? 0;
  const isHomeStyleService =
    data.service === "standard" ||
    data.service === "airbnb" ||
    data.service === "laundry";
  const hasHomeExtraCleaner = data.extras.includes("extra_cleaner");
  const weeklyPct = Math.round((mult.weeklyDiscount ?? 0.2) * 100);
  const biPct = Math.round((mult.biWeeklyDiscount ?? 0.15) * 100);
  const monthlyPct = Math.round((mult.monthlyDiscount ?? 0.1) * 100);
  const multiWeekPct = Math.round((mult.multiWeekDiscount ?? 0.15) * 100);

  /** Deep, move-in/out, and carpet cleans are one-off or longer cadence only — no weekly/bi-weekly. */
  const weeklyBiWeeklyDisabledForService =
    data.service === "deep" || data.service === "move" || data.service === "carpet";

  useEffect(() => {
    if (!weeklyBiWeeklyDisabledForService) return;
    setData((prev) => {
      if (prev.cleaningFrequency !== "weekly" && prev.cleaningFrequency !== "bi_weekly") {
        return prev;
      }
      return { ...prev, cleaningFrequency: "once", cleaningDays: [] };
    });
  }, [weeklyBiWeeklyDisabledForService, setData]);

  const selectedService = SERVICES.find((s) => s.id === data.service) ?? SERVICES[0];

  const applyService = (id: ServiceType) => {
    setData((prev) => {
      const isHomeService = prev.propertyType !== "office" && id !== "carpet";
      const isServiceChange = prev.service !== id;
      return {
        ...prev,
        service: id,
        cleanerId: "",
        teamId: "",
        ...(isHomeService && isServiceChange ? { bedrooms: 2, bathrooms: 1, extraRooms: 0 } : {}),
      };
    });
    setServiceOpen(false);
  };

  const applyArea = (area: string) => {
    setData((prev) => ({
      ...prev,
      workingArea: area,
      cleanerId: "",
      teamId: "",
    }));
    setAreaOpen(false);
  };

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">
          Book your clean
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Complete your booking
        </h2>
        <div className="mt-8">
          <h3 className="text-base font-bold text-neutral-900">Service & home size</h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-xl">
            Choose your service, where you are, and how we should equip the clean.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Service
          </span>
          <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-expanded={serviceOpen}
                aria-haspopup="listbox"
                className="relative w-full h-12 flex items-center gap-3 pl-3 pr-10 rounded-xl border border-neutral-200 bg-white text-left text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-neutral-400 transition-shadow"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    SERVICE_DROPDOWN_ICON_WRAP[selectedService.color] ?? "bg-neutral-100 text-neutral-700",
                  )}
                >
                  {React.cloneElement(selectedService.icon as React.ReactElement, {
                    className: "w-5 h-5",
                  })}
                </span>
                <span className="min-w-0 flex-1 truncate">{selectedService.title}</span>
                <ChevronDown
                  className={cn(
                    "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 shrink-0 transition-transform",
                    serviceOpen && "rotate-180",
                  )}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={6}
              className="p-2 w-[min(calc(100vw-1.5rem),22rem)] max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-neutral-200 shadow-lg"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Choose a service
              </p>
              <ul role="listbox" className="space-y-1">
                {SERVICES.map((s) => {
                  const base = pricingState.baseByService[s.id] ?? s.price;
                  const active = data.service === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => applyService(s.id)}
                        className={cn(
                          "w-full flex gap-3 rounded-lg px-2 py-2.5 text-left transition-colors",
                          active
                            ? "bg-blue-50 ring-1 ring-blue-200/80"
                            : "hover:bg-neutral-50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            SERVICE_DROPDOWN_ICON_WRAP[s.color] ?? "bg-neutral-100 text-neutral-700",
                          )}
                        >
                          {React.cloneElement(s.icon as React.ReactElement, {
                            className: "w-5 h-5",
                          })}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-neutral-900 text-sm leading-snug">
                            {s.title}
                          </span>
                          <span className="block text-xs text-neutral-500 mt-0.5 leading-snug">
                            {s.description}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-neutral-600 self-center">
                          From R{base}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Area
          </span>
          <Popover open={areaOpen} onOpenChange={setAreaOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-expanded={areaOpen}
                aria-haspopup="listbox"
                className={cn(
                  "relative w-full h-12 flex items-center gap-3 pl-10 pr-10 rounded-xl border bg-white text-left text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-shadow",
                  errors.workingArea ? "border-red-400 bg-red-50" : "border-neutral-200 focus:border-neutral-400",
                  !data.workingArea && "text-neutral-500",
                )}
              >
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="min-w-0 flex-1 truncate">
                  {data.workingArea || "Select an area"}
                </span>
                <ChevronDown
                  className={cn(
                    "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 shrink-0 transition-transform",
                    areaOpen && "rotate-180",
                  )}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={6}
              className="p-2 w-[min(calc(100vw-1.5rem),22rem)] max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-neutral-200 shadow-lg"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Where should we come?
              </p>
              <div className="space-y-4">
                {WORKING_AREA_GROUPS.map((group) => (
                  <div key={group.label} role="group" aria-label={group.label}>
                    <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      {group.label}
                    </p>
                    <ul className="space-y-0.5">
                      {group.areas.map((area) => {
                        const active = data.workingArea === area;
                        return (
                          <li key={area}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={active}
                              onClick={() => applyArea(area)}
                              className={cn(
                                "w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors",
                                active
                                  ? "bg-blue-50 text-blue-900 ring-1 ring-blue-200/80"
                                  : "text-neutral-800 hover:bg-neutral-50",
                              )}
                            >
                              <MapPin className="w-4 h-4 shrink-0 text-neutral-400" />
                              <span className="min-w-0 flex-1">{area}</span>
                              {active && <Check className="w-4 h-4 shrink-0 text-blue-600" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {errors.workingArea && (
            <p className="text-[10px] text-red-500 mt-1">{errors.workingArea}</p>
          )}
        </div>
      </div>

      <div>
        <span className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
          Address <span className="text-red-500">*</span>
        </span>
        <textarea
          value={data.address}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              address: e.target.value,
            }))
          }
          placeholder="Street, suburb, city, postal code"
          rows={2}
          className={`w-full px-4 py-3 rounded-xl border text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[72px] ${
            errors.address ? "border-red-400 bg-red-50" : "border-neutral-200 bg-white"
          }`}
        />
        {errors.address && (
          <p className="text-[10px] text-red-500 mt-1">{errors.address}</p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Property type
          </span>
          <span
            className="relative group inline-flex items-center"
            aria-label="Property type info"
          >
            <AlertCircle className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 cursor-pointer" />
            <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Home, apartment, or office — we tailor the clean to your space.
            </span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2 rounded-xl bg-neutral-100 p-1.5">
          {[
            { id: "apartment" as const, label: "Apartment", icon: <Building className="w-4 h-4" /> },
            { id: "house" as const, label: "House", icon: <Home className="w-4 h-4" /> },
            { id: "office" as const, label: "Office", icon: <Building2 className="w-4 h-4" /> },
          ].map((item) => {
            const selected = data.propertyType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    propertyType: item.id,
                    officeSize: item.id === "office" ? prev.officeSize : "",
                  }))
                }
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all flex-1 min-w-[100px] sm:flex-none ${
                  selected
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-white/80"
                }`}
              >
                <span className={selected ? "text-white" : "text-neutral-500"}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">

          {/* Office configuration & scale (only for office properties) */}
          {data.propertyType === "office" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 -mt-1 ml-1 mb-1">
                  <FieldLabel>Office Configuration</FieldLabel>
                  <span
                    className="relative group inline-flex items-center"
                    aria-label="Office pricing info"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 cursor-pointer" />
                    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      Pricing for offices is estimated; final quote may vary based on size and configuration.
                    </span>
                  </span>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white grid grid-cols-2 divide-x divide-neutral-100">
                  <Step1CounterRow
                    layout="column"
                    icon={<DoorClosed className="w-5 h-5" />}
                    label="Private offices"
                    sub="Enclosed workspaces"
                    value={data.privateOffices}
                    onChange={(v) =>
                      setData((prev) => ({
                        ...prev,
                        privateOffices: v,
                      }))
                    }
                    min={0}
                    max={20}
                  />
                  <Step1CounterRow
                    layout="column"
                    icon={<Users className="w-5 h-5" />}
                    label="Meeting rooms"
                    sub="Conference spaces"
                    value={data.meetingRooms}
                    onChange={(v) =>
                      setData((prev) => ({
                        ...prev,
                        meetingRooms: v,
                      }))
                    }
                    min={0}
                    max={20}
                  />
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
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${
                          selected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-neutral-500 border border-neutral-200 hover:bg-neutral-50"
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

          {/* Home size — apartment / house only */}
          {(data.service !== "carpet" &&
            (data.propertyType === "apartment" || data.propertyType === "house")) && (
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-3">Home size</h3>
              <div className="rounded-xl border border-neutral-200 bg-white grid grid-cols-3 divide-x divide-neutral-100">
                <Step1CounterRow
                  layout="column"
                  icon={<Bed className="w-5 h-5" />}
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
                <Step1CounterRow
                  layout="column"
                  icon={<Bath className="w-5 h-5" />}
                  label="Bathrooms"
                  sub="Including ensuites"
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
                <Step1CounterRow
                  layout="column"
                  icon={<LayoutGrid className="w-5 h-5" />}
                  label="Extra rooms"
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

      {data.service === "carpet" && (
        <div>
          <h3 className="text-base font-bold text-neutral-900 mb-3">Carpet details</h3>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 sm:px-5">
            <Step1CounterRow
              icon={<LayoutGrid className="w-5 h-5" />}
              label="Rooms"
              sub="Main carpeted areas"
              value={data.carpetedRooms}
              onChange={(v) =>
                setData((prev) => ({ ...prev, carpetedRooms: v }))
              }
              min={0}
              max={20}
            />
            <Step1CounterRow
              icon={<Layers className="w-5 h-5" />}
              label="Loose rugs"
              sub="Rugs and runners"
              value={data.looseRugs}
              onChange={(v) =>
                setData((prev) => ({ ...prev, looseRugs: v }))
              }
              min={0}
              max={20}
            />
            <Step1CounterRow
              icon={<Users className="w-5 h-5" />}
              label="Extra cleaner"
              sub="Additional carpet cleaner"
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

      {/* Equipment + extra cleaner — not shown for Deep, Move-in/out, or Carpet */}
      {isHomeStyleService && (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10"
      >
        <div>
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-3">
            Equipment
          </p>
          <RadioGroup
            value={data.equipmentMode === "shalean" ? "yes" : "no"}
            onValueChange={(v) =>
              setData((prev) => ({
                ...prev,
                equipmentMode: v === "yes" ? "shalean" : "customer",
              }))
            }
            className="flex flex-row gap-2"
          >
            <label
              htmlFor="booking-equipment-yes"
              className="flex flex-1 min-w-0 items-start gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 cursor-pointer transition-colors hover:bg-neutral-50/90 has-[[data-state=checked]]:border-blue-600 has-[[data-state=checked]]:bg-blue-50/80"
            >
              <RadioGroupItem value="yes" id="booking-equipment-yes" className="mt-0.5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-900">Yes</span>
                <span className="block text-xs text-neutral-500 mt-0.5 leading-snug">
                  We bring supplies and eco-certified products
                </span>
              </span>
            </label>
            <label
              htmlFor="booking-equipment-no"
              className="flex flex-1 min-w-0 items-start gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 cursor-pointer transition-colors hover:bg-neutral-50/90 has-[[data-state=checked]]:border-blue-600 has-[[data-state=checked]]:bg-blue-50/80"
            >
              <RadioGroupItem value="no" id="booking-equipment-no" className="mt-0.5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-900">No</span>
                <span className="block text-xs text-neutral-500 mt-0.5 leading-snug">
                  You provide detergents and equipment
                </span>
              </span>
            </label>
          </RadioGroup>
        </div>

        {extraCleanerMeta && (
          <div>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-3">
              Extra cleaner
            </p>
            <RadioGroup
              value={hasHomeExtraCleaner ? "yes" : "no"}
              onValueChange={(v) => {
                setData((prev) => {
                  const without = prev.extras.filter((e) => e !== "extra_cleaner");
                  if (v === "yes") {
                    return { ...prev, extras: [...without, "extra_cleaner"] };
                  }
                  return { ...prev, extras: without };
                });
              }}
              className="flex flex-row gap-2"
            >
              <label
                htmlFor="booking-extra-cleaner-no"
                className="flex flex-1 min-w-0 items-start gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 cursor-pointer transition-colors hover:bg-neutral-50/90 has-[[data-state=checked]]:border-blue-600 has-[[data-state=checked]]:bg-blue-50/80"
              >
                <RadioGroupItem value="no" id="booking-extra-cleaner-no" className="mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">No</span>
                  <span className="block text-xs text-neutral-500 mt-0.5 leading-snug">
                    Base team only
                  </span>
                </span>
              </label>
              <label
                htmlFor="booking-extra-cleaner-yes"
                className="flex flex-1 min-w-0 items-start gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 cursor-pointer transition-colors hover:bg-neutral-50/90 has-[[data-state=checked]]:border-blue-600 has-[[data-state=checked]]:bg-blue-50/80"
              >
                <RadioGroupItem value="yes" id="booking-extra-cleaner-yes" className="mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">Yes</span>
                  <span className="block text-xs text-neutral-500 mt-0.5 leading-snug">
                    {extraCleanerMeta.description}
                    {extraCleanerDisplayPrice > 0 && (
                      <span className="text-neutral-600 font-medium">
                        {" "}
                        (+R{extraCleanerDisplayPrice})
                      </span>
                    )}
                  </span>
                </span>
              </label>
            </RadioGroup>
          </div>
        )}
      </div>
      )}

      <div>
        <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-3">
          Frequency
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {(
            [
              {
                id: "once" as const,
                title: "One-time",
                sub: "Single visit",
                discount: null as string | null,
                popular: false,
              },
              {
                id: "weekly" as const,
                title: "Weekly",
                sub: "Same day each week",
                discount: `${weeklyPct}% off`,
                popular: true,
              },
              {
                id: "bi_weekly" as const,
                title: "Bi-weekly",
                sub: "Every two weeks",
                discount: `${biPct}% off`,
                popular: false,
              },
              {
                id: "monthly" as const,
                title: "Monthly",
                sub: "Once a month",
                discount: `${monthlyPct}% off`,
                popular: false,
              },
              {
                id: "multi_week" as const,
                title: "Custom days",
                sub: "Multiple visits / week",
                discount: multiWeekPct ? `${multiWeekPct}% off` : null,
                popular: false,
              },
            ] as const
          ).map((opt) => {
            const selected = data.cleaningFrequency === opt.id;
            const freqDisabled =
              weeklyBiWeeklyDisabledForService &&
              (opt.id === "weekly" || opt.id === "bi_weekly");
            return (
              <button
                key={opt.id}
                type="button"
                disabled={freqDisabled}
                title={
                  freqDisabled
                    ? "Weekly and bi-weekly are not available for deep, move-in/out, or carpet cleaning."
                    : undefined
                }
                onClick={() => {
                  if (freqDisabled) return;
                  setData((prev) => {
                    if (opt.id === "once") {
                      return {
                        ...prev,
                        cleaningFrequency: "once",
                        cleaningDays: [],
                      };
                    }
                    if (opt.id === "weekly") {
                      return {
                        ...prev,
                        cleaningFrequency: "weekly",
                        cleaningDays:
                          prev.date && prev.date.length > 0
                            ? [getDayOfWeekFromDate(prev.date)]
                            : [],
                      };
                    }
                    if (opt.id === "bi_weekly") {
                      return {
                        ...prev,
                        cleaningFrequency: "bi_weekly",
                        cleaningDays: [],
                      };
                    }
                    if (opt.id === "monthly") {
                      return {
                        ...prev,
                        cleaningFrequency: "monthly",
                        cleaningDays: [],
                      };
                    }
                    return {
                      ...prev,
                      cleaningFrequency: "multi_week",
                    };
                  });
                }}
                className={`relative rounded-xl border px-3 py-3 sm:py-3.5 text-left transition-all ${
                  freqDisabled
                    ? "border-neutral-100 bg-neutral-50 opacity-55 cursor-not-allowed"
                    : selected
                      ? "border-blue-600 bg-blue-600 text-white shadow-md"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                {opt.popular && (
                  <span className="absolute -top-1.5 left-2 rounded-full bg-teal-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white">
                    Popular
                  </span>
                )}
                <span
                  className={`block text-sm font-bold ${
                    selected ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {opt.title}
                </span>
                {opt.discount && (
                  <span
                    className={`mt-0.5 block text-[11px] font-semibold ${
                      selected ? "text-teal-300" : "text-blue-600"
                    }`}
                  >
                    {opt.id === "once" ? "" : opt.discount}
                  </span>
                )}
                <span
                  className={`mt-1 block text-[10px] leading-snug ${
                    selected ? "text-white/70" : "text-neutral-500"
                  }`}
                >
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>

        {data.cleaningFrequency === "multi_week" && (
          <div className="mt-4">
            <p className="text-[11px] text-neutral-500 mb-2">
              Choose which days you&apos;d like your clean. Your first visit date is set in Schedule.
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
                        : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
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
    </div>
  );
};

// ─── STEP 2: PREFERENCES (Add-ons) ────────────────────────────────────────────

function Step2Preferences({
  data,
  setData,
  pricingState,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  pricingState: ServicePricingState;
}) {
  const [quantityModalExtra, setQuantityModalExtra] = useState<Extra | null>(
    null
  );
  const [quantityModalValue, setQuantityModalValue] = useState(1);

  const setExtraQuantity = useCallback(
    (id: string, quantity: number) => {
      const clamped = Math.max(0, Math.min(20, quantity));
      setData((prev) => {
        const withoutId = prev.extras.filter((e) => e !== id);
        if (clamped <= 0) {
          return { ...prev, extras: withoutId };
        }
        return {
          ...prev,
          extras: [...withoutId, ...Array(clamped).fill(id)],
        };
      });
    },
    [setData]
  );

  const overridesForExtras = pricingState.extrasByService[data.service] ?? {};
  const extrasList = getExtrasForService(data.service).filter(
    (e) => e.id !== "extra_cleaner"
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">
          Book your clean
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Complete your booking
        </h2>
        <div className="mt-8">
          <h3 className="text-base font-bold text-neutral-900">Preferences</h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-xl">
            Select any add-on extras for your clean. Skip this step if you only
            need the base service.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {extrasList.map((extra) => {
          const isQuantityEnabled = QUANTITY_ENABLED_EXTRAS.has(extra.id);
          const quantity = data.extras.filter((id) => id === extra.id).length;
          const selected = quantity > 0;
          const displayExtraPrice = overridesForExtras[extra.id] ?? extra.price;

          return (
            <button
              key={extra.id}
              type="button"
              onClick={() => {
                if (isQuantityEnabled) {
                  const currentQty = Math.max(1, quantity || 1);
                  setQuantityModalExtra(extra);
                  setQuantityModalValue(currentQty);
                } else {
                  setData((prev) => ({
                    ...prev,
                    extras: prev.extras.includes(extra.id)
                      ? prev.extras.filter((e) => e !== extra.id)
                      : [...prev.extras, extra.id],
                  }));
                }
              }}
              className={`relative flex w-full text-left items-start gap-3 rounded-xl border p-4 transition-all min-h-[5.5rem] ${
                selected
                  ? "border-blue-600 bg-blue-600 text-white shadow-md ring-1 ring-blue-600/10"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/80"
              }`}
            >
              {extra.recommended && (
                <span
                  className={`absolute -top-2 right-3 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    selected
                      ? "bg-teal-400 text-neutral-900"
                      : "text-teal-900 bg-teal-100"
                  }`}
                >
                  Popular
                </span>
              )}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                  selected ? "bg-white/10 text-teal-300" : "bg-neutral-100 text-neutral-700"
                }`}
              >
                <span className="[&_svg]:h-5 [&_svg]:w-5">{extra.icon}</span>
              </div>
              <div className="min-w-0 flex-1 pr-2">
                <p
                  className={`text-sm font-bold leading-snug ${
                    selected ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {extra.label}
                </p>
                {extra.description && (
                  <p
                    className={`mt-0.5 text-xs leading-relaxed ${
                      selected ? "text-white/75" : "text-neutral-500"
                    }`}
                  >
                    {extra.description}
                  </p>
                )}
                {isQuantityEnabled && selected && quantity > 1 && (
                  <p
                    className={`mt-1.5 text-[11px] font-semibold tabular-nums ${
                      selected ? "text-teal-300" : "text-blue-700"
                    }`}
                  >
                    ×{quantity} · R{displayExtraPrice * quantity}
                  </p>
                )}
              </div>
              <div className="shrink-0 self-center">
                <span
                  className={`text-sm font-black tabular-nums whitespace-nowrap ${
                    selected ? "text-teal-300" : "text-blue-600"
                  }`}
                >
                  +R{displayExtraPrice}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {quantityModalExtra && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div
            className="absolute inset-0"
            onClick={() => setQuantityModalExtra(null)}
            aria-hidden
          />
          <div className="relative z-50 w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {quantityModalExtra.label}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Choose how many you need for this extra.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={() =>
                  setQuantityModalValue((prev) => Math.max(0, prev - 1))
                }
                className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-neutral-400"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-base font-black text-slate-900 w-8 text-center">
                {quantityModalValue}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantityModalValue((prev) => Math.min(20, prev + 1))
                }
                className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-neutral-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Price per unit: R
                {overridesForExtras[quantityModalExtra.id] ??
                  quantityModalExtra.price}
              </span>
              <span className="font-semibold text-slate-700">
                Total: R
                {(overridesForExtras[quantityModalExtra.id] ??
                  quantityModalExtra.price) * Math.max(0, quantityModalValue)}
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuantityModalExtra(null)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (quantityModalExtra) {
                    setExtraQuantity(
                      quantityModalExtra.id,
                      quantityModalValue
                    );
                  }
                  setQuantityModalExtra(null);
                }}
                className="px-4 py-1.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STEP 3: SCHEDULE (date, time, promo) ─────────────────────────────────

type ScheduleTipPreset = "none" | "p10" | "p15" | "p20" | "custom";

function BookingTipBlock({
  data,
  setData,
  pricing,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  pricing: ReturnType<typeof useCalcTotal>;
}) {
  const tipBase = Math.max(
    0,
    pricing.afterAreaSubtotal - pricing.discountAmount
  );

  const [tipPreset, setTipPreset] = useState<ScheduleTipPreset>(() =>
    data.tipAmount > 0 ? "custom" : "none"
  );
  const [customTipInput, setCustomTipInput] = useState(() =>
    data.tipAmount > 0 ? String(data.tipAmount) : ""
  );

  useEffect(() => {
    if (tipPreset === "custom") return;
    if (tipPreset === "none") {
      setData((prev) =>
        prev.tipAmount === 0 ? prev : { ...prev, tipAmount: 0 }
      );
      return;
    }
    const pct =
      tipPreset === "p10" ? 10 : tipPreset === "p15" ? 15 : 20;
    const nextTip = Math.round((tipBase * pct) / 100);
    setData((prev) =>
      prev.tipAmount === nextTip ? prev : { ...prev, tipAmount: nextTip }
    );
  }, [tipBase, tipPreset, setData]);

  return (
    <div className="border-t border-neutral-100 pt-8 space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="w-3.5 h-3.5 text-teal-600" aria-hidden />
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-900">
          Tip for your cleaner
        </span>
      </div>
      <p className="text-[12px] text-neutral-500">
        100% of your tip goes directly to your cleaner. It&apos;s always appreciated.
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "none" as const, label: "No tip" },
            { id: "p10" as const, label: "10%" },
            { id: "p15" as const, label: "15%" },
            { id: "p20" as const, label: "20%" },
          ] as const
        ).map(({ id, label }) => {
          const selected = tipPreset === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTipPreset(id);
                setCustomTipInput("");
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                selected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-neutral-100 text-neutral-600 border-transparent hover:border-neutral-200"
              }`}
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setTipPreset("custom");
            setCustomTipInput(
              data.tipAmount > 0 ? String(data.tipAmount) : ""
            );
          }}
          className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
            tipPreset === "custom"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-neutral-100 text-neutral-600 border-transparent hover:border-neutral-200"
          }`}
        >
          Custom
        </button>
      </div>
      {tipPreset === "custom" && (
        <div className="max-w-xs pt-1">
          <label className="text-[10px] font-medium text-neutral-500 ml-0.5">
            Amount (ZAR)
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
            placeholder="e.g. 75"
            className="mt-1 w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-neutral-400"
          />
        </div>
      )}
    </div>
  );
}

function Step2Schedule({
  data,
  setData,
  pricing,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  pricing: ReturnType<typeof useCalcTotal>;
}) {
  const fallbackSlots = useMemo(() => generateTimeSlots(7, 18, 30), []);
  const [timeSlots, setTimeSlots] = useState<string[]>(fallbackSlots);

  const [availableDates, setAvailableDates] = useState<string[]>(() =>
    getDatesForMonth()
  );

  const [promoInput, setPromoInput] = useState(data.promoCode);
  const [promoMsg, setPromoMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);

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

  useEffect(() => {
    if (!availableDates.length) return;

    setData((prev) => {
      const next = { ...prev };

      if (!next.date || !availableDates.includes(next.date)) {
        next.date = availableDates[0];
      }

      if (!next.time) {
        next.time = "08:00";
      }

      return next;
    });
  }, [availableDates, setData]);

  useEffect(() => {
    if (!data.date) return;
    const ac = new AbortController();
    fetch(
      `/api/booking/available-slots?date=${encodeURIComponent(data.date)}`,
      { signal: ac.signal }
    )
      .then((r) => r.json())
      .then((j: { slots?: string[] }) => {
        if (Array.isArray(j.slots) && j.slots.length > 0) {
          setTimeSlots(j.slots);
        } else {
          setTimeSlots(fallbackSlots);
        }
      })
      .catch(() => setTimeSlots(fallbackSlots));
    return () => ac.abort();
  }, [data.date, fallbackSlots]);

  useEffect(() => {
    if (!timeSlots.length) return;
    setData((prev) => {
      if (prev.time && timeSlots.includes(prev.time)) return prev;
      return { ...prev, time: timeSlots[0] ?? prev.time };
    });
  }, [timeSlots, setData]);

  const applyDateChange = (dateStr: string) => {
    let nextDate = dateStr;
    if (!availableDates.includes(dateStr)) {
      const sorted = [...availableDates].sort();
      const fallback =
        sorted.find((d) => d >= dateStr) ?? sorted[sorted.length - 1];
      nextDate = fallback;
    }
    setData((prev) => ({
      ...prev,
      date: nextDate,
      cleaningDays:
        prev.cleaningFrequency === "weekly"
          ? [getDayOfWeekFromDate(nextDate)]
          : prev.cleaningFrequency === "multi_week" && prev.cleaningDays.length === 0
            ? [getDayOfWeekFromDate(nextDate)]
            : prev.cleaningDays,
    }));
  };

  const applyPromo = async () => {
    const code = promoInput.toUpperCase().trim();
    if (!code) {
      setData((prev) => ({
        ...prev,
        promoCode: "",
        appliedPromoDiscount: 0,
      }));
      setPromoMsg(null);
      return;
    }
    setApplyingPromo(true);
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          serviceType: data.service,
          subtotal: pricing.afterAreaSubtotal,
        }),
      });
      const json = (await res.json()) as {
        valid?: boolean;
        discountAmount?: number;
        reason?: string;
      };
      if (json.valid && json.discountAmount && json.discountAmount > 0) {
        setData((prev) => ({
          ...prev,
          promoCode: code,
          appliedPromoDiscount: json.discountAmount ?? 0,
        }));
        setPromoMsg({
          text: `R${json.discountAmount} discount applied.`,
          type: "success",
        });
      } else {
        setData((prev) => ({
          ...prev,
          promoCode: "",
          appliedPromoDiscount: 0,
        }));
        setPromoMsg({
          text: json.reason || "Invalid or expired promo code.",
          type: "error",
        });
      }
    } catch {
      setPromoMsg({
        text: "Could not validate code. Try again.",
        type: "error",
      });
    } finally {
      setApplyingPromo(false);
    }
  };

  const dateMin = availableDates[0] ?? "";
  const dateMax = availableDates[availableDates.length - 1] ?? "";

  const fieldShell =
    "flex items-center gap-3 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600/40 transition-all";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 mb-2">
          Book your clean
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Complete your booking
        </h2>
        <p className="mt-2 text-sm text-neutral-500 max-w-xl">
          Pick your arrival time and apply any promo codes.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-7 shadow-[0_1px_0_rgba(0,0,0,0.04)] space-y-8">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.14em] text-neutral-900">
            Schedule &amp; payment
          </h3>
          <p className="text-[13px] text-neutral-500 mt-1">
            You can book up to three months in advance.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-5">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Preferred date
            </label>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`${fieldShell} w-full cursor-pointer text-left transition-colors hover:border-neutral-300`}
                  aria-expanded={datePopoverOpen}
                  aria-haspopup="dialog"
                >
                  <Calendar className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                  <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">
                    {data.date
                      ? format(parseLocalDate(data.date), "EEE d MMM yyyy")
                      : "Select date"}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                sideOffset={8}
                collisionPadding={16}
                className="w-auto max-w-[min(calc(100vw-2rem),360px)] border-neutral-200/90 bg-white p-4 shadow-lg"
              >
                <div className="mb-3 space-y-1 text-left">
                  <p className="text-base font-black tracking-tight text-neutral-900">
                    Choose date
                  </p>
                  <p className="text-[13px] font-medium text-neutral-500">
                    You can book up to three months in advance.
                  </p>
                </div>
                <div className="flex justify-center">
                  <DatePickerCalendar
                    mode="single"
                    selected={data.date ? parseLocalDate(data.date) : undefined}
                    onSelect={(d) => {
                      if (d) {
                        applyDateChange(formatLocalDate(d));
                        setDatePopoverOpen(false);
                      }
                    }}
                    defaultMonth={
                      data.date
                        ? parseLocalDate(data.date)
                        : dateMin
                          ? parseLocalDate(dateMin)
                          : undefined
                    }
                    startMonth={dateMin ? parseLocalDate(dateMin) : undefined}
                    endMonth={dateMax ? parseLocalDate(dateMax) : undefined}
                    disabled={
                      dateMin && dateMax
                        ? [
                            { before: parseLocalDate(dateMin) },
                            { after: parseLocalDate(dateMax) },
                          ]
                        : undefined
                    }
                    captionLayout="dropdown"
                    className="w-full max-w-[340px] rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-2"
                    classNames={{
                      selected:
                        "bg-transparent [&_button]:!bg-blue-600 [&_button]:!text-white [&_button:hover]:!bg-blue-700",
                      today:
                        "bg-transparent [&_button]:!bg-teal-100 [&_button]:!text-teal-900 [&_button]:!font-semibold",
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Arrival window
            </label>
            <Popover open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`${fieldShell} w-full cursor-pointer text-left transition-colors hover:border-neutral-300`}
                  aria-expanded={timePopoverOpen}
                  aria-haspopup="dialog"
                >
                  <Clock className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                  <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">
                    {data.time && timeSlots.includes(data.time)
                      ? formatTimeSlotLabel(data.time)
                      : "Select time"}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                sideOffset={8}
                collisionPadding={16}
                className="w-full max-w-[min(calc(100vw-2rem),380px)] border-neutral-200/90 bg-white p-4 shadow-lg"
              >
                <div className="mb-3 space-y-1 text-left">
                  <p className="text-base font-black tracking-tight text-neutral-900">
                    Choose arrival time
                  </p>
                  <p className="text-[13px] font-medium text-neutral-500">
                    Times are in 30-minute steps for your selected day.
                  </p>
                </div>
                {timeSlots.length === 0 ? (
                  <p className="text-sm font-medium text-neutral-500">
                    No slots left for this day. Choose another date.
                  </p>
                ) : (
                  <div
                    role="listbox"
                    aria-label="Arrival time options"
                    className="max-h-[min(320px,50vh)] overflow-y-auto rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-1.5"
                  >
                    <div className="flex flex-col gap-1">
                      {timeSlots.map((slot) => {
                        const selected = data.time === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setData((prev) => ({ ...prev, time: slot }));
                              setTimePopoverOpen(false);
                            }}
                            className={cn(
                              "w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                              selected
                                ? "bg-blue-600 text-white"
                                : "text-neutral-900 hover:bg-white hover:shadow-sm"
                            )}
                          >
                            {formatTimeSlotLabel(slot)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-8 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-900">
            Promo code
          </span>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch max-w-lg">
            <div className={`${fieldShell} flex-1`}>
              <Tag className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Enter promo code"
                className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none uppercase"
              />
            </div>
            <button
              type="button"
              onClick={applyPromo}
              disabled={applyingPromo}
              className="shrink-0 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {applyingPromo ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Apply
            </button>
          </div>
          {promoMsg && (
            <p
              className={`text-xs font-medium flex items-center gap-1.5 ${
                promoMsg.type === "success"
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {promoMsg.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {promoMsg.text}
            </p>
          )}
          {promoMsg?.type === "error" && (
            <a
              href="/promotions"
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              View current offers
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STEP 4: CLEANER & TEAM ────────────────────────────────────────────────────

const CLEANERS_VISIBLE_STEP = 6;

const StepCleanerTeam = ({
  data,
  setData,
  cleaners,
  pricing,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  cleaners: Cleaner[];
  pricing: ReturnType<typeof useCalcTotal>;
}) => {
  const showIndividual =
    data.service === "standard" ||
    data.service === "airbnb" ||
    data.service === "laundry";

  const hasCleanerOrTeamSelection = showIndividual
    ? !!data.cleanerId
    : !!data.teamId;

  const filteredCleaners = useMemo(() => {
    const availableOnDate = (c: Cleaner) =>
      !data.date || !c.unavailableDates.includes(data.date);
    const worksInListedArea = (c: Cleaner) =>
      !data.workingArea ||
      c.workingAreas.length === 0 ||
      c.workingAreas.includes(data.workingArea);

    const byDate = cleaners.filter(availableOnDate);
    const byArea = byDate.filter(worksInListedArea);
    // Many suburbs exist; if no cleaner explicitly lists this area, still show available cleaners.
    return byArea.length > 0 ? byArea : byDate;
  }, [cleaners, data.workingArea, data.date]);

  const sortedCleaners = useMemo(() => {
    return [...filteredCleaners].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });
  }, [filteredCleaners]);

  const cleanersListKey = useMemo(
    () => sortedCleaners.map((c) => c.id).join(","),
    [sortedCleaners]
  );

  const [cleanerVisibleCount, setCleanerVisibleCount] = useState(CLEANERS_VISIBLE_STEP);

  useEffect(() => {
    setCleanerVisibleCount(CLEANERS_VISIBLE_STEP);
  }, [cleanersListKey]);

  const selectedCleanerIndex = useMemo(() => {
    if (!data.cleanerId || data.cleanerId === "any") return -1;
    return sortedCleaners.findIndex((c) => c.id === data.cleanerId);
  }, [sortedCleaners, data.cleanerId]);

  const cleanerDisplayCount = Math.min(
    sortedCleaners.length,
    Math.max(
      cleanerVisibleCount,
      selectedCleanerIndex >= 0 ? selectedCleanerIndex + 1 : 0
    )
  );

  const cleanersToShow = useMemo(
    () => sortedCleaners.slice(0, cleanerDisplayCount),
    [sortedCleaners, cleanerDisplayCount]
  );

  const cleanerShowMoreRemaining = sortedCleaners.length - cleanerDisplayCount;

  const filteredTeams = useMemo(() => {
    const availableOnDate = (t: (typeof TEAMS)[number]) =>
      !data.date || !t.unavailableDates.includes(data.date);
    const worksInListedArea = (t: (typeof TEAMS)[number]) =>
      !data.workingArea ||
      t.workingAreas.length === 0 ||
      t.workingAreas.includes(data.workingArea);

    const byDate = TEAMS.filter(availableOnDate);
    const byArea = byDate.filter(worksInListedArea);
    return byArea.length > 0 ? byArea : byDate;
  }, [data.workingArea, data.date]);

  const cardBase =
    "relative w-full text-left rounded-xl border p-4 transition-all min-h-[5.5rem]";
  const cardSelected =
    "border-blue-600 bg-blue-600 text-white shadow-md ring-1 ring-blue-600/10";
  const cardIdle =
    "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/80";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">
          Book your clean
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Complete your booking
        </h2>
        <div className="mt-8">
          <h3 className="text-base font-bold text-neutral-900">Cleaner &amp; team</h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-xl">
            Pick a preferred cleaner or let us assign the best match for your area and time.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-7 shadow-[0_1px_0_rgba(0,0,0,0.04)] space-y-6">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.14em] text-neutral-900">
            Choose {showIndividual ? "a cleaner" : "a team"}
          </h3>
          <p className="text-[13px] text-neutral-500 mt-1">
            Selection is based on your area and booking date.
          </p>
        </div>

        {showIndividual ? (
          <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedCleaners.length > 0 ? (
              cleanersToShow.map((cleaner) => {
                const selected = data.cleanerId === cleaner.id;
                return (
                  <button
                    key={cleaner.id}
                    type="button"
                    onClick={() =>
                      setData((prev) => ({
                        ...prev,
                        cleanerId: cleaner.id,
                      }))
                    }
                    className={`${cardBase} flex flex-col items-stretch gap-3 ${
                      selected ? cardSelected : cardIdle
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {cleaner.photo ? (
                        <img
                          src={cleaner.photo}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-white/20"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                            selected ? "bg-white/15 text-teal-300" : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 text-left flex-1">
                        <p
                          className={`text-sm font-bold truncate ${
                            selected ? "text-white" : "text-neutral-900"
                          }`}
                        >
                          {cleaner.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star
                            className={`w-3.5 h-3.5 shrink-0 ${
                              selected
                                ? "text-teal-300 fill-teal-300"
                                : "text-teal-400 fill-teal-400"
                            }`}
                          />
                          <span
                            className={`text-[11px] font-bold tabular-nums ${
                              selected ? "text-white/90" : "text-neutral-800"
                            }`}
                          >
                            {cleaner.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="space-y-3 col-span-full">
                <button
                  type="button"
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      cleanerId: "any",
                    }))
                  }
                  className={`${cardBase} ${
                    data.cleanerId === "any" ? cardSelected : cardIdle
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                        data.cleanerId === "any"
                          ? "bg-white/10 text-teal-300"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p
                        className={`text-sm font-bold ${
                          data.cleanerId === "any" ? "text-white" : "text-neutral-900"
                        }`}
                      >
                        Any available cleaner
                      </p>
                      <p
                        className={`mt-1 text-xs leading-relaxed ${
                          data.cleanerId === "any" ? "text-white/75" : "text-neutral-500"
                        }`}
                      >
                        We&apos;ll match you with the best available professional for this
                        area and date.
                      </p>
                    </div>
                  </div>
                </button>
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-3 text-center text-[12px] text-neutral-600">
                  No individual cleaners listed for this exact area/date. You can still choose{" "}
                  <span className="font-semibold text-neutral-900">any available cleaner</span>{" "}
                  above, or go back to Schedule to try another date or area.
                </div>
              </div>
            )}
          </div>
          {sortedCleaners.length > 0 && cleanerShowMoreRemaining > 0 && (
            <button
              type="button"
              onClick={() =>
                setCleanerVisibleCount((n) => n + CLEANERS_VISIBLE_STEP)
              }
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/90 px-4 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100"
            >
              Show {Math.min(cleanerShowMoreRemaining, CLEANERS_VISIBLE_STEP)} more
              {cleanerShowMoreRemaining > CLEANERS_VISIBLE_STEP
                ? ` (${cleanerShowMoreRemaining} left)`
                : ""}
            </button>
          )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => {
                const selected = data.teamId === team.id;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() =>
                      setData((prev) => ({
                        ...prev,
                        teamId: team.id,
                      }))
                    }
                    className={`${cardBase} ${
                      selected ? cardSelected : cardIdle
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                            selected ? "bg-white/10 text-teal-300" : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          <Users className="w-5 h-5" />
                        </div>
                        <span
                          className={`font-bold text-sm truncate ${
                            selected ? "text-white" : "text-neutral-900"
                          }`}
                        >
                          {team.name}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          selected
                            ? "bg-white/15 text-teal-300"
                            : "bg-teal-100 text-teal-800"
                        }`}
                      >
                        {team.availability}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      teamId: "any",
                    }))
                  }
                  className={`${cardBase} ${
                    data.teamId === "any" ? cardSelected : cardIdle
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                        data.teamId === "any"
                          ? "bg-white/10 text-teal-300"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p
                        className={`text-sm font-bold ${
                          data.teamId === "any" ? "text-white" : "text-neutral-900"
                        }`}
                      >
                        Any available team
                      </p>
                      <p
                        className={`mt-1 text-xs leading-relaxed ${
                          data.teamId === "any" ? "text-white/75" : "text-neutral-500"
                        }`}
                      >
                        We&apos;ll assign the best-matched team based on your area and date.
                      </p>
                    </div>
                  </div>
                </button>
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-3 text-center text-[12px] text-neutral-600">
                  No specific teams listed for this exact area/date. Choose{" "}
                  <span className="font-semibold text-neutral-900">any available team</span>{" "}
                  above, or adjust your schedule.
                </div>
              </div>
            )}
          </div>
        )}

        {hasCleanerOrTeamSelection && (
          <BookingTipBlock data={data} setData={setData} pricing={pricing} />
        )}
      </div>
    </div>
  );
};

function localDigitsFromSaPhone(phone: string): string {
  const n = phone.replace(/\s+/g, "");
  if (!n) return "";
  if (n.startsWith("+27")) return n.slice(3).replace(/\D/g, "").slice(0, 9);
  if (n.startsWith("27") && n.length >= 11) return n.slice(2).replace(/\D/g, "").slice(0, 9);
  if (n.startsWith("0")) return n.slice(1).replace(/\D/g, "").slice(0, 9);
  return n.replace(/\D/g, "").slice(0, 9);
}

function formatLocalPhoneDisplay(digits9: string): string {
  const d = digits9.replace(/\D/g, "").slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
}

function saMobileFromLocalDigits(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  if (d.length === 0) return "";
  return `0${d}`;
}

function serviceTitleForSummary(service: ServiceType): string {
  const t = SERVICES.find((s) => s.id === service)?.title ?? "Cleaning";
  return t.replace(/\s+Cleaning\s*$/i, " Clean");
}

// ─── STEP 5: YOUR DETAILS (CONTACT) ────────────────────────────────────────────

const Step4YourDetails = ({
  data,
  setData,
  errors,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  errors: Partial<Record<keyof BookingFormData, string>>;
}) => {
  const localPhone = formatLocalPhoneDisplay(localDigitsFromSaPhone(data.phone));

  const setPhoneFromLocal = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 9);
    setData((prev) => ({
      ...prev,
      phone: saMobileFromLocalDigits(digits),
    }));
  };

  const inputFocus =
    "w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">
          Book your clean
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
          Complete your booking
        </h2>
        <p className="text-sm font-semibold text-neutral-900">Your details</p>
        <p className="text-sm text-neutral-500 mt-1">
          Almost done — just your contact information.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Full name</FieldLabel>
            <input
              type="text"
              autoComplete="name"
              value={data.name}
              onChange={(e) =>
                setData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Jane Smith"
              className={`${inputFocus} ${errors.name ? "border-red-400 bg-red-50" : ""}`}
            />
            {errors.name && (
              <p className="text-[10px] text-red-500 mt-1 ml-1 font-medium">{errors.name}</p>
            )}
          </div>
          <div>
            <FieldLabel required>Email address</FieldLabel>
            <input
              type="email"
              autoComplete="email"
              value={data.email}
              onChange={(e) =>
                setData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="jane@email.com"
              className={`${inputFocus} ${errors.email ? "border-red-400 bg-red-50" : ""}`}
            />
            {errors.email && (
              <p className="text-[10px] text-red-500 mt-1 ml-1 font-medium">{errors.email}</p>
            )}
          </div>
        </div>

        <div>
          <FieldLabel required>Phone number</FieldLabel>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3.5 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-600 shrink-0">
              <Phone className="w-4 h-4 text-neutral-500" aria-hidden />
              <span className="text-sm font-semibold tabular-nums">+27</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={localPhone}
              onChange={(e) => setPhoneFromLocal(e.target.value)}
              placeholder="71 234 5678"
              className={`flex-1 min-w-0 ${inputFocus} ${errors.phone ? "border-red-400 bg-red-50" : ""}`}
              aria-label="Mobile number without country code"
            />
          </div>
          {errors.phone && (
            <p className="text-[10px] text-red-500 mt-1 ml-1 font-medium">{errors.phone}</p>
          )}
        </div>

        <div>
          <FieldLabel>Apartment or unit (optional)</FieldLabel>
          <input
            type="text"
            value={data.apartmentUnit}
            onChange={(e) =>
              setData((prev) => ({ ...prev, apartmentUnit: e.target.value }))
            }
            placeholder="e.g. 12B, Unit 5"
            className={inputFocus}
          />
        </div>

        <div>
          <FieldLabel>Special instructions (optional)</FieldLabel>
          <textarea
            value={data.instructions}
            onChange={(e) =>
              setData((prev) => ({ ...prev, instructions: e.target.value }))
            }
            placeholder="e.g. focus on the kitchen, pet in the home, access code..."
            rows={4}
            className={`${inputFocus} resize-y min-h-[100px]`}
          />
        </div>
      </div>
    </div>
  );
};

// ─── STEP 6: PAYMENT ───────────────────────────────────────────────────────────

const Step5Checkout = ({
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
}) => (
  <div className="space-y-8">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">
        Book your clean
      </p>
      <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
        Complete your booking
      </h2>
      <div className="mt-8">
        <h3 className="text-base font-bold text-neutral-900">Payment</h3>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          We&apos;ll confirm by email and send a receipt after Paystack.
        </p>
      </div>
    </div>

    <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-7 shadow-[0_1px_0_rgba(0,0,0,0.04)] space-y-8">
      <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3.5">
        <CreditCard className="w-5 h-5 text-neutral-700 mt-0.5 shrink-0" />
        <div className="text-left text-xs min-w-0">
          <p className="font-bold text-neutral-900">Pay by card or EFT – secure checkout</p>
          <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
            You&apos;ll be redirected to Paystack to complete payment before your booking is
            confirmed.
          </p>
        </div>
      </div>

      {paymentError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-medium">{paymentError}</p>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-[0.14em] text-neutral-900">
          Terms
        </h4>
        <label className="flex items-start gap-2.5 text-[12px] text-neutral-600 leading-snug">
          <input
            type="checkbox"
            checked={!!data.acceptedTerms}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                acceptedTerms: e.target.checked,
              }))
            }
            className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500/20"
          />
          <span>
            I have read and agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-neutral-900 underline underline-offset-2"
            >
              terms of service
            </a>{" "}
            and{" "}
            <a
              href="/cancellation-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-neutral-900 underline underline-offset-2"
            >
              cancellation policy
            </a>
            .
          </span>
        </label>
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={onPaystackPay}
          disabled={isProcessing || !data.acceptedTerms}
          className="w-full sm:w-auto px-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 text-sm"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          Securely Pay R{pricing.total}
        </button>
        <p className="text-[10px] text-neutral-400 mt-3 ml-0.5 leading-relaxed">
          Line items R{pricing.subtotal}
          {(pricing.peakCharge > 0 || pricing.weekendCharge > 0) && (
            <>
              {" "}
              + Peak/weekend R{pricing.peakCharge + pricing.weekendCharge}
            </>
          )}
          {pricing.areaMultiplier !== 1 && (
            <> × Area {pricing.areaMultiplier}</>
          )}
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
        <p className="text-[10px] text-neutral-400 mt-1 ml-0.5">
          Your payment is processed securely. You&apos;ll receive a confirmation email with all
          booking details.
        </p>
      </div>
    </div>
  </div>
);

// ─── CONFIRMATION (legacy inline — success uses /booking/verify) ──────────────

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

  const showIndividual =
    data.service === "standard" ||
    data.service === "airbnb" ||
    data.service === "laundry";

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

    const title = encodeURIComponent(`${service.title} – Shalean Cleaning Services`);
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
            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200"
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
  const [referralRef, setReferralRef] = useState<string | null>(null);
  const [redirectedFromDeepLink, setRedirectedFromDeepLink] = useState(false);
  const [cleaners, setCleaners] = useState<Cleaner[]>(INDIVIDUAL_CLEANERS);
  const [pricingState, setPricingState] = useState<ServicePricingState>({
    baseByService: {},
    extrasByService: {},
    multipliersByService: {},
  });
  const [pricingReady, setPricingReady] = useState(false);
  const { data: session, status } = useSession();

  const pricing = useCalcTotal(data, {
    basePriceOverride: pricingState.baseByService[data.service] ?? null,
    extrasOverride: pricingState.extrasByService[data.service] ?? null,
    multipliersOverride: pricingState.multipliersByService[data.service] ?? null,
    pricingReady,
  });

  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);

  // When logged-in customer reaches your-details, pull their profile and prefill contact details
  useEffect(() => {
    if (
      step !== 5 ||
      status !== "authenticated" ||
      (session?.user as { role?: string } | undefined)?.role !== "customer"
    ) {
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/customer/profile", {
          signal: controller.signal,
          credentials: "include",
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          profile?: {
            name?: string | null;
            email?: string | null;
            phone?: string | null;
            address_line1?: string | null;
            address_city?: string | null;
            address_region?: string | null;
            address_postal_code?: string | null;
          };
        };
        const profile = json.profile;
        if (!profile) return;
        const addressParts = [
          profile.address_line1,
          profile.address_city,
          profile.address_region,
          profile.address_postal_code,
        ].filter(Boolean) as string[];
        const address = addressParts.length ? addressParts.join(", ") : "";
        setData((prev) => ({
          ...prev,
          ...(profile.name != null && profile.name !== "" && { name: profile.name }),
          ...(profile.email != null && profile.email !== "" && { email: profile.email }),
          ...(profile.phone != null && profile.phone !== "" && { phone: profile.phone }),
          ...(address !== "" && { address }),
        }));
      } catch {
        // ignore (e.g. aborted or network error)
      }
    })();
    return () => controller.abort();
  }, [step, status, session?.user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedDataRaw = window.localStorage.getItem("bookingFormData");

    let initialData = DEFAULT_FORM;
    if (storedDataRaw) {
      try {
        const parsed = JSON.parse(storedDataRaw) as BookingFormData;
        initialData = { ...DEFAULT_FORM, ...parsed };
      } catch {
        initialData = DEFAULT_FORM;
      }
    }

    // Ensure a sensible default schedule on first load:
    // current local calendar date and the 08:00 time slot.
    const todayStr = formatLocalDate(new Date());
    if (!initialData.date) {
      initialData = { ...initialData, date: todayStr };
    }
    if (!initialData.time) {
      initialData = { ...initialData, time: "08:00" };
    }

    const params = new URLSearchParams(window.location.search);
    const serviceSlug = params.get("service");
    if (serviceSlug) {
      const id = SERVICE_SLUG_TO_ID[serviceSlug];
      if (id) {
        initialData = { ...initialData, service: id };
      }
    }
    let addressFromPrefill: string | null = null;
    try {
      const stored = sessionStorage.getItem("shaleanBookingAddressPrefill");
      if (stored?.trim()) {
        addressFromPrefill = stored.trim();
        sessionStorage.removeItem("shaleanBookingAddressPrefill");
      }
    } catch {
      /* ignore */
    }

    const addressParam = addressFromPrefill ?? params.get("address");
    if (addressParam != null && addressParam.trim()) {
      const trimmed = addressParam.trim();
      initialData = { ...initialData, address: trimmed };
      const fromUrl = inferWorkingAreaFromAddress(trimmed);
      if (fromUrl) {
        initialData = { ...initialData, workingArea: fromUrl };
      }
    } else if (!(initialData.workingArea ?? "").trim() && initialData.address.trim()) {
      const fromStored = inferWorkingAreaFromAddress(initialData.address.trim());
      if (fromStored) {
        initialData = { ...initialData, workingArea: fromStored };
      }
    }

    setData(initialData);
    setStep(1);

    const ref = params.get("ref");
    if (ref && typeof ref === "string" && ref.trim()) {
      const trimmed = ref.trim();
      setReferralRef(trimmed);
      try {
        window.localStorage.setItem("bookingReferralRef", trimmed);
      } catch {
        // ignore
      }
    } else {
      try {
        const stored = window.localStorage.getItem("bookingReferralRef");
        if (stored && typeof stored === "string" && stored.trim()) {
          setReferralRef(stored.trim());
        }
      } catch {
        // ignore
      }
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const controller = new AbortController();

    const loadPricingConfig = async () => {
      try {
        setPricingReady(false);
        const res = await fetch(
          `/api/pricing/config?service_type=${encodeURIComponent(
            data.service
          )}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          serviceType: ServiceType;
          basePrice: number | null;
          extras: Record<string, number>;
          multipliers?: ServiceMultipliers;
        };
        setPricingState((prev) => ({
          baseByService: {
            ...prev.baseByService,
            [json.serviceType]:
              json.basePrice != null
                ? json.basePrice
                : prev.baseByService[json.serviceType],
          },
          extrasByService: {
            ...prev.extrasByService,
            [json.serviceType]: json.extras ?? {},
          },
          multipliersByService: {
            ...prev.multipliersByService,
            [json.serviceType]: json.multipliers ?? prev.multipliersByService[json.serviceType],
          },
        }));
        setPricingReady(true);
      } catch {
        // If pricing fails to load, keep pricingReady as false so the UI
        // and payment button can reflect that live pricing is unavailable.
      }
    };

    loadPricingConfig();

    return () => {
      controller.abort();
    };
  }, [data.service]);

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
    params.delete("address");
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
      if (!data.address.trim()) newErrors.address = "Street address required";
    }
    if (step === 5) {
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
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, data]);

  const canProceed = useCallback((): boolean => {
    if (step === 1) return !!data.workingArea && !!data.address.trim();
    if (step === 2) return true;
    if (step === 3) return !!data.date && !!data.time;
    if (step === 4) {
      const needsIndividual =
        data.service === "standard" ||
        data.service === "airbnb" ||
        data.service === "laundry";
      return needsIndividual ? !!data.cleanerId : !!data.teamId;
    }
    if (step === 5) {
      return (
        !!data.name?.trim() &&
        !!data.email?.trim() &&
        !!data.phone?.trim()
      );
    }
    return true;
  }, [step, data]);

  const nextStep = useCallback(() => {
    if (!validate()) return;
    if (!canProceed()) return;

    setStep((s) => Math.min(s + 1, TOTAL_STEPS));

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
    if (!pricingReady) {
      setPaymentError(
        "Live pricing is still loading. Please wait a moment and try again."
      );
      return;
    }
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
          ...(referralRef ? { ref: referralRef } : {}),
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
        pricing?: {
          total: number;
          subtotal: number;
          discountAmount: number;
          tipAmount: number;
        };
      };

      if (!json.authorizationUrl || !json.reference) {
        setPaymentError(
          "Unexpected response from payment provider. Please try again."
        );
        return;
      }

      setBookingRef(json.reference);
      if (json.pricing) {
        // Mirror server-computed pricing into local state so any
        // subsequent displays (e.g. confirmation) reflect the exact
        // amount used for payment.
        setData((prev) => ({
          ...prev,
          tipAmount: json.pricing?.tipAmount ?? prev.tipAmount,
        }));
      }
      try {
        window.localStorage.removeItem("bookingReferralRef");
      } catch {
        // ignore
      }
      window.location.href = json.authorizationUrl;
    } catch {
      setPaymentError("Payment initialization failed. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [data, pricing, pricingReady, referralRef]);

  const summaryLight =
    step === 1 || step === 2 || step === 3 || step === 4 || step === 5;

  const pricingRoomLine =
    pricing.bedroomAdd +
    pricing.bathroomAdd +
    pricing.extraRoomsAdd +
    pricing.officePrivateAdd +
    pricing.officeMeetingAdd +
    pricing.officeScaleAdd +
    pricing.carpetRoomsAdd +
    pricing.looseRugsAdd +
    pricing.carpetExtraCleanerAdd;

  const frequencyLabelForSummary =
    data.cleaningFrequency === "once"
      ? "One-time"
      : data.cleaningFrequency === "weekly"
        ? "Weekly"
        : data.cleaningFrequency === "bi_weekly"
          ? "Bi-weekly"
          : data.cleaningFrequency === "monthly"
            ? "Monthly"
            : data.cleaningFrequency === "multi_week"
              ? "Custom"
              : "One-time";

  const serviceEquipmentFee =
    pricing.subtotal -
    pricing.basePrice -
    pricingRoomLine -
    pricing.extrasTotal;

  /** Supplies choice only applies to Standard & Airbnb (not Deep, Move, or Carpet). */
  const showEquipmentChoice =
    data.service === "standard" ||
    data.service === "airbnb" ||
    data.service === "laundry";

  return (
    <div
      className={`w-full bg-[#EFF6FF] pt-4 pb-4 font-sans ${step === 6 ? "pb-28 lg:pb-4" : ""} min-h-[calc(100vh-3.5rem)]`}
    >
      <main className="max-w-7xl mx-auto px-3 sm:px-6 w-full pb-2">
        <div aria-live="polite" className="sr-only">
          {`Step ${step}: ${STEP_LABELS[step - 1]}`}
        </div>
        <div className="grid gap-8 items-start lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,360px)]">
          <div className="space-y-6">
            <div className={`flex flex-col gap-8 ${summaryLight ? "bg-transparent border-0 shadow-none py-6 sm:py-8 px-0 sm:px-0" : "bg-transparent sm:bg-white rounded-3xl border-0 sm:border sm:border-slate-200 px-0 shadow-sm py-6 sm:p-10"}`}>
              {redirectedFromDeepLink && step === 1 && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
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
                  className="flex-1 pb-0 lg:pb-0"
                >
                  {step === 1 && (
                    <Step1Plan
                      data={data}
                      setData={setData}
                      errors={errors}
                      pricingState={pricingState}
                    />
                  )}
                  {step === 2 && (
                    <Step2Preferences
                      data={data}
                      setData={setData}
                      pricingState={pricingState}
                    />
                  )}
                  {step === 3 && (
                    <Step2Schedule
                      data={data}
                      setData={setData}
                      pricing={pricing}
                    />
                  )}
                  {step === 4 && (
                    <StepCleanerTeam
                      data={data}
                      setData={setData}
                      cleaners={cleaners}
                      pricing={pricing}
                    />
                  )}
                  {step === 5 && (
                    <Step4YourDetails
                      data={data}
                      setData={setData}
                      errors={errors}
                    />
                  )}
                  {step === 6 && (
                    <Step5Checkout
                      data={data}
                      setData={setData}
                      pricing={pricing}
                      onPaystackPay={handlePaystackPay}
                      isProcessing={isProcessing}
                      paymentError={paymentError}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {step <= 6 && (
                <div className="hidden lg:flex flex-col gap-3 pt-4 border-t border-slate-100">
                  <div className="flex gap-4">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex items-center gap-2 px-6 py-4 border-2 border-neutral-200 bg-white text-neutral-900 font-bold rounded-2xl hover:bg-neutral-50 transition-all text-sm"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                      </button>
                    )}
                    {step < 6 && (
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={!canProceed()}
                        className={`flex-1 text-white font-bold py-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all ${
                          summaryLight
                            ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                            : "bg-blue-600 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700"
                        }`}
                      >
                        {step === 5 ? (
                          "Confirm booking"
                        ) : (
                          <>
                            {`Continue to ${STEP_LABELS[step]}`}
                            <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {step === 5 && (
                    <p className="text-center text-[11px] text-neutral-400">
                      No commitment · Cancel anytime · Free rescheduling
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {step <= 6 && (
          <aside className="hidden lg:block sticky top-6 z-10 self-start space-y-6">
            {step === 5 ? (
            <div className="rounded-2xl p-6 bg-white text-neutral-900 border border-neutral-100 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
              <h3 className="text-base font-bold text-neutral-900 mb-4">Order summary</h3>
              <div className="space-y-3 text-[11px]">
                <div className="flex justify-between gap-3">
                  <span className="text-neutral-500 shrink-0">Service</span>
                  <span className="font-semibold text-neutral-900 text-right">
                    {serviceTitleForSummary(data.service)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-neutral-500 shrink-0">Frequency</span>
                  <span className="font-semibold text-neutral-900 text-right">
                    {frequencyLabelForSummary}
                    {data.cleaningFrequency === "multi_week" &&
                      data.cleaningDays.length > 0 &&
                      ` · ${data.cleaningDays.join(", ")}`}
                  </span>
                </div>
                {data.service !== "carpet" && data.propertyType !== "office" && (
                  <>
                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">Bedrooms</span>
                      <span className="font-semibold text-neutral-900">{data.bedrooms}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">Bathrooms</span>
                      <span className="font-semibold text-neutral-900">{data.bathrooms}</span>
                    </div>
                  </>
                )}
                {showEquipmentChoice && (
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Equipment</span>
                    <span className="font-semibold text-neutral-900 text-right">
                      {data.equipmentMode === "shalean"
                        ? "Shalean supplies"
                        : "Your supplies"}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
                  Cost breakdown
                </p>
                <div className="flex justify-between text-[11px] mb-2">
                  <span className="text-neutral-500">Base rate</span>
                  <span className="font-medium tabular-nums">R{pricing.basePrice}</span>
                </div>
                <div className="flex justify-between text-[11px] mb-2 gap-2">
                  <span className="text-neutral-500">
                    {data.service === "carpet"
                      ? "Carpet & rugs"
                      : data.propertyType === "office"
                        ? "Office & rooms"
                        : `Rooms (${data.bedrooms}bd · ${data.bathrooms}ba)`}
                  </span>
                  <span className="font-medium tabular-nums shrink-0">R{pricingRoomLine}</span>
                </div>
                {pricing.extrasTotal > 0 && (
                  <div className="flex justify-between text-[11px] mb-2">
                    <span className="text-neutral-500">Extras</span>
                    <span className="font-medium tabular-nums">R{pricing.extrasTotal}</span>
                  </div>
                )}
                {serviceEquipmentFee > 0 && (
                  <div className="flex justify-between text-[11px] mb-2">
                    <span className="text-neutral-500">Service &amp; equipment</span>
                    <span className="font-medium tabular-nums">R{serviceEquipmentFee}</span>
                  </div>
                )}
                {(pricing.peakCharge > 0 || pricing.weekendCharge > 0) && (
                  <div className="flex justify-between text-[11px] text-blue-800 mb-1">
                    <span>Peak / weekend</span>
                    <span className="font-medium tabular-nums">
                      +R{pricing.peakCharge + pricing.weekendCharge}
                    </span>
                  </div>
                )}
                {pricing.areaMultiplier !== 1 && (
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-neutral-500">Area factor</span>
                    <span className="font-medium">×{pricing.areaMultiplier}</span>
                  </div>
                )}
                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-teal-700 mb-1">
                    <span>
                      Discounts
                      {data.promoCode ? ` (${data.promoCode})` : ""}
                    </span>
                    <span className="font-bold">−R{pricing.discountAmount}</span>
                  </div>
                )}
                {pricing.tipAmount > 0 && (
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-neutral-500">Tip</span>
                    <span className="font-medium">R{pricing.tipAmount}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-end justify-between pt-4 border-t border-neutral-100">
                <span className="text-sm font-bold text-neutral-900">Estimated total</span>
                <span className="text-2xl font-black text-neutral-900 tabular-nums">R{pricing.total}</span>
              </div>
              <p className="text-[10px] text-neutral-500 mt-4 leading-relaxed">
                The price is confirmed after submission. All amounts in South African Rand (ZAR).
              </p>
            </div>
            ) : (
            <div
              className={`rounded-2xl p-6 shadow-xl ${
                summaryLight
                  ? "bg-white text-neutral-900 border border-neutral-100 shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
                  : "bg-slate-900 text-white shadow-2xl rounded-3xl"
              }`}
            >
              <div
                className={`flex items-center gap-2 mb-1 ${summaryLight ? "text-neutral-500" : "opacity-60"}`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Order summary
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-xs font-semibold ${summaryLight ? "text-neutral-500" : "opacity-40"}`}>
                  Estimated total
                </span>
                <span className={`text-4xl font-black ${summaryLight ? "text-neutral-900" : ""}`}>
                  R{pricing.total}
                </span>
              </div>

              <div className="mt-6 space-y-3.5">
                <div
                  className={`flex justify-between text-[11px] pb-2 border-b ${
                    summaryLight ? "border-neutral-100" : "border-white/5"
                  }`}
                >
                  <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Service</span>
                  <span className="font-bold">
                    {SERVICES.find((s) => s.id === data.service)?.title}
                  </span>
                </div>
                {data.service !== "carpet" && data.propertyType !== "office" && (
                  <div
                    className={`flex justify-between text-[11px] pb-2 border-b ${
                      summaryLight ? "border-neutral-100" : "border-white/5"
                    }`}
                  >
                    <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Home details</span>
                    <span className="font-bold text-right">
                      {data.bedrooms} bedroom{data.bedrooms !== 1 ? "s" : ""} ·{" "}
                      {data.bathrooms} bathroom{data.bathrooms !== 1 ? "s" : ""} ·{" "}
                      {data.extraRooms} extra room{data.extraRooms !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <div
                  className={`flex justify-between text-[11px] pb-2 border-b ${
                    summaryLight ? "border-neutral-100" : "border-white/5"
                  }`}
                >
                  <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Frequency</span>
                  <span className="font-bold text-right">
                    {data.cleaningFrequency === "once"
                      ? "Once"
                      : data.cleaningFrequency === "weekly"
                      ? "Weekly"
                      : data.cleaningFrequency === "bi_weekly"
                      ? "Bi-weekly"
                      : data.cleaningFrequency === "monthly"
                      ? "Monthly"
                      : "Custom"}
                    {data.cleaningFrequency === "multi_week" &&
                      data.cleaningDays.length > 0 &&
                      ` · ${data.cleaningDays.join(", ")}`}
                  </span>
                </div>
                {showEquipmentChoice && (
                  <div
                    className={`flex justify-between text-[11px] pb-2 border-b ${
                      summaryLight ? "border-neutral-100" : "border-white/5"
                    }`}
                  >
                    <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Equipment</span>
                    <span className="font-bold text-right">
                      {data.equipmentMode === "shalean"
                        ? "We bring supplies"
                        : "Your supplies"}
                    </span>
                  </div>
                )}
                <div
                  className={`flex justify-between text-[11px] pb-2 border-b ${
                    summaryLight ? "border-neutral-100" : "border-white/5"
                  }`}
                >
                  <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Schedule</span>
                  <span className="font-bold text-right">
                    {data.date ? formatDate(data.date) : "Not set"}
                    {data.time && data.date && ` · ${data.time}`}
                  </span>
                </div>
                <div
                  className={`flex justify-between text-[11px] pb-2 border-b ${
                    summaryLight ? "border-neutral-100" : "border-white/5"
                  }`}
                >
                  <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Estimated duration</span>
                  <span className="font-bold">
                    {formatEstimatedDuration(pricing.estimatedDurationMinutes ?? 210)}
                  </span>
                </div>
                {data.propertyType === "office" && (
                  <div
                    className={`flex justify-between text-[11px] pb-2 border-b ${
                      summaryLight ? "border-neutral-100" : "border-white/5"
                    }`}
                  >
                    <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Office details</span>
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
                  <div
                    className={`flex justify-between text-[11px] pb-2 border-b ${
                      summaryLight ? "border-neutral-100" : "border-white/5"
                    }`}
                  >
                    <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Carpet details</span>
                    <span className="font-bold text-right">
                      {data.carpetedRooms} rooms · {data.looseRugs} rugs ·{" "}
                      {data.carpetExtraCleaners} extra cleaner
                    </span>
                  </div>
                )}
                {data.extras.length > 0 && (
                  <div
                    className={`flex justify-between text-[11px] pb-2 border-b ${
                      summaryLight ? "border-neutral-100" : "border-white/5"
                    }`}
                  >
                    <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Extras</span>
                    <span className="font-bold">
                      {data.extras.length} items (R{pricing.extrasTotal})
                    </span>
                  </div>
                )}
                {(data.cleanerId || data.teamId) && (
                  <div
                    className={`flex justify-between text-[11px] pb-2 border-b ${
                      summaryLight ? "border-neutral-100" : "border-white/5"
                    }`}
                  >
                    <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Professional</span>
                    <span className="font-bold">
                      {data.cleanerId
                        ? data.cleanerId === "any"
                          ? "Any available cleaner"
                          : cleaners.find((c) => c.id === data.cleanerId)?.name
                        : data.teamId === "any"
                        ? "Any available team"
                        : TEAMS.find((t) => t.id === data.teamId)?.name}
                    </span>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
                      summaryLight ? "text-neutral-400" : "text-white/40"
                    }`}
                  >
                    Cost breakdown
                  </p>
                  <div className="flex justify-between text-[11px]">
                    <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Base &amp; rooms</span>
                    <span className="font-medium">R{pricing.subtotal}</span>
                  </div>
                  {(pricing.peakCharge > 0 || pricing.weekendCharge > 0) && (
                    <div
                      className={`flex justify-between text-[11px] ${
                        summaryLight ? "text-blue-800" : "text-blue-200/90"
                      }`}
                    >
                      <span className={summaryLight ? "text-blue-800/80" : "opacity-70"}>Peak / weekend</span>
                      <span className="font-medium">
                        +R{pricing.peakCharge + pricing.weekendCharge}
                      </span>
                    </div>
                  )}
                  {pricing.areaMultiplier !== 1 && (
                    <div className="flex justify-between text-[11px]">
                      <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Area factor</span>
                      <span className="font-medium">×{pricing.areaMultiplier}</span>
                    </div>
                  )}
                  {pricing.discountAmount > 0 && (
                    <div
                      className={`flex justify-between text-[11px] ${
                        summaryLight ? "text-teal-700" : "text-teal-400"
                      }`}
                    >
                      <span className={summaryLight ? "text-teal-800/90" : "opacity-70 text-white"}>
                        Discounts
                        {data.promoCode ? ` (${data.promoCode})` : ""}
                      </span>
                      <span className="font-bold">
                        -R{pricing.discountAmount}
                      </span>
                    </div>
                  )}
                  {pricing.tipAmount > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className={summaryLight ? "text-neutral-500" : "opacity-50"}>Tip</span>
                      <span className="font-medium">R{pricing.tipAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`mt-6 rounded-xl p-4 flex items-start gap-3 ${
                  summaryLight
                    ? "bg-neutral-50 border border-neutral-100"
                    : "bg-white/10"
                }`}
              >
                <ShieldCheck
                  className={`w-5 h-5 flex-shrink-0 ${
                    summaryLight ? "text-blue-600" : "text-teal-400"
                  }`}
                />
                <p
                  className={`text-[10px] leading-relaxed ${
                    summaryLight ? "text-neutral-600" : "opacity-80"
                  }`}
                >
                  Final price is confirmed before payment. All amounts in South African Rand (ZAR).
                </p>
              </div>
            </div>
            )}

          </aside>
          )}
        </div>
      </main>

      {step <= 5 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 pb-8">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex-1 flex flex-col text-left focus:outline-none"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Estimate
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    R{pricing.total}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold mt-1">
                    View order summary
                  </span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>Order Summary</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 text-sm">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">R{pricing.total}</span>
                    <span className="text-xs opacity-60 ml-1">Total Estimate</span>
                  </div>

                  <div className="mt-4 space-y-3.5 text-[11px]">
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="opacity-60">Service</span>
                      <span className="font-bold">
                        {SERVICES.find((s) => s.id === data.service)?.title}
                      </span>
                    </div>
                    {data.service !== "carpet" && data.propertyType !== "office" && (
                      <div className="flex justify-between pb-2 border-b border-slate-200">
                        <span className="opacity-60">Home details</span>
                        <span className="font-bold text-right">
                          {data.bedrooms} bedroom{data.bedrooms !== 1 ? "s" : ""} ·{" "}
                          {data.bathrooms} bathroom{data.bathrooms !== 1 ? "s" : ""} ·{" "}
                          {data.extraRooms} extra room{data.extraRooms !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="opacity-60">Frequency</span>
                      <span className="font-bold text-right">
                        {data.cleaningFrequency === "once"
                          ? "Once"
                          : data.cleaningFrequency === "weekly"
                          ? "Weekly"
                          : data.cleaningFrequency === "bi_weekly"
                          ? "Bi-weekly"
                          : data.cleaningFrequency === "monthly"
                          ? "Monthly"
                          : "Custom"}
                        {data.cleaningFrequency === "multi_week" &&
                          data.cleaningDays.length > 0 &&
                          ` · ${data.cleaningDays.join(", ")}`}
                      </span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="opacity-60">Schedule</span>
                      <span className="font-bold text-right">
                        {data.date ? formatDate(data.date) : "Not set"}
                        {data.time && data.date && ` · ${data.time}`}
                      </span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="opacity-60">Estimated duration</span>
                      <span className="font-bold">
                        {formatEstimatedDuration(pricing.estimatedDurationMinutes ?? 210)}
                      </span>
                    </div>
                    {data.propertyType === "office" && (
                      <div className="flex justify-between pb-2 border-b border-slate-200">
                        <span className="opacity-60">Office details</span>
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
                      <div className="flex justify-between pb-2 border-b border-slate-200">
                        <span className="opacity-60">Carpet details</span>
                        <span className="font-bold text-right">
                          {data.carpetedRooms} rooms · {data.looseRugs} rugs ·{" "}
                          {data.carpetExtraCleaners} extra cleaner
                        </span>
                      </div>
                    )}
                    {data.extras.length > 0 && (
                      <div className="flex justify-between pb-2 border-b border-slate-200">
                        <span className="opacity-60">Extras</span>
                        <span className="font-bold">
                          {data.extras.length} items (R{pricing.extrasTotal})
                        </span>
                      </div>
                    )}
                    {(data.cleanerId || data.teamId) && (
                      <div className="flex justify-between pb-2 border-b border-slate-200">
                        <span className="opacity-60">Professional</span>
                        <span className="font-bold">
                          {data.cleanerId
                            ? data.cleanerId === "any"
                              ? "Any available cleaner"
                              : cleaners.find((c) => c.id === data.cleanerId)?.name
                            : data.teamId === "any"
                            ? "Any available team"
                            : TEAMS.find((t) => t.id === data.teamId)?.name}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="opacity-60">Subtotal</span>
                        <span className="font-medium">R{pricing.subtotal}</span>
                      </div>
                      {pricing.discountAmount > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span className="opacity-80">
                            Discounts
                            {data.promoCode ? ` (${data.promoCode})` : ""}
                          </span>
                          <span className="font-bold">
                            -R{pricing.discountAmount}
                          </span>
                        </div>
                      )}
                      {pricing.tipAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="opacity-60">Tip</span>
                          <span className="font-medium">R{pricing.tipAmount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className={`min-w-[140px] text-white font-bold py-3 px-6 rounded-xl shadow-lg disabled:opacity-50 ${
                summaryLight
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                  : "bg-blue-600 rounded-2xl shadow-xl shadow-blue-200"
              }`}
            >
              {step === 5 ? "Confirm booking" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 pb-8">
          <button
            type="button"
            onClick={prevStep}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingSystem;

