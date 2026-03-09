"use server";

import { createServerSupabase } from "@/lib/supabase/server";

export interface ActivePricingConfigRow {
  serviceType: string | null;
  priceType: string;
  itemName: string | null;
  price: number;
  effectiveDate: string;
}

/**
 * Fetch active pricing rules for booking calculations.
 * Uses service role to bypass RLS (no public policies on pricing tables).
 */
export async function getActivePricingConfig(): Promise<ActivePricingConfigRow[]> {
  const supabase = createServerSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("pricing_config")
    .select("service_type, price_type, item_name, price, effective_date, end_date, is_active")
    .eq("is_active", true)
    .lte("effective_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`);

  if (error || !data) {
    return [];
  }

  return (data as any[]).map((row) => ({
    serviceType: row.service_type ?? null,
    priceType: row.price_type ?? "",
    itemName: row.item_name ?? null,
    price: Number(row.price ?? 0),
    effectiveDate: row.effective_date ?? today,
  }));
}

