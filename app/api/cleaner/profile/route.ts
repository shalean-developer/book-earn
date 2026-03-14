import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

type CleanerProfileResponse = {
  name: string | null;
  email: string | null;
  phone: string | null;
  bank_account_holder: string | null;
  bank_account_number: string | null;
  bank_branch_code: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
};

async function getCleanerAuth(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const t = token as (null | { role?: unknown; phone?: unknown });
  const role = typeof t?.role === "string" ? t.role : undefined;
  const phone = typeof t?.phone === "string" ? t.phone : undefined;
  if (!token || role !== "cleaner" || !phone) {
    return { ok: false as const, phone: null };
  }
  return { ok: true as const, phone };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getCleanerAuth(req);
    if (!auth.ok || !auth.phone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "name, email, phone, bank_account_holder, bank_account_number, bank_branch_code, bank_name, bank_account_type",
      )
      .eq("role", "cleaner")
      .eq("phone", auth.phone)
      .maybeSingle();

    if (error) {
      console.error("Error fetching cleaner profile:", error);
      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 },
      );
    }

    const profile: CleanerProfileResponse = {
      name: (data?.name as string | null) ?? null,
      email: (data?.email as string | null) ?? null,
      phone: (data?.phone as string | null) ?? auth.phone,
      bank_account_holder: (data?.bank_account_holder as string | null) ?? null,
      bank_account_number: (data?.bank_account_number as string | null) ?? null,
      bank_branch_code: (data?.bank_branch_code as string | null) ?? null,
      bank_name: (data?.bank_name as string | null) ?? null,
      bank_account_type: (data?.bank_account_type as string | null) ?? null,
    };

    return NextResponse.json({ profile }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in cleaner profile GET:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getCleanerAuth(req);
    if (!auth.ok || !auth.phone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<{
      name: string;
      phone: string;
      bank_account_holder: string;
      bank_account_number: string;
      bank_branch_code: string;
      bank_name: string;
      bank_account_type: string;
    }>;

    const patch: Record<string, string | null> = {};
    if (typeof body.name === "string") {
      patch.name = body.name.trim() || null;
    }
    if (typeof body.phone === "string") {
      patch.phone = body.phone.trim() || null;
    }
    if (typeof body.bank_account_holder === "string") {
      patch.bank_account_holder = body.bank_account_holder.trim() || null;
    }
    if (typeof body.bank_account_number === "string") {
      patch.bank_account_number = body.bank_account_number.trim().replace(/\s/g, "") || null;
    }
    if (typeof body.bank_branch_code === "string") {
      patch.bank_branch_code = body.bank_branch_code.trim().replace(/\s/g, "") || null;
    }
    if (typeof body.bank_name === "string") {
      patch.bank_name = body.bank_name.trim() || null;
    }
    if (typeof body.bank_account_type === "string") {
      const v = body.bank_account_type.trim().toLowerCase();
      patch.bank_account_type = v === "current" || v === "savings" || v === "transmission" ? v : body.bank_account_type.trim() || null;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No profile fields to update" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("role", "cleaner")
      .eq("phone", auth.phone)
      .select(
        "name, email, phone, bank_account_holder, bank_account_number, bank_branch_code, bank_name, bank_account_type",
      )
      .maybeSingle();

    if (error) {
      console.error("Error updating cleaner profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile", detail: error.message },
        { status: 500 },
      );
    }

    const profile: CleanerProfileResponse = {
      name: (data?.name as string | null) ?? null,
      email: (data?.email as string | null) ?? null,
      phone: (data?.phone as string | null) ?? auth.phone,
      bank_account_holder: (data?.bank_account_holder as string | null) ?? null,
      bank_account_number: (data?.bank_account_number as string | null) ?? null,
      bank_branch_code: (data?.bank_branch_code as string | null) ?? null,
      bank_name: (data?.bank_name as string | null) ?? null,
      bank_account_type: (data?.bank_account_type as string | null) ?? null,
    };

    return NextResponse.json({ profile }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in cleaner profile PATCH:", err);
    return NextResponse.json(
      { error: "Unexpected server error updating profile" },
      { status: 500 },
    );
  }
}
