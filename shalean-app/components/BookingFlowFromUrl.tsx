"use client";

import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Star,
  ShieldCheck,
  Calendar,
  Home,
  Layers,
  Sparkles,
  Wind,
  Users,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ArrowUpDown,
  MapPin,
  Sofa,
  Bath,
  LayoutGrid,
  Refrigerator,
  Flame,
  Boxes,
  BrickWall,
  User,
  Award,
  WashingMachine,
  Download,
  Copy,
  LayoutDashboard,
  LogOut,
  Car,
  BedDouble,
  Sun,
  Package,
  Square,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  parseBookingPath,
  getBookingPath,
  getConfirmationPath,
  type ServiceType,
  type StepIndex,
  SERVICE_SLUGS,
  DEFAULT_SERVICE,
  BOOKING_BASE,
} from "@/lib/booking-routes";
import { getBookingByRef, getBookingForRebook, type BookingForConfirmation } from "@/app/actions/booking";
import { initializePaystackTransaction } from "@/app/actions/paystack";
import { getCleanersForBooking, type CleanerForBooking } from "@/app/actions/dashboard";
import { createClient } from "@/lib/supabase/client";
import { getProfileForSession, updateProfileForSession } from "@/app/actions/profile";
import type { UserProfile, CleanerProfile, AdminProfile } from "@/lib/dashboard-types";
import { AuthModal } from "@/components/AuthModal";

// ─── TYPES ─────────────────────────────────────────────────────────────────────
type PropertyType = "apartment" | "house" | "office";
type PaymentMethod = "online";

interface Extra {
  id: string;
  label: string;
  price: number;
  icon: React.ReactNode;
}

// Shape of pricing rows passed from the server (pricing_config).
interface ActivePricingConfigRow {
  serviceType: string | null;
  priceType: string;
  itemName: string | null;
  price: number;
  effectiveDate: string;
}

// Mapping between internal service ids and pricing_config.service_type values
const SERVICE_TYPE_DB_LABELS: Record<ServiceType, string> = {
  standard: "Standard",
  deep: "Deep",
  move: "Move In/Out",
  airbnb: "Airbnb",
  carpet: "Carpet",
};

// Map UI extra ids to pricing_config.item_name (possibly multiple rows, e.g. laundry + ironing)
const EXTRA_ID_TO_DB_ITEMS: Record<
  string,
  { itemNames: string[]; allowServiceSpecific?: boolean; includeEquipmentCharge?: boolean }
> = {
  balcony: { itemNames: ["Balcony Cleaning"] },
  carpet_cleaning: { itemNames: ["Carpet Cleaning"] },
  ceiling: { itemNames: ["Ceiling Cleaning"] },
  couch: { itemNames: ["Couch Cleaning"] },
  garage: { itemNames: ["Garage Cleaning"] },
  mattress: { itemNames: ["Mattress Cleaning"] },
  outside_windows: { itemNames: ["Outside Window Cleaning"] },
  fridge: { itemNames: ["Inside Fridge"] },
  oven: { itemNames: ["Inside Oven"] },
  cabinets: { itemNames: ["Inside Cabinets"] },
  windows: { itemNames: ["Interior Windows"] },
  walls: { itemNames: ["Interior Walls"] },
  laundry_ironing: { itemNames: ["Laundry", "Ironing"] },
  extra_cleaner: { itemNames: [] }, // no direct mapping in pricing_config seeds
  equipment_supply: { itemNames: ["Equipment & Supplies"], includeEquipmentCharge: true },
  property_to_move: { itemNames: ["property_move"], allowServiceSpecific: true },
};

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
  officeSize: string;
  extras: string[];
  cleanerId: string;
  teamId: string;
  workingArea: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  instructions: string;
  paymentMethod: PaymentMethod;
  tipAmount: number;
  promoCode: string;
  discountAmount: number;
  assignMe: boolean;
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const PROMO_CODES: Record<string, number> = {
  SHALEAN10: 0.1,
  SAVE20: 0.2,
  FIRSTCLEAN: 100,
};

const SERVICES: { id: ServiceType; title: string; description: string; price: number; icon: React.ReactNode; color: string }[] = [
  { id: "standard", title: "Standard Cleaning", description: "Regular upkeep for your living space.", price: 450, icon: <Sparkles className="w-6 h-6" />, color: "blue" },
  { id: "deep", title: "Deep Cleaning", description: "Thorough intensive cleaning for every corner.", price: 850, icon: <Layers className="w-6 h-6" />, color: "indigo" },
  { id: "move", title: "Move In / Out Cleaning", description: "Specialized cleaning for property transitions.", price: 1200, icon: <Home className="w-6 h-6" />, color: "violet" },
  { id: "airbnb", title: "Airbnb Cleaning", description: "Fast turnaround for guest satisfaction.", price: 650, icon: <Calendar className="w-6 h-6" />, color: "sky" },
  { id: "carpet", title: "Carpet Cleaning", description: "Professional stain and dirt removal.", price: 350, icon: <Wind className="w-6 h-6" />, color: "teal" },
];

const MOST_BOOKED_SERVICE: ServiceType = "standard";

// Services that show individual cleaners; others show teams
const SERVICES_WITH_INDIVIDUAL_CLEANERS: ServiceType[] = ["standard", "airbnb", "carpet"];

// Per-service add-ons (all show price in UI)
const EXTRAS_DEEP_MOVE: Extra[] = [
  { id: "balcony", label: "Balcony Cleaning", price: 200, icon: <Sun className="w-5 h-5" /> },
  { id: "carpet_cleaning", label: "Carpet Cleaning", price: 200, icon: <Wind className="w-5 h-5" /> },
  { id: "ceiling", label: "Ceiling Cleaning", price: 200, icon: <Layers className="w-5 h-5" /> },
  { id: "couch", label: "Couch Cleaning", price: 200, icon: <Sofa className="w-5 h-5" /> },
  { id: "garage", label: "Garage Cleaning", price: 200, icon: <Car className="w-5 h-5" /> },
  { id: "mattress", label: "Mattress Cleaning", price: 200, icon: <BedDouble className="w-5 h-5" /> },
  { id: "outside_windows", label: "Outside Window Cleaning", price: 200, icon: <Square className="w-5 h-5" /> },
];

const EXTRAS_STANDARD_AIRBNB: Extra[] = [
  { id: "fridge", label: "Inside Fridge", price: 150, icon: <Refrigerator className="w-5 h-5" /> },
  { id: "oven", label: "Inside Oven", price: 150, icon: <Flame className="w-5 h-5" /> },
  { id: "cabinets", label: "Inside Cabinets", price: 180, icon: <Boxes className="w-5 h-5" /> },
  { id: "windows", label: "Interior Windows", price: 200, icon: <LayoutGrid className="w-5 h-5" /> },
  { id: "walls", label: "Interior Walls", price: 120, icon: <BrickWall className="w-5 h-5" /> },
  { id: "laundry_ironing", label: "Laundry / Ironing", price: 150, icon: <WashingMachine className="w-5 h-5" /> },
  { id: "extra_cleaner", label: "Extra Cleaner", price: 120, icon: <User className="w-5 h-5" /> },
  { id: "equipment_supply", label: "Equipment supply", price: 100, icon: <Package className="w-5 h-5" /> },
];

const EXTRAS_CARPET: Extra[] = [
  { id: "extra_cleaner", label: "Extra Cleaner", price: 120, icon: <User className="w-5 h-5" /> },
  { id: "property_to_move", label: "Property to move?", price: 0, icon: <Package className="w-5 h-5" /> },
];

function getExtrasForService(service: ServiceType): Extra[] {
  if (service === "deep" || service === "move") return EXTRAS_DEEP_MOVE;
  if (service === "standard" || service === "airbnb") return EXTRAS_STANDARD_AIRBNB;
  if (service === "carpet") return EXTRAS_CARPET;
  return EXTRAS_STANDARD_AIRBNB;
}

function getExtraPrice(service: ServiceType, extraId: string): number {
  return getExtrasForService(service).find((e) => e.id === extraId)?.price ?? 0;
}

const TEAMS: Team[] = [
  { id: "t1", name: "Team A — Precision Squad", size: 3, experience: "Senior Level", availability: "high", speciality: "Deep & Move-In/Out specialists", workingAreas: ["Sea Point", "Green Point", "Gardens"], unavailableDates: [] },
  { id: "t2", name: "Team B — Speed Force", size: 4, experience: "Expert Level", availability: "medium", speciality: "Large property experts", workingAreas: ["Claremont", "Kenilworth", "Constantia"], unavailableDates: [] },
  { id: "t3", name: "Team C — Elite Clean", size: 2, experience: "Specialist Level", availability: "high", speciality: "Compact & fast turnaround", workingAreas: ["Vredehoek", "Gardens", "Sea Point"], unavailableDates: [] },
];

const TIME_SLOTS = ["08:00", "10:00", "13:00", "15:00"];
const WORKING_AREAS = ["Sea Point", "Green Point", "Camps Bay", "Gardens", "Vredehoek", "Claremont", "Kenilworth", "Rondebosch", "Durbanville", "Bellville", "Constantia"];
const OFFICE_SIZES: { value: string; label: string }[] = [
  { value: "small", label: "Small (under 100m²)" },
  { value: "medium", label: "Medium (100–250m²)" },
  { value: "large", label: "Large (250–500m²)" },
  { value: "xlarge", label: "Extra Large (500m²+)" },
];

const OFFICE_SIZE_PRICES: Record<string, number> = {
  small: 0,
  medium: 150,
  large: 300,
  xlarge: 500,
};

const EXTRA_ROOM_PRICE = 80;

const STEP_LABELS = ["Plan", "Schedule", "Cleaner", "Details", "Payment"];

const BOOKING_CONTACT_STORAGE_KEY = "shalean_booking_contact";
const BOOKING_FORM_STORAGE_KEY = "shalean_booking_form";

type StoredBookingForm = Partial<
  Pick<
    BookingFormData,
    | "service"
    | "propertyType"
    | "officeSize"
    | "bedrooms"
    | "bathrooms"
    | "extraRooms"
    | "workingArea"
    | "extras"
    | "date"
    | "time"
    | "cleanerId"
    | "teamId"
    | "assignMe"
    | "name"
    | "email"
    | "phone"
    | "address"
  >
> & {
  step1ShowPropertyDetails?: boolean;
  step2ShowDateTime?: boolean;
};

function getStoredBookingForm(): StoredBookingForm {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(BOOKING_FORM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      service: typeof parsed.service === "string" ? (parsed.service as ServiceType) : undefined,
      propertyType: typeof parsed.propertyType === "string" ? (parsed.propertyType as PropertyType) : undefined,
      officeSize: typeof parsed.officeSize === "string" ? parsed.officeSize : undefined,
      bedrooms: typeof parsed.bedrooms === "number" ? parsed.bedrooms : undefined,
      bathrooms: typeof parsed.bathrooms === "number" ? parsed.bathrooms : undefined,
      extraRooms: typeof parsed.extraRooms === "number" ? parsed.extraRooms : undefined,
      workingArea: typeof parsed.workingArea === "string" ? parsed.workingArea : undefined,
      extras: Array.isArray(parsed.extras) ? (parsed.extras as string[]) : undefined,
      date: typeof parsed.date === "string" ? parsed.date : undefined,
      time: typeof parsed.time === "string" ? parsed.time : undefined,
      cleanerId: typeof parsed.cleanerId === "string" ? parsed.cleanerId : undefined,
      teamId: typeof parsed.teamId === "string" ? parsed.teamId : undefined,
      assignMe: typeof parsed.assignMe === "boolean" ? parsed.assignMe : undefined,
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      phone: typeof parsed.phone === "string" ? parsed.phone : undefined,
      address: typeof parsed.address === "string" ? parsed.address : undefined,
      step1ShowPropertyDetails: typeof parsed.step1ShowPropertyDetails === "boolean" ? parsed.step1ShowPropertyDetails : undefined,
      step2ShowDateTime: typeof parsed.step2ShowDateTime === "boolean" ? parsed.step2ShowDateTime : undefined,
    };
  } catch {
    return {};
  }
}

function setStoredBookingForm(form: StoredBookingForm): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BOOKING_FORM_STORAGE_KEY, JSON.stringify(form));
  } catch {
    // ignore
  }
}

function getStoredContact(): Partial<Pick<BookingFormData, "name" | "email" | "phone" | "address">> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(BOOKING_CONTACT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      phone: typeof parsed.phone === "string" ? parsed.phone : undefined,
      address: typeof parsed.address === "string" ? parsed.address : undefined,
    };
  } catch {
    return {};
  }
}

function setStoredContact(contact: Pick<BookingFormData, "name" | "email" | "phone" | "address">) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BOOKING_CONTACT_STORAGE_KEY, JSON.stringify(contact));
  } catch {
    // ignore
  }
}

/** Merge stored form + contact into a full BookingFormData (client-only). Skip sub-step flags. */
function rehydrateFormFromStorage(
  stored: StoredBookingForm,
  contact: Partial<Pick<BookingFormData, "name" | "email" | "phone" | "address">>,
  fallbackService: ServiceType
): BookingFormData {
  const service = (stored.service as ServiceType) ?? fallbackService;
  const base = defaultForm(service);
  const merged: BookingFormData = { ...base };
  for (const [k, v] of Object.entries(stored)) {
    if (k === "step1ShowPropertyDetails" || k === "step2ShowDateTime") continue;
    if (v !== undefined && v !== null) (merged as unknown as Record<string, unknown>)[k] = v;
  }
  merged.service = service;
  merged.extras = Array.isArray(stored.extras) ? stored.extras : base.extras;
  if (contact.name != null && contact.name !== "") merged.name = contact.name;
  if (contact.email != null && contact.email !== "") merged.email = contact.email;
  if (contact.phone != null && contact.phone !== "") merged.phone = contact.phone;
  if (contact.address != null && contact.address !== "") merged.address = contact.address;
  return merged;
}

function defaultForm(service: ServiceType): BookingFormData {
  return {
    service,
    bedrooms: 2,
    bathrooms: 1,
    extraRooms: 0,
    propertyType: "apartment",
    officeSize: "",
    extras: [],
    cleanerId: "",
    teamId: "",
    workingArea: "",
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    instructions: "",
    paymentMethod: "online",
    tipAmount: 0,
    promoCode: "",
    discountAmount: 0,
    assignMe: false,
  };
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function generateRef(): string {
  return "SHL-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getDatesForMonth(): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function selectLatestRule(rules: ActivePricingConfigRow[]): ActivePricingConfigRow | undefined {
  if (!rules.length) return undefined;
  return rules.reduce<ActivePricingConfigRow | undefined>((latest, rule) => {
    if (!latest) return rule;
    return rule.effectiveDate > latest.effectiveDate ? rule : latest;
  }, undefined);
}

function getDbServiceLabel(service: ServiceType): string | null {
  return SERVICE_TYPE_DB_LABELS[service] ?? null;
}

function getExtraPriceFromConfig(
  service: ServiceType,
  extraId: string,
  rows: ActivePricingConfigRow[] | null | undefined
): number | null {
  if (!rows || rows.length === 0) return null;
  const mapping = EXTRA_ID_TO_DB_ITEMS[extraId];
  if (!mapping || mapping.itemNames.length === 0) return null;

  const serviceLabel = getDbServiceLabel(service);

  // Collect matching rules for all mapped item names
  const matches: ActivePricingConfigRow[] = [];
  for (const name of mapping.itemNames) {
    const nameMatches = rows.filter((r) => {
      if (!r.itemName || r.itemName !== name) return false;
      if (mapping.includeEquipmentCharge && r.priceType === "equipment_charge") return true;
      if (r.priceType !== "extra") return false;
      if (mapping.allowServiceSpecific && serviceLabel) {
        // Prefer service-specific rows when present
        return !r.serviceType || r.serviceType === serviceLabel;
      }
      return !r.serviceType;
    });
    if (nameMatches.length) {
      const latest = selectLatestRule(nameMatches);
      if (latest) matches.push(latest);
    }
  }

  if (!matches.length) return null;
  // Sum prices when multiple items mapped (e.g. laundry + ironing)
  return matches.reduce((sum, r) => sum + r.price, 0);
}

function usePricing(data: BookingFormData, configRows: ActivePricingConfigRow[] | null) {
  return useMemo(() => {
    const svc = SERVICES.find((s) => s.id === data.service);

    let basePrice = svc?.price ?? 0;
    let bedroomUnit = 100;
    let bathroomUnit = 50;

    if (configRows && configRows.length > 0) {
      const serviceLabel = getDbServiceLabel(data.service);
      if (serviceLabel) {
        const serviceRules = configRows.filter((r) => r.serviceType === serviceLabel);
        const baseRule = selectLatestRule(serviceRules.filter((r) => r.priceType === "base"));
        const bedroomRule = selectLatestRule(serviceRules.filter((r) => r.priceType === "bedroom"));
        const bathroomRule = selectLatestRule(serviceRules.filter((r) => r.priceType === "bathroom"));
        if (baseRule) basePrice = baseRule.price;
        if (bedroomRule) bedroomUnit = bedroomRule.price;
        if (bathroomRule) bathroomUnit = bathroomRule.price;
      }
    }

    const bedrooms = Number(data.bedrooms) || 0;
    const bathrooms = Number(data.bathrooms) || 0;
    const bedroomAdd = Math.max(0, bedrooms - 1) * bedroomUnit;
    const bathroomAdd = Math.max(0, bathrooms - 1) * bathroomUnit;
    const isOffice = data.propertyType === "office";
    const officeSizeAdd = isOffice && data.officeSize ? (OFFICE_SIZE_PRICES[data.officeSize] ?? 0) : 0;
    const extraRoomsAdd = !isOffice ? (Number(data.extraRooms) || 0) * EXTRA_ROOM_PRICE : 0;
    const extras = Array.isArray(data.extras) ? data.extras : [];
    const extrasTotal = extras.reduce((sum, id) => {
      const override = getExtraPriceFromConfig(data.service, id, configRows);
      if (override != null) return sum + override;
      return sum + getExtraPrice(data.service, id);
    }, 0);
    const subtotal = basePrice + bedroomAdd + bathroomAdd + officeSizeAdd + extraRoomsAdd + extrasTotal;
    let discountAmount = 0;
    if (data.promoCode) {
      const discount = PROMO_CODES[data.promoCode.toUpperCase()];
      if (discount !== undefined) {
        discountAmount = discount <= 1 ? Math.round(subtotal * discount) : Math.min(subtotal, discount);
      }
    }
    const tipAmount = Number(data.tipAmount) || 0;
    return {
      basePrice,
      bedroomAdd,
      bathroomAdd,
      officeSizeAdd,
      extraRoomsAdd,
      extrasTotal,
      tipAmount,
      discountAmount,
      subtotal,
      total: Math.max(0, subtotal - discountAmount) + tipAmount,
    };
  }, [data, configRows]);
}

// ─── SHARED UI ──────────────────────────────────────────────────────────────────
const StepTitle = ({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) => (
  <div className="mb-6">
    <h3 className="text-main-heading sm:text-page-title font-bold text-slate-900 mb-1.5 leading-tight">{children}</h3>
    {subtitle && <p className="text-sub-heading font-medium text-slate-500 leading-relaxed">{subtitle}</p>}
  </div>
);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-4 pt-6 border-t border-slate-100 first:border-t-0 first:pt-0">
    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
    <h4 className="font-bold text-slate-900 text-section uppercase tracking-wider">{children}</h4>
  </div>
);

const SelectionCard = ({ selected, onClick, children, className = "" }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
  <div onClick={onClick} className={`relative rounded-card border-2 cursor-pointer transition-all duration-200 p-4 shadow-card ${selected ? "border-blue-600 bg-blue-50/50" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"} ${className}`}>
    {selected && <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
    {children}
  </div>
);

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-helper font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const InputField = ({ label, required, error, ...props }: { label: string; required?: boolean; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <FieldLabel required={required}>{label}</FieldLabel>
    <input {...props} className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all text-body shadow-sm ${error ? "border-red-400 bg-red-50/50" : "border-slate-200/80 hover:border-slate-300"}`} />
    {error && <p className="text-helper text-red-500 mt-1 ml-1 font-medium">{error}</p>}
  </div>
);

const SelectField = ({ label, required, children, ...props }: { label: string; required?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div>
    <FieldLabel required={required}>{label}</FieldLabel>
    <div className="relative">
      <select {...props} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-card text-slate-900 text-body focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all">
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const CounterRow = ({ label, sub, value, onChange, min = 1, max = 10 }: { label: string; sub?: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) => (
  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-card">
    <div>
      <span className="block font-bold text-slate-900 text-card-title">{label}</span>
      {sub && <span className="text-small text-slate-500">{sub}</span>}
    </div>
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center active:bg-slate-100 hover:border-slate-300 transition-colors">
        <span className="text-slate-600 text-lg leading-none">−</span>
      </button>
      <span className="text-base font-black text-slate-900 w-5 text-center">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center active:bg-slate-100 hover:border-slate-300 transition-colors">
        <span className="text-slate-600 text-lg leading-none">+</span>
      </button>
    </div>
  </div>
);

const RoomCounter = ({ label, icon, value, onChange, min = 1, max = 10 }: { label: string; icon: React.ReactNode; value: number; onChange: (v: number) => void; min?: number; max?: number }) => {
  const safeValue = Math.max(min, Math.min(max, Number(value) || min));
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-card shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{icon}</div>
        <span className="font-bold text-slate-900 text-card-title">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, safeValue - 1))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center active:bg-slate-100 hover:border-slate-300 transition-colors text-slate-600">
          <span className="text-lg leading-none">−</span>
        </button>
        <span className="text-base font-black text-slate-900 w-5 text-center">{safeValue}</span>
        <button type="button" onClick={() => onChange(Math.min(max, safeValue + 1))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center active:bg-slate-100 hover:border-slate-300 transition-colors text-slate-600">
          <span className="text-lg leading-none">+</span>
        </button>
      </div>
    </div>
  );
};

// ─── STEP 1: PLAN ──────────────────────────────────────────────────────────────
const Step1Plan = ({
  data,
  setData,
  showPropertyDetails,
  setShowPropertyDetails,
  onServiceSelect,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  showPropertyDetails: boolean;
  setShowPropertyDetails: (v: boolean) => void;
  onServiceSelect?: (serviceId: ServiceType) => void;
}) => {
  const propertyDetailsRef = useRef<HTMLDivElement>(null);

  const handleServiceSelect = (serviceId: ServiceType) => {
    const validExtraIds = getExtrasForService(serviceId).map((e) => e.id);
    setData((prev) => ({
      ...prev,
      service: serviceId,
      cleanerId: "",
      teamId: "",
      extras: prev.extras.filter((id) => validExtraIds.includes(id)),
    }));
    setShowPropertyDetails(true);
    // Persist and update URL so the address bar reflects the selection; storage ensures rehydration
    // restores step1ShowPropertyDetails after remount.
    onServiceSelect?.(serviceId);
  };

  useEffect(() => {
    if (showPropertyDetails && propertyDetailsRef.current) {
      const firstSelect = propertyDetailsRef.current.querySelector<HTMLSelectElement>("select");
      firstSelect?.focus();
    }
  }, [showPropertyDetails]);

  const isOffice = data.propertyType === "office";
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isOfficeSizeOpen, setIsOfficeSizeOpen] = useState(false);

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {!showPropertyDetails && (
          <motion.div
            key="service-type"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <StepTitle subtitle="Choose your service.">Your Cleaning Plan</StepTitle>
            <SectionHeader>1. Service Type</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICES.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleServiceSelect(s.id)}
                  className="relative rounded-card border border-slate-200 bg-white cursor-pointer transition-all duration-200 p-4 shadow-card hover:border-slate-300 hover:bg-slate-50"
                >
                  {s.id === MOST_BOOKED_SERVICE && (
                    <span className="absolute -top-2 right-3 text-tiny font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                      Most Booked
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-card-title truncate">{s.title}</h4>
                      <p className="text-body text-slate-500 truncate">{s.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {showPropertyDetails && (
          <motion.div
            key="property-details"
            ref={propertyDetailsRef}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <StepTitle subtitle="Provide your property details.">Your Cleaning Plan</StepTitle>
              <button type="button" onClick={() => setShowPropertyDetails(false)} className="text-helper font-bold text-blue-600 hover:text-blue-700 hover:underline">
                Change service
              </button>
            </div>
            <SectionHeader>2. Property Details</SectionHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <FieldLabel required>Property Type</FieldLabel>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {(["apartment", "house", "office"] as PropertyType[]).map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setData((prev) => ({ ...prev, propertyType: pt }))}
                      className={`rounded-card border-2 px-4 py-2.5 font-semibold text-body transition-all duration-200 ${
                        data.propertyType === pt
                          ? "border-blue-600 bg-blue-50/50 text-blue-600"
                          : "border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:text-slate-600"
                      }`}
                    >
                      {pt === "apartment" ? "Apartment" : pt === "house" ? "House" : "Office"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel required>Your Location</FieldLabel>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setIsLocationOpen((open) => !open)}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-card text-left text-body flex items-center justify-between text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <span className={data.workingArea ? "text-slate-900" : "text-slate-400"}>
                      {data.workingArea || "Select an area"}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${isLocationOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isLocationOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-card shadow-card max-h-64 overflow-y-auto">
                      {WORKING_AREAS.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => {
                            setData((prev) => ({ ...prev, workingArea: area, cleanerId: "", teamId: "" }));
                            setIsLocationOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-body ${
                            data.workingArea === area
                              ? "bg-blue-50 text-blue-600"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {isOffice && (
              <div className="pt-2">
                <FieldLabel required>Office Size</FieldLabel>
                <div className="relative mt-1.5">
                  <button
                    type="button"
                    onClick={() => setIsOfficeSizeOpen((open) => !open)}
                    className="w-full px-4 pr-10 py-3 bg-white border border-slate-200 rounded-card text-left text-body flex items-center justify-between text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <span className={data.officeSize ? "text-slate-900" : "text-slate-400"}>
                      {OFFICE_SIZES.find((o) => o.value === data.officeSize)?.label ?? "Select office size"}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${isOfficeSizeOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOfficeSizeOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-card shadow-card max-h-64 overflow-y-auto">
                      {OFFICE_SIZES.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setData((prev) => ({ ...prev, officeSize: opt.value }));
                            setIsOfficeSizeOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-body ${
                            data.officeSize === opt.value
                              ? "bg-blue-50 text-blue-600"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="pt-2">
              <FieldLabel>Rooms</FieldLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                <RoomCounter
                  label={isOffice ? "Private Offices" : "Bedrooms"}
                  icon={
                    isOffice ? (
                      <Layers className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Sofa className="w-5 h-5 text-blue-600" />
                    )
                  }
                  value={data.bedrooms}
                  onChange={(v) => setData((prev) => ({ ...prev, bedrooms: v }))}
                  min={1}
                  max={10}
                />
                <RoomCounter
                  label={isOffice ? "Meeting Rooms" : "Bathrooms"}
                  icon={
                    isOffice ? (
                      <Users className="w-5 h-5 text-violet-600" />
                    ) : (
                      <Bath className="w-5 h-5 text-violet-600" />
                    )
                  }
                  value={data.bathrooms}
                  onChange={(v) => setData((prev) => ({ ...prev, bathrooms: v }))}
                  min={1}
                  max={8}
                />
                {!isOffice && (
                  <RoomCounter
                    label="Extra Rooms"
                    icon={<LayoutGrid className="w-5 h-5 text-violet-600" />}
                    value={data.extraRooms}
                    onChange={(v) => setData((prev) => ({ ...prev, extraRooms: v }))}
                    min={0}
                    max={10}
                  />
                )}
              </div>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── STEP 2: SCHEDULE (Add-ons first with Continue, then Date & Time; time slot advances) ─
const Step2Schedule = ({
  data,
  setData,
  showDateTime,
  setShowDateTime,
  onTimeSlotSelect,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  showDateTime: boolean;
  setShowDateTime: (v: boolean) => void;
  onTimeSlotSelect: (slot: string) => void;
}) => {
  const availableDates = useMemo(() => getDatesForMonth(), []);
  const toggleExtra = (id: string) => setData((prev) => ({ ...prev, extras: prev.extras.includes(id) ? prev.extras.filter((e) => e !== id) : [...prev.extras, id] }));

  const handleTimeSlotClick = (slot: string) => {
    setData((prev) => ({ ...prev, time: slot }));
    onTimeSlotSelect(slot);
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {!showDateTime && (
          <motion.div
            key="add-ons"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <StepTitle subtitle="Add optional extras to your cleaning.">Schedule</StepTitle>
            <SectionHeader>1. Optional Add-ons</SectionHeader>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {getExtrasForService(data.service).map((extra) => {
                const selected = data.extras.includes(extra.id);
                return (
                  <div key={extra.id} onClick={() => toggleExtra(extra.id)} className={`relative rounded-card border p-3 text-center cursor-pointer transition-all shadow-card ${selected ? "border-2 border-blue-600 bg-blue-50/50" : "border border-slate-200 bg-white hover:border-blue-300"}`}>
                    <div className={`w-11 h-11 rounded-full mx-auto flex items-center justify-center mb-2 border ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-blue-500 bg-white text-blue-600"}`}>{extra.icon}</div>
                    <p className="text-sm font-normal text-slate-900 truncate">{extra.label}</p>
                    <p className="text-blue-600 text-sm font-normal">+R{extra.price}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        {showDateTime && (
          <motion.div
            key="date-time"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <StepTitle subtitle="Choose a convenient date and time.">Schedule</StepTitle>
              <button type="button" onClick={() => setShowDateTime(false)} className="text-helper font-bold text-blue-600 hover:text-blue-700 hover:underline">
                Change add-ons
              </button>
            </div>
            <SectionHeader>2. Date & Time</SectionHeader>

            <div className="pt-6 border-t border-slate-100 first:border-t-0 first:pt-0">
              <FieldLabel required>Date</FieldLabel>
              {availableDates.length > 0 && (
                <p className="text-helper text-slate-500 mb-2 ml-1" id="date-helper">
                  {(() => {
                    const first = new Date(availableDates[0] + "T00:00:00");
                    return first.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
                  })()}
                </p>
              )}
              <p className="text-small text-slate-400 mb-3 ml-1" id="date-helper-desc">Select a date in the next 2 weeks</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2" role="group" aria-labelledby="date-helper" aria-describedby="date-helper-desc">
                {availableDates.map((dateStr) => {
                  const d = new Date(dateStr + "T00:00:00");
                  const dayName = d.toLocaleDateString("en-ZA", { weekday: "short" });
                  const dayNum = d.getDate();
                  const selected = data.date === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setData((prev) => ({ ...prev, date: dateStr }))}
                      aria-label={`${dayName} ${dayNum}, ${d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}${selected ? " (selected)" : ""}`}
                      aria-pressed={selected}
                      className={`rounded-card p-2 text-center transition-all border text-body focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-1 ${selected ? "bg-blue-600 text-white border-blue-600 shadow-card" : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700"}`}
                    >
                      <p className={`text-helper font-semibold mb-0.5 ${selected ? "text-blue-200" : "text-slate-400"}`}>{dayName}</p>
                      <p className="text-body font-black leading-none">{dayNum}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {data.date && (
              <div className="pt-6 border-t border-slate-100">
                <FieldLabel required>Available times</FieldLabel>
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="text-helper text-slate-500 mb-2 ml-1">Morning</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Morning time slots">
                      {TIME_SLOTS.filter((s) => parseInt(s, 10) < 12).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleTimeSlotClick(slot)}
                          aria-label={`${slot}${data.time === slot ? " (selected)" : ""}`}
                          aria-pressed={data.time === slot}
                          className={`py-2.5 rounded-card border font-semibold text-helper transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-1 ${data.time === slot ? "bg-blue-600 text-white border-blue-600 shadow-card" : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-helper text-slate-500 mb-2 ml-1">Afternoon</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Afternoon time slots">
                      {TIME_SLOTS.filter((s) => parseInt(s, 10) >= 12).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleTimeSlotClick(slot)}
                          aria-label={`${slot}${data.time === slot ? " (selected)" : ""}`}
                          aria-pressed={data.time === slot}
                          className={`py-2.5 rounded-card border font-semibold text-helper transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-1 ${data.time === slot ? "bg-blue-600 text-white border-blue-600 shadow-card" : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── STEP 3: CLEANER ───────────────────────────────────────────────────────────
type CleanerSort = "rating" | "reviews" | "availability";
type TeamSort = "availability" | "name";

const CLEANER_SORT_OPTIONS: { value: CleanerSort; label: string }[] = [
  { value: "rating", label: "Rating (highest)" },
  { value: "reviews", label: "Reviews (most)" },
  { value: "availability", label: "Availability first" },
];

const TEAM_SORT_OPTIONS: { value: TeamSort; label: string }[] = [
  { value: "availability", label: "Availability" },
  { value: "name", label: "Name" },
];

const Step3Cleaner = ({
  data,
  setData,
  cleaners,
  cleanersLoading,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  cleaners: Cleaner[];
  cleanersLoading?: boolean;
}) => {
  const [cleanerSort, setCleanerSort] = useState<CleanerSort>("rating");
  const [teamSort, setTeamSort] = useState<TeamSort>("availability");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const showIndividual = SERVICES_WITH_INDIVIDUAL_CLEANERS.includes(data.service);

  const filteredCleaners = useMemo(() => {
    const list = cleaners
      .filter(
        (c) =>
          !data.workingArea ||
          !c.workingAreas ||
          c.workingAreas.length === 0 ||
          c.workingAreas.includes(data.workingArea)
      )
      .map((c) => ({
        ...c,
        available: !data.date || !(c.unavailableDates ?? []).includes(data.date),
      }));
    if (cleanerSort === "rating") return [...list].sort((a, b) => b.rating - a.rating);
    if (cleanerSort === "reviews") return [...list].sort((a, b) => b.reviews - a.reviews);
    return [...list].sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1));
  }, [cleaners, data.workingArea, data.date, cleanerSort]);

  const filteredTeams = useMemo(() => {
    const list = TEAMS.filter(
      (t) =>
        (!data.workingArea || t.workingAreas.includes(data.workingArea)) &&
        (!data.date || !t.unavailableDates.includes(data.date))
    );
    const order = { high: 0, medium: 1, low: 2 };
    if (teamSort === "availability") return [...list].sort((a, b) => order[a.availability] - order[b.availability]);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [data.workingArea, data.date, teamSort]);

  const handleSelectAssign = () =>
    setData((prev) => ({ ...prev, assignMe: true, cleanerId: "", teamId: "" }));

  const handleSelectCleaner = (id: string) =>
    setData((prev) => ({ ...prev, assignMe: false, cleanerId: id, teamId: "" }));

  const handleSelectTeam = (id: string) =>
    setData((prev) => ({ ...prev, assignMe: false, teamId: id, cleanerId: "" }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <StepTitle subtitle="Select your professional or let us assign the best match.">
        {showIndividual ? "Choose Cleaner" : "Choose Team"}
      </StepTitle>

      {/* Let us assign option */}
      <div className="space-y-4">
        <SectionHeader>Option</SectionHeader>
        <SelectionCard
          selected={data.assignMe}
          onClick={handleSelectAssign}
          className="p-5 sm:p-6 min-h-[72px] sm:min-h-0"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 sm:w-7 sm:h-7 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 text-card-title sm:text-base">Let us assign</h4>
              <p className="text-small text-slate-500 mt-0.5">We&apos;ll match you with the best available professional for your date and area.</p>
            </div>
          </div>
        </SelectionCard>
      </div>

      {/* Individual cleaners (from dashboard only) */}
      {showIndividual && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <SectionHeader>Or choose a cleaner</SectionHeader>
            {!cleanersLoading && filteredCleaners.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 text-small font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-card hover:bg-slate-100 transition-colors"
                aria-expanded={isSortOpen}
                aria-haspopup="listbox"
              >
                <ArrowUpDown className="w-4 h-4" />
                Sort: {CLEANER_SORT_OPTIONS.find((o) => o.value === cleanerSort)?.label}
              </button>
              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white border border-slate-200 rounded-card shadow-card py-1">
                    {CLEANER_SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setCleanerSort(opt.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-small font-medium ${
                          cleanerSort === opt.value ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {cleanersLoading ? (
              <div className="col-span-2 flex items-center justify-center gap-3 py-10 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-body font-medium">Loading professionals…</span>
              </div>
            ) : filteredCleaners.length > 0 ? (
              filteredCleaners.map((cleaner) => {
                const available = !data.date || !(cleaner.unavailableDates ?? []).includes(data.date);
                return (
                  <SelectionCard
                    key={cleaner.id}
                    selected={!data.assignMe && data.cleanerId === cleaner.id}
                    onClick={() => available && handleSelectCleaner(cleaner.id)}
                    className={`p-5 sm:p-6 ${!available ? "opacity-75 cursor-not-allowed pointer-events-none" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={cleaner.photo}
                        alt={cleaner.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-card-title">{cleaner.name}</h4>
                          {cleaner.badge && (
                            <span className="text-tiny font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                              {cleaner.badge}
                            </span>
                          )}
                          {!available && (
                            <span className="text-tiny font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <p className="text-small text-slate-500 mt-0.5">{cleaner.experience} experience</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-small font-bold text-slate-800">{cleaner.rating}</span>
                          </div>
                          <span className="text-small text-slate-400">{cleaner.reviews} reviews</span>
                        </div>
                      </div>
                    </div>
                  </SelectionCard>
                );
              })
            ) : (
              <div className="col-span-2 p-6 bg-slate-50 rounded-xl text-center text-small text-slate-500">
                No cleaners available yet. Choose &quot;Let us assign&quot; and we&apos;ll match you with a professional.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teams */}
      {!showIndividual && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <SectionHeader>Or choose a team</SectionHeader>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 text-small font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-card hover:bg-slate-100 transition-colors"
                aria-expanded={isSortOpen}
              >
                <ArrowUpDown className="w-4 h-4" />
                Sort: {TEAM_SORT_OPTIONS.find((o) => o.value === teamSort)?.label}
              </button>
              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white border border-slate-200 rounded-card shadow-card py-1">
                    {TEAM_SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setTeamSort(opt.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-small font-medium ${
                          teamSort === opt.value ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => (
                <SelectionCard
                  key={team.id}
                  selected={!data.assignMe && data.teamId === team.id}
                  onClick={() => handleSelectTeam(team.id)}
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-card-title">{team.name}</h4>
                        <p className="text-small text-slate-500 mt-0.5">{team.speciality}</p>
                        <p className="text-tiny text-slate-400 mt-1">{team.size} members · {team.experience}</p>
                      </div>
                    </div>
                    <span className="text-small font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full self-start sm:self-center">
                      {team.availability} availability
                    </span>
                  </div>
                </SelectionCard>
              ))
            ) : (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-small text-slate-500">
                No teams available for this area/date. Try &quot;Let us assign&quot; above.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Contact & Address (single place for "Your Information") ─────────────────────
function ContactAndAddressFields({
  data,
  setData,
  errors,
}: {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  errors: Partial<Record<keyof BookingFormData, string>>;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <InputField label="Full Name" required value={data.name} onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))} error={errors.name} />
        <InputField label="Email" required type="email" value={data.email} onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))} error={errors.email} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <InputField label="Phone" required type="tel" value={data.phone} onChange={(e) => setData((prev) => ({ ...prev, phone: e.target.value }))} error={errors.phone} />
        <div>
          <FieldLabel required>Address</FieldLabel>
          <textarea value={data.address} onChange={(e) => setData((prev) => ({ ...prev, address: e.target.value }))} placeholder="Street, Building, etc." rows={2} className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-900 text-body placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all resize-none shadow-sm ${errors.address ? "border-red-400 bg-red-50/50" : "border-slate-200/80 hover:border-slate-300"}`} />
          {errors.address && <p className="text-small text-red-500 mt-1 ml-1 font-medium">{errors.address}</p>}
        </div>
      </div>
      <div>
        <FieldLabel>Extra Notes</FieldLabel>
        <textarea value={data.instructions} onChange={(e) => setData((prev) => ({ ...prev, instructions: e.target.value }))} placeholder="Access codes, parking info, special requests, etc." rows={3} className="w-full px-4 py-3 bg-white border rounded-xl text-slate-900 text-body placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all resize-y min-h-[80px] shadow-sm border-slate-200/80 hover:border-slate-300" />
      </div>
    </div>
  );
}

// ─── STEP 4: DETAILS (Contact & Address only) ────────────────────────────────────
const Step4Details = ({ data, setData, errors }: { data: BookingFormData; setData: React.Dispatch<React.SetStateAction<BookingFormData>>; errors: Partial<Record<keyof BookingFormData, string>> }) => (
  <div className="space-y-8">
    <div>
      <StepTitle subtitle="Tell us where to go and how to reach you.">Your Information</StepTitle>
      <SectionHeader>Contact & Address</SectionHeader>
      <div className="rounded-2xl bg-gradient-to-br from-slate-50/95 via-white to-blue-50/40 border border-slate-100/80 p-6 sm:p-7 shadow-sm shadow-slate-200/50 ring-1 ring-slate-900/[0.04] transition-shadow duration-200 hover:shadow-md hover:shadow-slate-200/40">
        <ContactAndAddressFields data={data} setData={setData} errors={errors} />
      </div>
    </div>
  </div>
);

// ─── STEP 5: PAYMENT ───────────────────────────────────────────────────────────
const Step5Payment = ({ data, setData, pricing, onPaystackPay, isProcessing, paymentError }: { data: BookingFormData; setData: React.Dispatch<React.SetStateAction<BookingFormData>>; pricing: ReturnType<typeof usePricing>; onPaystackPay: () => void; isProcessing: boolean; paymentError: string }) => {
  const tipOptions = [0, 50, 100, 150];
  const [customTipActive, setCustomTipActive] = useState(() => !tipOptions.includes(data.tipAmount));
  const [promoInput, setPromoInput] = useState(data.promoCode);
  const [promoMsg, setPromoMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [customTipInput, setCustomTipInput] = useState(() => (!tipOptions.includes(data.tipAmount) && data.tipAmount > 0 ? String(data.tipAmount) : ""));

  const applyPromo = () => {
    const code = promoInput.toUpperCase().trim();
    if (!code) { setData((prev) => ({ ...prev, promoCode: "" })); setPromoMsg(null); return; }
    if (PROMO_CODES[code]) { setData((prev) => ({ ...prev, promoCode: code })); setPromoMsg({ text: "Promo code applied successfully!", type: "success" }); }
    else setPromoMsg({ text: "Invalid promo code.", type: "error" });
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTipInput(value);
    const num = parseInt(value.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num >= 0) {
      setData((prev) => ({ ...prev, tipAmount: Math.min(num, 9999) }));
    } else if (value === "") {
      setData((prev) => ({ ...prev, tipAmount: 0 }));
    }
  };

  const handleSelectCustom = () => {
    setCustomTipActive(true);
    setData((prev) => ({ ...prev, tipAmount: 0 }));
    setCustomTipInput("");
  };

  const handleSelectPreset = (amount: number) => {
    setCustomTipActive(false);
    setData((prev) => ({ ...prev, tipAmount: amount }));
  };

  return (
    <div className="space-y-8">
      <div>
        <StepTitle subtitle="Secure your booking with a tip and complete payment.">Payment & Confirm</StepTitle>
        <div className="rounded-2xl bg-gradient-to-br from-slate-50/95 via-white to-blue-50/40 border border-slate-100/80 p-6 sm:p-8 shadow-sm shadow-slate-200/50 ring-1 ring-slate-900/[0.04] transition-shadow duration-200 hover:shadow-md hover:shadow-slate-200/40">
          <div className="space-y-8">
            <div>
              <SectionHeader>1. Add a Tip</SectionHeader>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {tipOptions.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setCustomTipActive(false);
                      setData((prev) => ({ ...prev, tipAmount: amount }));
                    }}
                    className={`py-3.5 rounded-xl border-2 text-helper font-bold transition-all duration-200 ${
                      !customTipActive && data.tipAmount === amount
                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200/50"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                    }`}
                  >
                    {amount === 0 ? "None" : `R${amount}`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCustomTipActive(true);
                    handleSelectCustom();
                  }}
                  className={`py-3.5 rounded-xl border-2 text-helper font-bold transition-all duration-200 ${
                    customTipActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200/50"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                  }`}
                >
                  Custom
                </button>
              </div>
              {customTipActive && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-body font-medium text-slate-600">R</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter amount"
                    value={customTipInput}
                    onChange={(e) => handleCustomTipChange(e.target.value)}
                    className="w-32 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-body font-semibold"
                  />
                </div>
              )}
            </div>

            <div>
              <SectionHeader>2. Payment</SectionHeader>
              <div className="flex items-center gap-4 rounded-xl border-2 border-blue-200/60 bg-blue-50/40 px-5 py-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/10">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Pay Online Now</p>
                  <p className="text-small text-slate-500">Secure card or EFT payment via Paystack</p>
                </div>
                <ShieldCheck className="ml-auto h-5 w-5 text-emerald-500 shrink-0" />
              </div>
            </div>

            <div>
              <SectionHeader>3. Promo Code</SectionHeader>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Enter code (e.g. SAVE20)"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-body uppercase"
                />
                <button
                  onClick={applyPromo}
                  className="rounded-xl bg-slate-900 px-6 py-3.5 font-bold text-white transition-colors hover:bg-slate-800 text-body"
                >
                  Apply
                </button>
              </div>
              {promoMsg && (
                <p className={`mt-2 text-small font-medium ${promoMsg.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                  {promoMsg.text}
                </p>
              )}
            </div>

            {paymentError && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 text-red-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-body font-medium">{paymentError}</p>
              </div>
            )}

            <div className="border-t border-slate-200/80 pt-6">
              <div className="mb-4 flex items-center justify-center gap-2 text-small text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Secure checkout · 256-bit SSL</span>
              </div>
              <button
                onClick={onPaystackPay}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 font-black text-white shadow-xl shadow-blue-200/60 transition-all duration-200 hover:shadow-2xl hover:shadow-blue-200/50 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] disabled:opacity-60 disabled:hover:shadow-xl disabled:hover:from-blue-600 disabled:hover:to-blue-700 flex items-center justify-center gap-3 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
                Securely Pay R{pricing.total}
              </button>
              <p className="mt-3 text-center text-small text-slate-500">By clicking pay, you agree to our terms of service.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── STEP 6: CONFIRMATION ───────────────────────────────────────────────────────
const Step6Confirmation = ({ data, pricing, bookingRef, onBookAnother }: { data: BookingFormData; pricing: ReturnType<typeof usePricing>; bookingRef: string; onBookAnother: () => void }) => {
  const [copied, setCopied] = useState(false);
  const copyRef = () => {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReceipt = () => {
    // Placeholder: in production, generate PDF or fetch from API
    const dateTime = data.date ? (data.time ? `${formatDate(data.date)}, ${data.time}` : formatDate(data.date)) : "";
    const receipt = {
      ref: bookingRef,
      service: SERVICES.find((s) => s.id === data.service)?.title ?? data.service,
      dateTime,
      total: pricing.total,
    };
    const blob = new Blob(
      [
        `Shalean Booking Receipt\n\nRef: ${receipt.ref}\nService: ${receipt.service}\nDate: ${receipt.dateTime}\nTotal: R${receipt.total}\n\nThank you for your booking!`,
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shalean-receipt-${bookingRef}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="text-center py-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-50"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </motion.div>
      <h3 className="text-page-title font-black text-slate-900 mb-2">Booking Confirmed!</h3>
      <div className="text-slate-500 text-body mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>Ref: <span className="font-black text-blue-600">{bookingRef}</span></span>
        <button
          type="button"
          onClick={copyRef}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-helper font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          aria-label="Copy reference"
        >
          <Copy className="w-4 h-4" />
          {copied ? "Copied!" : "Copy"}
        </button>
        <span className="w-full sm:w-auto text-center sm:text-left">Check your email for details.</span>
      </div>

      <div className="max-w-sm mx-auto mb-8 p-5 rounded-xl bg-slate-50/80 border border-slate-100 text-left">
        <h4 className="text-helper font-bold text-slate-500 uppercase tracking-wider mb-3">Booking Summary</h4>
        <div className="space-y-2 text-body">
          <div className="flex justify-between">
            <span className="text-slate-500">Service</span>
            <span className="font-semibold text-slate-900">{SERVICES.find((s) => s.id === data.service)?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date</span>
            <span className="font-semibold text-slate-900">{data.date ? formatDate(data.date) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Time</span>
            <span className="font-semibold text-slate-900">{data.time || "—"}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="text-slate-500">Amount Paid</span>
            <span className="font-black text-slate-900">R{pricing.total}</span>
          </div>
        </div>
      </div>

      <div className="max-w-xs mx-auto space-y-3">
        <a
          href={BOOKING_BASE + "/" + SERVICE_SLUGS[data.service]}
          className="block w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 text-center text-card-title hover:bg-blue-700 transition-colors"
        >
          Book Another Clean
        </a>
        <button
          type="button"
          onClick={handleDownloadReceipt}
          className="w-full bg-white border-2 border-slate-200 text-slate-600 font-semibold py-3.5 rounded-xl text-card-title hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Receipt
        </button>
      </div>
    </motion.div>
  );
};

// ─── MAIN: URL-driven booking flow ───────────────────────────────────────────────
const PAYSTACK_ERROR_MESSAGES: Record<string, string> = {
  payment_cancelled: "Payment was cancelled or no payment reference was received. Please try again when you’re ready to pay.",
  payment_failed: "Payment could not be completed. Please check your details and try again, or choose another payment method.",
  config: "Payment is temporarily unavailable. Please try again later.",
  invalid_ref: "We couldn’t match this payment to your booking. Please contact support if you were charged.",
  booking_failed: "Your payment succeeded but we couldn’t create the booking. Our team will contact you shortly.",
  callback_error: "Something went wrong after payment. If you were charged, we’ll confirm your booking by email.",
};

export function BookingFlowFromUrl({
  segments,
  pricingConfigRows,
}: {
  segments: string[];
  pricingConfigRows?: ActivePricingConfigRow[] | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const parsed = useMemo(() => parseBookingPath(pathname ?? ""), [pathname]);
  const errorCode = searchParams.get("error");
  const errorDetail = searchParams.get("msg");
  const redirectErrorMessage = errorCode
    ? (errorDetail ? errorDetail : (PAYSTACK_ERROR_MESSAGES[errorCode] ?? "Something went wrong. Please try again."))
    : null;

  const [data, setData] = useState<BookingFormData>(() => {
    const service = parsed?.kind === "flow" ? parsed.service : DEFAULT_SERVICE;
    return defaultForm(service);
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [step1ShowPropertyDetails, setStep1ShowPropertyDetails] = useState(false);
  const [step2ShowDateTime, setStep2ShowDateTime] = useState(false);
  const dataRef = useRef(data);
  const stepFlagsRef = useRef({ step1ShowPropertyDetails, step2ShowDateTime });
  const hasRehydratedRef = useRef(false);
  const lastPathnameRef = useRef(pathname ?? "");

  const [currentUser, setCurrentUser] = useState<UserProfile | CleanerProfile | AdminProfile | null>(null);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileDropdownOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // When user is logged in, prefill empty contact/address fields from their profile so "Your Information" is displayed.
  useEffect(() => {
    if (!currentUser) return;
    setData((prev) => {
      const updates: Partial<BookingFormData> = {};
      if (!prev.name.trim() && currentUser.name) updates.name = currentUser.name;
      if (!prev.email.trim() && currentUser.email) updates.email = currentUser.email;
      if (!prev.phone.trim() && currentUser.phone) updates.phone = currentUser.phone;
      if (!prev.address.trim() && currentUser.address) updates.address = currentUser.address;
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
  }, [currentUser]);

  // Rehydrate from sessionStorage after mount so server and client first render match (avoids hydration mismatch).
  // useLayoutEffect runs before paint so the user sees rehydrated data without a flash.
  useLayoutEffect(() => {
    const stored = getStoredBookingForm();
    const contact = getStoredContact();
    if (Object.keys(stored).length === 0 && Object.keys(contact).length === 0) return;
    const service = parsed?.kind === "flow" ? parsed.service : DEFAULT_SERVICE;
    setData(rehydrateFormFromStorage(stored, contact, service));
    if (stored.step1ShowPropertyDetails === true) setStep1ShowPropertyDetails(true);
    if (stored.step2ShowDateTime === true) setStep2ShowDateTime(true);
  }, []);
  const [fetchedBooking, setFetchedBooking] = useState<BookingForConfirmation | null | undefined>(undefined);
  const [fetchedBookingLoading, setFetchedBookingLoading] = useState(false);
  const [bookingCleaners, setBookingCleaners] = useState<Cleaner[] | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Fetch real cleaners from dashboard (profiles with role=cleaner) for step 3
  useEffect(() => {
    let cancelled = false;
    getCleanersForBooking().then((list: CleanerForBooking[]) => {
      if (cancelled) return;
      const defaultPhoto = "https://images.unsplash.com/photo-1494790108755-2616b612b1e8?auto=format&fit=crop&w=150&q=80";
      const mapped: Cleaner[] = list.map((c) => ({
        id: c.id,
        name: c.name,
        photo: c.avatar ?? defaultPhoto,
        experience: "—",
        rating: 0,
        reviews: 0,
        badge: c.verificationStatus === "verified" ? "Verified" : undefined,
        workingAreas: [],
        unavailableDates: [],
      }));
      setBookingCleaners(mapped);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    stepFlagsRef.current = { step1ShowPropertyDetails, step2ShowDateTime };
  }, [step1ShowPropertyDetails, step2ShowDateTime]);

  const pricing = usePricing(data, pricingConfigRows ?? null);

  const step: StepIndex = parsed?.kind === "confirmation" ? 6 : parsed?.kind === "flow" ? parsed.step : 1;
  const isConfirmation = step === 6;
  const refFromUrl = parsed?.kind === "confirmation" ? parsed.ref : null;

  // When user lands on confirmation URL directly, fetch booking from DB
  useEffect(() => {
    if (!isConfirmation || !refFromUrl) return;
    setFetchedBookingLoading(true);
    getBookingByRef(refFromUrl)
      .then((b) => setFetchedBooking(b ?? null))
      .finally(() => setFetchedBookingLoading(false));
  }, [isConfirmation, refFromUrl]);

  // Rebook: prefill form from existing booking when ?rebook=:id is present
  const rebookId = searchParams.get("rebook");
  useEffect(() => {
    if (!rebookId || isConfirmation) return;
    let cancelled = false;
    getBookingForRebook(rebookId).then((rebook) => {
      if (cancelled || !rebook) return;
      const base = defaultForm(rebook.service);
      setData({
        ...base,
        service: rebook.service,
        propertyType: (rebook.propertyType as PropertyType) || "apartment",
        officeSize: rebook.officeSize ?? "",
        bedrooms: rebook.bedrooms ?? 0,
        bathrooms: rebook.bathrooms ?? 0,
        extraRooms: rebook.extraRooms ?? 0,
        workingArea: rebook.workingArea ?? "",
        extras: Array.isArray(rebook.extras) ? rebook.extras : [],
        name: rebook.customerName ?? "",
        email: rebook.customerEmail ?? "",
        phone: rebook.customerPhone ?? "",
        address: rebook.address ?? "",
        instructions: rebook.instructions ?? "",
        date: "",
        time: "",
      });
      setStoredBookingForm({
        service: rebook.service,
        propertyType: (rebook.propertyType as PropertyType) || "apartment",
        officeSize: rebook.officeSize ?? "",
        bedrooms: rebook.bedrooms ?? 0,
        bathrooms: rebook.bathrooms ?? 0,
        extraRooms: rebook.extraRooms ?? 0,
        workingArea: rebook.workingArea ?? "",
        extras: Array.isArray(rebook.extras) ? rebook.extras : [],
        name: rebook.customerName ?? "",
        email: rebook.customerEmail ?? "",
        phone: rebook.customerPhone ?? "",
        address: rebook.address ?? "",
      });
      setStoredContact({
        name: rebook.customerName ?? "",
        email: rebook.customerEmail ?? "",
        phone: rebook.customerPhone ?? "",
        address: rebook.address ?? "",
      });
      const path = pathname ?? `${BOOKING_BASE}/${SERVICE_SLUGS[rebook.service]}`;
      router.replace(path, { scroll: false });
    });
    return () => {
      cancelled = true;
    };
  }, [rebookId, isConfirmation, pathname, router]);

  // Clear stored form when viewing confirmation so next booking starts fresh
  useEffect(() => {
    if (isConfirmation) setStoredBookingForm({});
  }, [isConfirmation]);

  // When on step 5, ensure contact from step 4 is in state (e.g. after remount or if ref was stale)
  useEffect(() => {
    if (step !== 5) return;
    const stored = getStoredContact();
    const hasStored = stored.email?.trim();
    const hasState = data.email?.trim();
    if (!hasState && hasStored) {
      setData((prev) => ({
        ...prev,
        name: (prev.name?.trim() || stored.name) ?? "",
        email: stored.email ?? "",
        phone: (prev.phone?.trim() || stored.phone) ?? "",
        address: (prev.address?.trim() || stored.address) ?? "",
      }));
    }
  }, [step, data.email]);

  // Sync service from URL only when the pathname has actually changed (navigation), not when the user
  // selected a different service in the UI (pathname unchanged) so we don't overwrite their selection.
  useEffect(() => {
    if (parsed?.kind !== "flow") return;
    const currentPath = pathname ?? "";
    if (currentPath === lastPathnameRef.current) return;
    lastPathnameRef.current = currentPath;
    if (parsed.service === data.service) return;
    const validExtraIds = getExtrasForService(parsed.service).map((e) => e.id);
    setData((prev) => ({
      ...prev,
      service: parsed.service,
      cleanerId: "",
      teamId: "",
      extras: prev.extras.filter((id) => validExtraIds.includes(id)),
    }));
  }, [pathname, parsed?.kind, data.service]);

  // Persist booking form (step 1 + 2 choices + sub-step flags) so they survive URL navigation / remounts.
  // Skip the first run so we don't overwrite storage before rehydration from initial state has been used.
  // Use stepFlagsRef so the dependency array size stays constant (React requires stable deps length).
  useEffect(() => {
    if (isConfirmation) return;
    if (!hasRehydratedRef.current) {
      hasRehydratedRef.current = true;
      return;
    }
    const flags = stepFlagsRef.current;
    setStoredBookingForm({
      service: data.service,
      propertyType: data.propertyType,
      officeSize: data.officeSize,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      extraRooms: data.extraRooms,
      workingArea: data.workingArea,
      extras: data.extras,
      date: data.date,
      time: data.time,
      cleanerId: data.cleanerId,
      teamId: data.teamId,
      assignMe: data.assignMe,
      step1ShowPropertyDetails: flags.step1ShowPropertyDetails,
      step2ShowDateTime: flags.step2ShowDateTime,
    });
  }, [
    isConfirmation,
    data.service,
    data.propertyType,
    data.officeSize,
    data.bedrooms,
    data.bathrooms,
    data.extraRooms,
    data.workingArea,
    data.extras,
    data.date,
    data.time,
    data.cleanerId,
    data.teamId,
    data.assignMe,
  ]);

  // Persist contact details so they survive refresh or direct link to Payment step
  useEffect(() => {
    setStoredContact({
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    });
  }, [data.name, data.email, data.phone, data.address]);

  const validate = useCallback((forStep: StepIndex): boolean => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};
    if (forStep === 1 && !data.workingArea) newErrors.workingArea = "Area required";
    if (forStep === 4) {
      if (!data.name.trim()) newErrors.name = "Name required";
      if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = "Valid email required";
      if (!data.phone.trim()) newErrors.phone = "Phone required";
      if (!data.address.trim()) newErrors.address = "Address required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data]);

  const canProceed = useCallback((): boolean => {
    if (step === 1) return !!data.workingArea;
    if (step === 2) return !!data.date && !!data.time;
    if (step === 3) {
      if (data.assignMe) return true;
      const showIndividual = SERVICES_WITH_INDIVIDUAL_CLEANERS.includes(data.service);
      return showIndividual ? !!data.cleanerId : !!data.teamId;
    }
    if (step === 4) return !!data.name && !!data.email && !!data.phone && !!data.address;
    return true;
  }, [step, data]);

  const goToStep = useCallback(
    (nextStep: StepIndex, pendingUpdates?: Partial<StoredBookingForm>) => {
      if (nextStep === 6) return; // only via getConfirmationPath
      const current = dataRef.current;
      const path = getBookingPath(current.service, nextStep);
      setStoredBookingForm({
        service: current.service,
        propertyType: current.propertyType,
        officeSize: current.officeSize,
        bedrooms: current.bedrooms,
        bathrooms: current.bathrooms,
        extraRooms: current.extraRooms,
        workingArea: current.workingArea,
        extras: current.extras,
        date: current.date,
        time: current.time,
        cleanerId: current.cleanerId,
        teamId: current.teamId,
        assignMe: current.assignMe,
        name: current.name,
        email: current.email,
        phone: current.phone,
        address: current.address,
        step1ShowPropertyDetails,
        step2ShowDateTime,
        ...pendingUpdates,
      });
      router.replace(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [data.service, router, step1ShowPropertyDetails, step2ShowDateTime]
  );

  const onServiceSelect = useCallback(
    (serviceId: ServiceType) => {
      setStoredBookingForm({
        ...getStoredBookingForm(),
        service: serviceId,
        step1ShowPropertyDetails: true,
      });
      router.replace(getBookingPath(serviceId, 1));
    },
    [router]
  );

  const nextStep = useCallback(() => {
    if (step === 4) {
      if (!validate(4)) return;
      // When logged in, persist "Your Information" to profile so it's available next time.
      if (currentUser && data.name.trim() && data.phone.trim()) {
        updateProfileForSession({
          name: data.name.trim(),
          phone: data.phone.trim(),
          address: data.address.trim() || undefined,
        }).catch(() => {});
      }
      // Persist contact so Payment step (and any remount) always sees it.
      setStoredContact({ name: data.name, email: data.email, phone: data.phone, address: data.address });
      // Pass contact into goToStep so the stored booking form includes it (avoids ref timing issues).
      goToStep(5, { name: data.name, email: data.email, phone: data.phone, address: data.address });
      return;
    } else if (step === 1 && !data.workingArea) {
      validate(1);
      return;
    } else if (!canProceed()) return;
    if (step < 5) goToStep((step + 1) as StepIndex);
  }, [step, canProceed, validate, goToStep, currentUser, data.name, data.email, data.phone, data.address]);

  const prevStep = useCallback(() => {
    if (step <= 1) return;
    setPaymentError("");
    if (step === 2) setStep2ShowDateTime(false);
    goToStep((step - 1) as StepIndex);
  }, [step, goToStep]);

  const handleTimeSlotSelect = useCallback(
    (slot: string) => {
      setData((prev) => ({ ...prev, time: slot }));
      goToStep(3, { time: slot });
    },
    [setData, goToStep]
  );

  const handlePaystackPay = useCallback(async () => {
    // Use latest state from ref; fall back to sessionStorage (persisted from Your Information) so payment always sees contact after step 4
    const current = dataRef.current;
    const storedContact = getStoredContact();
    const name = (current.name ?? "").trim() || (storedContact.name ?? "").trim();
    const email = (current.email ?? "").trim() || (storedContact.email ?? "").trim();
    const phone = (current.phone ?? "").trim() || (storedContact.phone ?? "").trim();
    const address = (current.address ?? "").trim() || (storedContact.address ?? "").trim();

    if (!email) {
      setPaymentError("Please enter your email address in the Details step before paying.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setPaymentError("Please enter a valid email address.");
      return;
    }
    setIsProcessing(true);
    setPaymentError("");
    try {
      const result = await initializePaystackTransaction({
        service: current.service,
        propertyType: current.propertyType,
        officeSize: current.officeSize,
        bedrooms: current.bedrooms,
        bathrooms: current.bathrooms,
        extraRooms: current.extraRooms,
        workingArea: current.workingArea,
        extras: current.extras,
        date: current.date,
        time: current.time,
        cleanerId: current.cleanerId,
        teamId: current.teamId,
        assignMe: current.assignMe,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        address,
        instructions: current.instructions,
        subtotal: pricing.subtotal,
        discountAmount: pricing.discountAmount,
        tipAmount: current.tipAmount,
        total: pricing.total,
        promoCode: current.promoCode,
        paymentMethod: current.paymentMethod,
      });
      if (result.ok) {
        window.location.href = result.authorization_url;
        return;
      }
      setPaymentError(result.error || "Payment failed. Please try again.");
    } catch {
      setPaymentError("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [pricing]);

  const onBookAnother = useCallback(() => {
    setStoredBookingForm({});
    setData(defaultForm(data.service));
    setBookingRef("");
    router.replace(getBookingPath(data.service, 1));
  }, [data.service, router]);

  // Invalid URL: redirect to default
  useEffect(() => {
    if (!parsed && pathname?.startsWith(BOOKING_BASE) && pathname !== BOOKING_BASE) {
      router.replace(getBookingPath(DEFAULT_SERVICE, 1));
    }
  }, [parsed, pathname, router]);

  if (isConfirmation) {
    const ref = refFromUrl ?? bookingRef;
    const fromUrl = !!refFromUrl;
    const loading = fromUrl && (fetchedBookingLoading || fetchedBooking === undefined);
    const notFound = fromUrl && fetchedBooking === null;
    const showFromDb = fromUrl && !!fetchedBooking;
    const displayData: BookingFormData = showFromDb && fetchedBooking
      ? { ...defaultForm(fetchedBooking.service), service: fetchedBooking.service, date: fetchedBooking.date, time: fetchedBooking.time }
      : data;
    const displayPricing = showFromDb && fetchedBooking
      ? { total: fetchedBooking.total, subtotal: fetchedBooking.subtotal, discountAmount: fetchedBooking.discountAmount, tipAmount: fetchedBooking.tipAmount, basePrice: 0, bedroomAdd: 0, bathroomAdd: 0, officeSizeAdd: 0, extraRoomsAdd: 0, extrasTotal: 0 }
      : pricing;
    return (
      <div className="min-h-screen bg-page-bg flex flex-col font-sans">
        <nav className="fixed top-0 left-0 right-0 z-50 pt-4 px-6 md:pt-6">
          <div
            className={`max-w-7xl mx-auto rounded-2xl bg-black flex items-center justify-between gap-4 px-6 py-3 md:px-8 md:py-4 transition-shadow duration-300 ${
              isScrolled ? "shadow-lg shadow-black/20" : "shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
            }`}
          >
            <a href="/" className="flex items-center gap-2 text-white font-bold text-lg md:text-xl tracking-tight uppercase shrink-0">
              <img src="/shalean-logo.png" alt="" className="h-7 w-7 md:h-8 md:w-8 rounded-lg object-contain" />
              SHALEAN
            </a>
            <div className="flex-1 hidden md:block" aria-hidden />
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {currentUser ? (
                <div className="relative" ref={profileDropdownRef}>
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
                          onClick={() => { router.push("/"); setProfileDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => { router.push("/"); setProfileDropdownOpen(false); }}
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
                    onClick={() => { setAuthModalMode("login"); setAuthModalOpen(true); }}
                    className="inline-flex items-center justify-center rounded-full border border-white/40 text-white text-xs sm:text-sm font-medium px-3 py-2 sm:px-5 sm:py-2.5 hover:bg-white/10 transition-all"
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthModalMode("signup"); setAuthModalOpen(true); }}
                    className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 text-xs sm:text-sm font-medium px-3 py-2 sm:px-5 sm:py-2.5 hover:bg-slate-100 transition-all"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 flex-1 w-full">
          <h1 className="mb-6 text-2xl md:text-3xl font-bold text-slate-900">
            Your cleaning booking in Cape Town is confirmed
          </h1>
          <div className="bg-white rounded-card border border-slate-200 p-6 sm:p-8 shadow-card">
            {loading && (
              <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-body font-medium">Loading your booking…</span>
              </div>
            )}
            {notFound && (
              <div className="text-center py-12">
                <p className="text-body text-slate-600 mb-4">Booking not found. The link may be invalid or expired.</p>
                <a href={BOOKING_BASE + "/" + SERVICE_SLUGS[DEFAULT_SERVICE]} className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700">Start a new booking</a>
              </div>
            )}
            {!loading && !notFound && (
              <Step6Confirmation data={displayData} pricing={displayPricing} bookingRef={ref} onBookAnother={onBookAnother} />
            )}
          </div>
        </main>
        <footer className="fixed bottom-0 left-0 right-0 z-30 h-16 shrink-0 border-t border-slate-200 bg-footer-bg flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">N</div>
            <p className="text-helper text-slate-500">© {new Date().getFullYear()} Shift South (Pty) Ltd, all rights reserved</p>
          </div>
        </footer>
        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            mode={authModalMode}
            onAuthSuccess={(user) => {
              setCurrentUser(user);
              setAuthModalOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg flex flex-col font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 pt-4 px-6 md:pt-6">
        <div
          className={`max-w-7xl mx-auto rounded-2xl bg-black flex items-center justify-between gap-4 px-6 py-3 md:px-8 md:py-4 transition-shadow duration-300 ${
            isScrolled ? "shadow-lg shadow-black/20" : "shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
          }`}
        >
          <a href="/" className="flex items-center gap-2 text-white font-bold text-lg md:text-xl tracking-tight uppercase shrink-0">
            <img src="/shalean-logo.png" alt="" className="h-7 w-7 md:h-8 md:w-8 rounded-lg object-contain" />
            SHALEAN
          </a>
          <div className="flex-1 flex items-center justify-center min-w-0" aria-label="Booking steps">
            <div className="hidden md:flex items-center gap-2 w-full max-w-lg">
              {STEP_LABELS.map((label, idx) => {
                const current = idx + 1 === step;
                const completed = idx + 1 < step;
                return (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 text-sm font-semibold ${current ? "border-white bg-white text-slate-900" : completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-white/30 bg-white/10 text-white/60"}`} aria-current={current ? "step" : undefined}>
                        {completed ? <Check className="w-5 h-5" /> : <span>{idx + 1}</span>}
                      </div>
                      <span className={`text-helper font-medium truncate w-full text-center ${current ? "text-white" : "text-white/70"}`}>{label}</span>
                    </div>
                    {idx < STEP_LABELS.length - 1 && <div className={`h-0.5 flex-1 -mt-6 rounded-full transition-colors ${completed ? "bg-emerald-400" : "bg-white/20"}`} />}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="md:hidden flex items-center gap-2">
              <span className="text-helper font-black text-white/80 uppercase">Step {step} of 5</span>
              <div className="flex gap-1">
                {STEP_LABELS.map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx + 1 === step ? "bg-white" : idx + 1 < step ? "bg-emerald-500" : "bg-white/30"}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentUser ? (
              <div className="relative" ref={profileDropdownRef}>
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
                        onClick={() => { router.push("/"); setProfileDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => { router.push("/"); setProfileDropdownOpen(false); }}
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
                  onClick={() => { setAuthModalMode("login"); setAuthModalOpen(true); }}
                  className="inline-flex items-center justify-center rounded-full border border-white/40 text-white text-xs sm:text-sm font-medium px-3 py-2 sm:px-5 sm:py-2.5 hover:bg-white/10 transition-all"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode("signup"); setAuthModalOpen(true); }}
                  className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 text-xs sm:text-sm font-medium px-3 py-2 sm:px-5 sm:py-2.5 hover:bg-slate-100 transition-all"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-28 lg:pb-24 flex-1 w-full">
        <h1 className="mb-4 text-2xl md:text-3xl font-bold text-slate-900">
          Book your cleaning in Cape Town
        </h1>
        {redirectErrorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-card border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium">{redirectErrorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => router.replace(pathname ?? getBookingPath(DEFAULT_SERVICE, 1))}
              className="shrink-0 text-amber-700 font-semibold text-body hover:underline"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="grid lg:grid-cols-[1.85fr_1fr] gap-6 lg:gap-8 items-start">
          <div className="space-y-6">
            <div className="bg-white rounded-card border border-slate-200 p-6 sm:p-6 shadow-card">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  {step === 1 && <Step1Plan data={data} setData={setData} showPropertyDetails={step1ShowPropertyDetails} setShowPropertyDetails={setStep1ShowPropertyDetails} onServiceSelect={onServiceSelect} />}
                  {step === 2 && <Step2Schedule data={data} setData={setData} showDateTime={step2ShowDateTime} setShowDateTime={setStep2ShowDateTime} onTimeSlotSelect={handleTimeSlotSelect} />}
                  {step === 3 && (
                    <Step3Cleaner
                      data={data}
                      setData={setData}
                      cleaners={bookingCleaners ?? []}
                      cleanersLoading={bookingCleaners === null}
                    />
                  )}
                  {step === 4 && <Step4Details data={data} setData={setData} errors={errors} />}
                  {step === 5 && <Step5Payment data={data} setData={setData} pricing={pricing} onPaystackPay={handlePaystackPay} isProcessing={isProcessing} paymentError={paymentError} />}
                </motion.div>
              </AnimatePresence>

              {(step > 1 || (step === 1 && step1ShowPropertyDetails)) && (
                <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
                  {step > 1 && <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-3.5 border border-slate-200 text-slate-600 font-semibold rounded-card hover:bg-slate-50 transition-all text-body"><ChevronLeft className="w-5 h-5" /> Back</button>}
                  {step === 2 && !step2ShowDateTime ? (
                    <button type="button" onClick={() => setStep2ShowDateTime(true)} className="flex-1 bg-blue-600 text-white font-semibold py-3.5 rounded-card shadow-card hover:bg-blue-700 flex items-center justify-center gap-2 transition-all text-body">
                      Continue
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : step < 5 && (step !== 2 || step2ShowDateTime) ? (
                    <button type="button" onClick={nextStep} disabled={step < 5 && !canProceed()} className="flex-1 bg-blue-600 text-white font-semibold py-3.5 rounded-card shadow-card hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all text-body">
                      {step === 5 ? "Confirm Booking" : "Continue to " + STEP_LABELS[step]}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 space-y-6 order-summary-panel">
            <div className="bg-white rounded-card border border-slate-200 p-6 shadow-card">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <CreditCard className="w-5 h-5" />
                <span className="text-helper font-semibold uppercase tracking-widest">Order Summary</span>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-slate-900">R{pricing.total}</span>
                <span className="text-small text-slate-400 ml-1">Total Estimate</span>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-small pb-2 border-b border-slate-100">
                  <span className="opacity-50">Service</span>
                  <span className="font-semibold text-slate-900">{SERVICES.find((s) => s.id === data.service)?.title}</span>
                </div>
                <div className="flex justify-between text-small pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Schedule</span>
                  <span className="font-semibold text-slate-900">{data.date ? (data.time ? `${formatDate(data.date)}, ${data.time}` : formatDate(data.date)) : "Not set"}</span>
                </div>
                {data.extras.length > 0 && <div className="flex justify-between text-small pb-2 border-b border-slate-100"><span className="text-slate-500">Extras</span><span className="font-semibold text-slate-900">{data.extras.length} items (R{pricing.extrasTotal})</span></div>}
                <div className="flex justify-between text-small pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Professional</span>
                  <span className="font-semibold text-slate-900">
                    {data.assignMe
                      ? "We'll assign"
                      : data.cleanerId
                        ? (bookingCleaners ?? []).find((c) => c.id === data.cleanerId)?.name ?? "Cleaner"
                        : data.teamId
                          ? TEAMS.find((t) => t.id === data.teamId)?.name
                          : "TBD"}
                  </span>
                </div>
                {data.propertyType === "office" && pricing.officeSizeAdd > 0 && (
                  <div className="flex justify-between text-small pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Office size</span>
                    <span className="font-semibold text-slate-900">R{pricing.officeSizeAdd}</span>
                  </div>
                )}
                {data.propertyType !== "office" && pricing.extraRoomsAdd > 0 && (
                  <div className="flex justify-between text-small pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Extra rooms</span>
                    <span className="font-semibold text-slate-900">R{pricing.extraRoomsAdd}</span>
                  </div>
                )}
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-small"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-900">R{pricing.subtotal}</span></div>
                  {pricing.discountAmount > 0 && <div className="flex justify-between text-small text-emerald-600"><span>Discount ({data.promoCode})</span><span className="font-semibold">-R{pricing.discountAmount}</span></div>}
                  {pricing.tipAmount > 0 && <div className="flex justify-between text-small"><span className="text-slate-500">Tip</span><span className="font-medium text-slate-900">R{pricing.tipAmount}</span></div>}
                </div>
              </div>
              <div className="mt-6 bg-slate-50 rounded-card p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p className="text-helper leading-relaxed text-slate-600">Your booking is protected by our 100% Satisfaction Guarantee.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer
        className={`fixed bottom-0 left-0 right-0 z-30 h-16 shrink-0 border-t border-slate-200 bg-footer-bg items-center ${(step > 1 || (step === 1 && step1ShowPropertyDetails)) ? "hidden lg:flex" : "flex"}`}
      >
        <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-end">
          <p className="text-helper text-slate-500">© {new Date().getFullYear()} Shift South (Pty) Ltd, all rights reserved</p>
        </div>
      </footer>

      {(step > 1 || (step === 1 && step1ShowPropertyDetails)) && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 pb-8 safe-area-pb">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-helper font-black text-slate-400 uppercase tracking-widest">Total Due</span>
              <span className="text-2xl font-black text-slate-900">R{pricing.total}</span>
            </div>
            <div className="text-helper font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">Step {step} of 5</div>
          </div>
          <div className="flex gap-2">
            {step > 1 && <button type="button" onClick={prevStep} className="p-4 border-2 border-slate-200 rounded-2xl text-slate-600"><ChevronLeft className="w-6 h-6" /></button>}
            {step !== 2 && step < 5 && (
              <button type="button" onClick={nextStep} disabled={!canProceed()} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200">
                Continue
              </button>
            )}
          </div>
        </div>
      )}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authModalMode}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setAuthModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
