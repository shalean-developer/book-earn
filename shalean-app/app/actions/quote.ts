"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type { ServiceType } from "@/lib/booking-routes";

const VALID_SERVICES: ServiceType[] = ["standard", "deep", "move", "airbnb", "carpet"];
const VALID_PROPERTY_TYPES = ["apartment", "house", "office"];

export interface SubmitQuoteRequestPayload {
  service: ServiceType;
  propertyType: string;
  officeSize?: string;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  workingArea: string;
  extras?: string[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address?: string;
  message?: string;
}

export async function submitQuoteRequest(
  payload: SubmitQuoteRequestPayload
): Promise<{ ok: boolean; error?: string }> {
  const service = payload.service && VALID_SERVICES.includes(payload.service) ? payload.service : null;
  const propertyType =
    payload.propertyType && VALID_PROPERTY_TYPES.includes(payload.propertyType)
      ? payload.propertyType
      : null;
  const workingArea = String(payload.workingArea ?? "").trim();
  const name = String(payload.customerName ?? "").trim();
  const email = String(payload.customerEmail ?? "").trim();
  const phone = String(payload.customerPhone ?? "").trim();

  if (!service) return { ok: false, error: "Please select a service." };
  if (!propertyType) return { ok: false, error: "Please select a property type." };
  if (!workingArea) return { ok: false, error: "Please enter your area." };
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!email) return { ok: false, error: "Please enter your email." };
  if (!phone) return { ok: false, error: "Please enter your phone number." };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { ok: false, error: "Please enter a valid email address." };

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase.from("quote_requests").insert({
      service,
      property_type: propertyType,
      office_size: payload.officeSize?.trim() || null,
      bedrooms: Number(payload.bedrooms) || 0,
      bathrooms: Number(payload.bathrooms) || 0,
      extra_rooms: Number(payload.extraRooms) || 0,
      working_area: workingArea,
      extras: Array.isArray(payload.extras) ? payload.extras : [],
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      address: payload.address?.trim() || null,
      message: payload.message?.trim() || null,
      status: "new",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
