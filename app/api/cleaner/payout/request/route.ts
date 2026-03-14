import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

const EARLY_CASHOUT_FEE_RANDS = 5;
const MIN_AVAILABLE_FOR_EARLY_RANDS = 6; // so after R5 fee they receive at least R1

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const t = token as (null | { role?: unknown; phone?: unknown });
    const role = typeof t?.role === "string" ? t.role : undefined;
    const phone = typeof t?.phone === "string" ? t.phone : undefined;

    if (!token || role !== "cleaner" || !phone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const type = typeof body.type === "string" ? body.type : "early";

    if (type !== "early") {
      return NextResponse.json(
        { error: "Only early cash out is supported via this endpoint. Weekly payout is automatic." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "cleaner")
      .eq("phone", phone)
      .single();

    const cleanerId = profile?.id as string | undefined;
    if (!cleanerId) {
      return NextResponse.json({ error: "Cleaner profile not found" }, { status: 401 });
    }

    const { data: availableData, error: availableError } = await supabase.rpc(
      "get_cleaner_available_payout",
      { p_cleaner_id: cleanerId },
    );

    if (availableError) {
      console.error("get_cleaner_available_payout RPC error:", availableError);
      return NextResponse.json(
        { error: "Could not load available payout" },
        { status: 500 },
      );
    }

    const available = Number(availableData ?? 0);
    if (available < MIN_AVAILABLE_FOR_EARLY_RANDS) {
      return NextResponse.json(
        {
          error: `Minimum R${MIN_AVAILABLE_FOR_EARLY_RANDS} required for early cash out (after R${EARLY_CASHOUT_FEE_RANDS} fee you receive the rest).`,
        },
        { status: 400 },
      );
    }

    const amountRands = available - EARLY_CASHOUT_FEE_RANDS;
    const { error: insertError } = await supabase.from("cleaner_payouts").insert({
      cleaner_id: String(cleanerId),
      amount_rands: amountRands,
      fee_rands: EARLY_CASHOUT_FEE_RANDS,
      type: "early",
      status: "pending",
    });

    if (insertError) {
      console.error("Error inserting cleaner payout:", insertError);
      return NextResponse.json(
        { error: "Failed to request payout" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        amountReceived: amountRands,
        fee: EARLY_CASHOUT_FEE_RANDS,
        message: `R${amountRands} will be paid to your bank account. R${EARLY_CASHOUT_FEE_RANDS} early cash out fee applied.`,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Unexpected error in cleaner payout request:", err);
    return NextResponse.json(
      { error: "Unexpected error requesting payout" },
      { status: 500 },
    );
  }
}
