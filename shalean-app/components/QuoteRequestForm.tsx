"use client";

import React, { useState } from "react";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import type { ServiceType } from "@/lib/booking-routes";
import { submitQuoteRequest, type SubmitQuoteRequestPayload } from "@/app/actions/quote";

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

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "standard", label: "Standard Cleaning" },
  { value: "deep", label: "Deep Cleaning" },
  { value: "move", label: "Move In/Out Cleaning" },
  { value: "airbnb", label: "Airbnb Cleaning" },
  { value: "carpet", label: "Carpet Cleaning" },
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "office", label: "Office" },
];

const OFFICE_SIZES = ["Small", "Medium", "Large"];

// Add-ons by service (same as booking flow; price shown for quote context)
const ADDONS_DEEP_MOVE: { id: string; label: string; price: number }[] = [
  { id: "balcony", label: "Balcony Cleaning", price: 200 },
  { id: "carpet_cleaning", label: "Carpet Cleaning", price: 200 },
  { id: "ceiling", label: "Ceiling Cleaning", price: 200 },
  { id: "couch", label: "Couch Cleaning", price: 200 },
  { id: "garage", label: "Garage Cleaning", price: 200 },
  { id: "mattress", label: "Mattress Cleaning", price: 200 },
  { id: "outside_windows", label: "Outside Window Cleaning", price: 200 },
];
const ADDONS_STANDARD_AIRBNB: { id: string; label: string; price: number }[] = [
  { id: "fridge", label: "Inside Fridge", price: 150 },
  { id: "oven", label: "Inside Oven", price: 150 },
  { id: "cabinets", label: "Inside Cabinets", price: 180 },
  { id: "windows", label: "Interior Windows", price: 200 },
  { id: "walls", label: "Interior Walls", price: 120 },
  { id: "laundry_ironing", label: "Laundry / Ironing", price: 150 },
  { id: "extra_cleaner", label: "Extra Cleaner", price: 120 },
  { id: "equipment_supply", label: "Equipment supply", price: 100 },
];
const ADDONS_CARPET: { id: string; label: string; price: number }[] = [
  { id: "extra_cleaner", label: "Extra Cleaner", price: 120 },
  { id: "property_to_move", label: "Property to move?", price: 0 },
];

function getAddonsForService(service: ServiceType): { id: string; label: string; price: number }[] {
  if (service === "deep" || service === "move") return ADDONS_DEEP_MOVE;
  if (service === "standard" || service === "airbnb") return ADDONS_STANDARD_AIRBNB;
  if (service === "carpet") return ADDONS_CARPET;
  return ADDONS_STANDARD_AIRBNB;
}

export const QuoteRequestForm = ({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SubmitQuoteRequestPayload>({
    service: "standard",
    propertyType: "apartment",
    officeSize: "",
    bedrooms: 1,
    bathrooms: 1,
    extraRooms: 0,
    workingArea: "",
    extras: [],
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await submitQuoteRequest(form);
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Request received</h3>
        <p className="text-slate-600 mb-6">
          We&apos;ll send you a custom quote shortly. Check your email and phone for our response.
        </p>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("booking")}
            className="text-blue-600 font-semibold hover:underline"
          >
            Book now instead
          </button>
        )}
      </div>
    );
  }

  const isOffice = form.propertyType === "office";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="text-xl font-bold text-slate-900 mb-1">Request a quote</h3>
      <p className="text-slate-600 text-sm mb-6">
        Not ready to book? Tell us what you need and we&apos;ll send you a custom quote.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Service */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Service <span className="text-red-500">*</span>
          </label>
          <select
            value={form.service}
            onChange={(e) => {
              const newService = e.target.value as ServiceType;
              const validIds = getAddonsForService(newService).map((a) => a.id);
              setForm((p) => ({
                ...p,
                service: newService,
                extras: p.extras?.filter((id) => validIds.includes(id)) ?? [],
              }));
            }}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400"
            required
          >
            {SERVICE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Property type */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Property type <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    propertyType: pt.value,
                    officeSize: pt.value === "office" ? p.officeSize : "",
                  }))
                }
                className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                  form.propertyType === pt.value
                    ? "border-blue-600 bg-blue-50/50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {isOffice && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Office size
            </label>
            <select
              value={form.officeSize}
              onChange={(e) => setForm((p) => ({ ...p, officeSize: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            >
              <option value="">Select size</option>
              {OFFICE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Rooms */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Bedrooms
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={form.bedrooms}
              onChange={(e) =>
                setForm((p) => ({ ...p, bedrooms: Math.max(0, parseInt(e.target.value, 10) || 0) }))
              }
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Bathrooms
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={form.bathrooms}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  bathrooms: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Extra rooms
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={form.extraRooms}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  extraRooms: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
          </div>
        </div>

        {/* Working area */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Area <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <select
              value={form.workingArea}
              onChange={(e) => setForm((p) => ({ ...p, workingArea: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 appearance-none"
              required
            >
              <option value="">Select your area</option>
              {WORKING_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add-ons (optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Add-ons (optional)
          </label>
          <p className="text-slate-500 text-sm mb-2">
            Select any extras to include in your quote.
          </p>
          <div className="flex flex-wrap gap-2">
            {getAddonsForService(form.service).map((addon) => {
              const selected = form.extras?.includes(addon.id) ?? false;
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      extras: selected
                        ? (p.extras ?? []).filter((id) => id !== addon.id)
                        : [...(p.extras ?? []), addon.id],
                    }))
                  }
                  className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "border-blue-600 bg-blue-50/50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {addon.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3 sm:grid-cols-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.customerPhone}
              onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
              placeholder="Phone number"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Address (optional)
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="Street address"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Message (optional)
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            placeholder="Any special requests or details..."
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            "Request quote"
          )}
        </button>

        {onNavigate && (
          <p className="text-center text-sm text-slate-500">
            Ready to book?{" "}
            <button
              type="button"
              onClick={() => onNavigate("booking")}
              className="text-blue-600 font-semibold hover:underline"
            >
              Book now
            </button>
          </p>
        )}
      </form>
    </div>
  );
};
