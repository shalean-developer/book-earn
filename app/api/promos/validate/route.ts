import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, serviceType, subtotal } = body as {
      code?: string;
      serviceType?: string;
      subtotal?: number;
    };

    const normalizedCode = code?.toUpperCase().trim();
    if (!normalizedCode) {
      return NextResponse.json(
        { valid: false, reason: "Missing promo code" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("promo_codes")
      .select(
        "code, percentage_off, amount_off, is_active, start_date, end_date, service_type"
      )
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .lte("start_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to validate promo code", error);
      return NextResponse.json(
        { valid: false, reason: "Failed to validate promo code" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { valid: false, reason: "Invalid or expired promo code" },
        { status: 200 }
      );
    }

    if (serviceType && data.service_type && data.service_type !== serviceType) {
      return NextResponse.json(
        { valid: false, reason: "Promo not applicable to this service" },
        { status: 200 }
      );
    }

    const baseSubtotal = typeof subtotal === "number" ? subtotal : 0;

    const percentageOff = (data.percentage_off ?? 0) as number;
    const amountOff = (data.amount_off ?? 0) as number;

    let discountAmount = 0;
    if (percentageOff > 0) {
      discountAmount = Math.round(baseSubtotal * percentageOff);
    } else if (amountOff > 0) {
      discountAmount = Math.min(baseSubtotal, amountOff);
    }

    return NextResponse.json(
      {
        valid: discountAmount > 0,
        code: data.code,
        percentageOff,
        amountOff,
        discountAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/promos/validate", error);
    return NextResponse.json(
      { valid: false, reason: "Unexpected error validating promo code" },
      { status: 500 }
    );
  }
}

