"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DollarSign, Plus, Trash2 } from "lucide-react";

type PricingRow = {
  id?: string;
  service_type: string;
  price_type: string;
  item_name: string | null;
  price: number;
  effective_date: string;
  end_date: string | null;
  is_active: boolean;
};

const SERVICE_OPTIONS = [
  "Standard",
  "Deep",
  "Airbnb",
  "Laundry & Ironing",
  "Carpet",
  "Move In/Out",
];

const knownPriceTypes = [
  "base",
  "bedroom_add",
  "bathroom_add",
  "extra_room_add",
  "office_private_add",
  "office_meeting_add",
  "office_scale_small",
  "office_scale_medium",
  "office_scale_large",
  "office_scale_xlarge",
  "carpet_room",
  "loose_rug",
  "carpet_extra_cleaner",
  "frequency_discount_weekly",
  "frequency_discount_multi_week",
  "service_fee",
  "equipment_charge",
];

const extrasIds = [
  "fridge",
  "oven",
  "windows",
  "cabinets",
  "walls",
  "extra_cleaner",
  "laundry_load",
  "ironing",
  "linen_refresh",
  "guest_supplies",
  "delicates",
  "stain_treatment",
  "equipment",
  "balcony",
  "carpet_deep",
  "ceiling",
  "couch",
  "garage",
  "mattress",
  "outside_windows",
];

function findRow(
  rows: PricingRow[],
  service: string,
  priceType: string
): PricingRow | undefined {
  return rows.find(
    (r) =>
      r.service_type === service &&
      r.price_type.toLowerCase() === priceType.toLowerCase()
  );
}

function findExtraRow(
  rows: PricingRow[],
  service: string,
  extraId: string
): PricingRow | undefined {
  const explicit = rows.find(
    (r) =>
      r.service_type === service &&
      r.price_type.toLowerCase() === `extra:${extraId}`
  );
  if (explicit) return explicit;

  const generic = rows.find(
    (r) =>
      r.service_type === service &&
      r.price_type.toLowerCase() === "extra" &&
      (r.item_name ?? "").toLowerCase().includes(extraId.replace("_", " "))
  );
  return generic;
}

interface FieldConfig {
  label: string;
  priceType: string;
  help?: string;
}

const coreFields: FieldConfig[] = [
  { label: "Base price", priceType: "base" },
  {
    label: "Service fee",
    priceType: "service_fee",
    help: "Per-booking fee added on top of the base price.",
  },
  {
    label: "Equipment charge",
    priceType: "equipment_charge",
    help: "Flat fee covering products and equipment.",
  },
];

const homeFields: FieldConfig[] = [
  {
    label: "Per extra bedroom",
    priceType: "bedroom_add",
    help: "Applied for each bedroom above the first.",
  },
  {
    label: "Per extra bathroom",
    priceType: "bathroom_add",
    help: "Applied for each bathroom above the first.",
  },
  {
    label: "Per extra room",
    priceType: "extra_room_add",
    help: "Offices, studies or other rooms.",
  },
];

const officeFields: FieldConfig[] = [
  {
    label: "Per private office",
    priceType: "office_private_add",
  },
  {
    label: "Per meeting room",
    priceType: "office_meeting_add",
  },
  {
    label: "Small office add-on",
    priceType: "office_scale_small",
  },
  {
    label: "Medium office add-on",
    priceType: "office_scale_medium",
  },
  {
    label: "Large office add-on",
    priceType: "office_scale_large",
  },
  {
    label: "XL office add-on",
    priceType: "office_scale_xlarge",
  },
];

const carpetFields: FieldConfig[] = [
  {
    label: "Per carpeted room",
    priceType: "carpet_room",
  },
  {
    label: "Per loose rug",
    priceType: "loose_rug",
  },
  {
    label: "Per extra carpet cleaner",
    priceType: "carpet_extra_cleaner",
  },
];

const frequencyFields: FieldConfig[] = [
  {
    label: "Weekly discount (%)",
    priceType: "frequency_discount_weekly",
    help: "Enter 10 for 10% off weekly cleans.",
  },
  {
    label: "Multi‑week discount (%)",
    priceType: "frequency_discount_multi_week",
    help: "For multiple cleans per week.",
  },
];

const AdminPricingManager: React.FC = () => {
  const [service, setService] = useState<string>("Standard");
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceRows = useMemo(
    () => rows.filter((r) => r.service_type === service),
    [rows, service]
  );

  const loadRows = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("service_type", service);
      const res = await fetch(`/api/admin/pricing?${params.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json && typeof json.error === "string" && json.error) ||
            "Failed to load pricing"
        );
      }
      setRows((prev) => {
        const others = prev.filter((r) => r.service_type !== service);
        return [...others, ...(json.items ?? [])];
      });
    } catch (e: any) {
      setError(e.message || "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const upsertRow = async (partial: {
    id?: string;
    price_type: string;
    price: number;
  }) => {
    setSaving(true);
    setError(null);
    try {
      const base = findRow(rows, service, partial.price_type);
      const payload: PricingRow = {
        id: base?.id ?? partial.id,
        service_type: service,
        price_type: partial.price_type,
        item_name: base?.item_name ?? null,
        price: partial.price,
        effective_date:
          base?.effective_date ?? new Date().toISOString().slice(0, 10),
        end_date: base?.end_date ?? null,
        is_active: base?.is_active ?? true,
      };

      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json && typeof json.error === "string" && json.error) ||
            "Failed to save pricing"
        );
      }

      setRows((prev) => {
        const next = [...prev];
        const saved = (json as { item?: PricingRow }).item;
        if (saved) {
          const idx = next.findIndex((r) => r.id === saved.id);
          if (idx >= 0) {
            next[idx] = saved;
          } else {
            next.push(saved);
          }
        }
        return next;
      });
    } catch (e: any) {
      setError(e.message || "Failed to save pricing");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRow = async (row: PricingRow) => {
    if (!row.id) return;
    setSaving(true);
    setError(null);
    try {
      const params = new URLSearchParams({ id: row.id });
      const res = await fetch(`/api/admin/pricing?${params.toString()}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json && typeof json.error === "string" && json.error) ||
            "Failed to delete rule"
        );
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e: any) {
      setError(e.message || "Failed to delete rule");
    } finally {
      setSaving(false);
    }
  };

  const renderNumberField = (field: FieldConfig) => {
    const row = findRow(serviceRows, service, field.priceType);
    const value =
      field.priceType.startsWith("frequency_discount") && row
        ? row.price * 100
        : row?.price ?? 0;

    return (
      <div key={field.priceType} className="space-y-1">
        <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>{field.label}</span>
          {row && !knownPriceTypes.includes(row.price_type) && (
            <span className="text-[10px] text-amber-600">
              Using custom type: {row.price_type}
            </span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            value={value || ""}
            onChange={(e) => {
              const raw = Number(e.target.value || "0");
              const price = field.priceType.startsWith("frequency_discount")
                ? raw / 100
                : raw;
              if (Number.isNaN(price)) return;
              void upsertRow({ price_type: field.priceType, price });
            }}
          />
          {field.priceType.startsWith("frequency_discount") ? (
            <span className="text-xs text-slate-500">%</span>
          ) : (
            <span className="text-xs text-slate-500">R</span>
          )}
        </div>
        {field.help && (
          <p className="text-[11px] text-slate-500">{field.help}</p>
        )}
      </div>
    );
  };

  const renderExtraField = (extraId: string) => {
    const row = findExtraRow(serviceRows, service, extraId);
    const label = extraId
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");

    return (
      <div key={extraId} className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">
            {label}
          </label>
          {row && (
            <button
              type="button"
              onClick={() => void handleDeleteRow(row)}
              className="text-[10px] text-rose-500 hover:text-rose-600 inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            value={row?.price ?? ""}
            onChange={(e) => {
              const price = Number(e.target.value || "0");
              if (Number.isNaN(price)) return;
              void upsertRow({
                id: row?.id,
                price_type: `extra:${extraId}`,
                price,
              });
            }}
          />
          <span className="text-xs text-slate-500">R</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pricing</h2>
            <p className="text-slate-500 text-sm">
              Control base prices, multipliers, extras and discounts for each
              service. Changes apply to new bookings immediately.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {SERVICE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {loading && (
            <span className="text-xs text-slate-500">Loading pricing…</span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Core pricing
              </h3>
              {saving && (
                <span className="text-[11px] text-slate-500">
                  Saving changes…
                </span>
              )}
            </div>
            <div className="grid gap-4">
              {coreFields.map(renderNumberField)}
            </div>
          </div>

          {service !== "Carpet" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Home multipliers
              </h3>
              <div className="grid gap-4">
                {homeFields.map(renderNumberField)}
              </div>
            </div>
          )}

          {service === "Carpet" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Carpet multipliers
              </h3>
              <div className="grid gap-4">
                {carpetFields.map(renderNumberField)}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Frequency discounts
            </h3>
            <div className="grid gap-4">
              {frequencyFields.map(renderNumberField)}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Office pricing
            </h3>
            <p className="text-[11px] text-slate-500">
              These values are only used when the property type is set to
              office.
            </p>
            <div className="grid gap-4">
              {officeFields.map(renderNumberField)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Extras</h3>
              <button
                type="button"
                onClick={() => {
                  if (!findRow(serviceRows, service, "extra")) {
                    void upsertRow({ price_type: "extra", price: 0 });
                  }
                }}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700"
              >
                <Plus className="w-3 h-3" />
                Allow custom extras
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {extrasIds.map(renderExtraField)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPricingManager;

