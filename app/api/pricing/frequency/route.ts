import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const serviceType = req.nextUrl.searchParams.get("service_type");

    if (!serviceType) {
      return NextResponse.json(
        { error: "Missing service_type parameter" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("pricing_config")
      .select(
        "price_type, item_name, price, effective_date, end_date, is_active, service_type"
      )
      .eq("service_type", serviceType)
      .eq("is_active", true)
      .lte("effective_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (error) {
      console.error("Failed to load frequency discounts", error);
      return NextResponse.json(
        { error: "Failed to load frequency discounts" },
        { status: 500 }
      );
    }

    let weekly: number | null = null;
    let multiWeek: number | null = null;

    for (const row of data ?? []) {
      const priceType = String(row.price_type ?? "").toLowerCase();
      if (priceType === "frequency_discount_weekly") {
        weekly = row.price as number;
      } else if (
        priceType === "frequency_discount_multi_week" ||
        priceType === "frequency_discount_multiweek"
      ) {
        multiWeek = row.price as number;
      }
    }

    return NextResponse.json(
      {
        serviceType,
        weeklyDiscount: weekly,
        multiWeekDiscount: multiWeek,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/pricing/frequency", error);
    return NextResponse.json(
      { error: "Failed to load frequency discounts" },
      { status: 500 }
    );
  }
}

