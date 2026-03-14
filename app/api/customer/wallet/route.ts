import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

async function getCustomerAuth(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const tokenData = token as (null | { role?: unknown; email?: unknown });
  const role = typeof tokenData?.role === "string" ? tokenData.role : undefined;
  const email = typeof tokenData?.email === "string" ? tokenData.email : undefined;

  if (!token || role !== "customer" || !email) {
    return { ok: false as const, email: null };
  }
  return { ok: true as const, email: email.toLowerCase() };
}

/**
 * GET /api/customer/wallet
 * Returns balance (sum of unused credits in cents) and list of credit entries.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getCustomerAuth(req);
    if (!auth.ok || !auth.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", auth.email)
      .eq("role", "customer")
      .maybeSingle();

    if (!profile?.id) {
      return NextResponse.json(
        { balanceCents: 0, credits: [] },
        { status: 200 }
      );
    }

    const { data: rows, error } = await supabase
      .from("customer_wallet_credits")
      .select("id, amount_cents, reason, reference_type, applied_at, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching wallet credits:", error);
      return NextResponse.json(
        { error: "Failed to load wallet" },
        { status: 500 }
      );
    }

    const credits = (rows ?? []).map((r: { amount_cents: number; applied_at: string | null; created_at: string; id: string; reason: string; reference_type: string | null }) => ({
      id: r.id,
      amountCents: r.amount_cents,
      reason: r.reason,
      referenceType: r.reference_type ?? null,
      appliedAt: r.applied_at ?? null,
      createdAt: r.created_at,
    }));

    const balanceCents = credits
      .filter((c) => !c.appliedAt)
      .reduce((sum, c) => sum + c.amountCents, 0);

    return NextResponse.json(
      { balanceCents, balanceFormatted: `R${(balanceCents / 100).toFixed(0)}`, credits },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error in customer wallet GET:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading wallet" },
      { status: 500 }
    );
  }
}
