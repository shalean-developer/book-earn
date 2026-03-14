import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceType = req.nextUrl.searchParams.get("service_type");

    let query = supabase
      .from("pricing_config")
      .select(
        "id, service_type, price_type, item_name, price, effective_date, end_date, is_active"
      )
      .order("service_type", { ascending: true })
      .order("price_type", { ascending: true });

    if (serviceType) {
      query = query.eq("service_type", serviceType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading pricing_config:", error);
      return NextResponse.json(
        { error: "Failed to load pricing configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error("Unexpected error in admin pricing GET:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json().catch(() => ({}));

    const {
      id,
      service_type,
      price_type,
      item_name,
      price,
      effective_date,
      end_date,
      is_active,
    } = body ?? {};

    if (!service_type || !price_type || typeof price !== "number") {
      return NextResponse.json(
        { error: "Missing required fields (service_type, price_type, price)" },
        { status: 400 }
      );
    }

    const payload = {
      service_type,
      price_type,
      item_name: item_name ?? null,
      price,
      effective_date: effective_date ?? new Date().toISOString().slice(0, 10),
      end_date: end_date ?? null,
      is_active: typeof is_active === "boolean" ? is_active : true,
    };

    const { data, error } = await supabase
      .from("pricing_config")
      .upsert(
        id ? { id, ...payload } : payload,
        id ? { onConflict: "id" } : undefined
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error saving pricing_config:", error);
      return NextResponse.json(
        { error: "Failed to save pricing rule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    console.error("Unexpected error in admin pricing POST:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("pricing_config")
      .update({ is_active: false, end_date: today })
      .eq("id", id);

    if (error) {
      console.error("Error deleting pricing_config:", error);
      return NextResponse.json(
        { error: "Failed to delete pricing rule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in admin pricing DELETE:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

