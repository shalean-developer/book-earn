import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

type CustomerProfilePayload = {
  name?: string;
  phone?: string;
  preferred_contact_method?: string;
  timezone?: string;
  address_line1?: string;
  address_city?: string;
  address_region?: string;
  address_postal_code?: string;
};

type CustomerProfileResponse = {
  name: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact_method: string | null;
  timezone: string | null;
  address_line1: string | null;
  address_city: string | null;
  address_region: string | null;
  address_postal_code: string | null;
};

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

export async function GET(req: NextRequest) {
  try {
    const auth = await getCustomerAuth(req);
    if (!auth.ok || !auth.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "name, email, phone, preferred_contact_method, timezone, address_line1, address_city, address_region, address_postal_code",
      )
      .eq("email", auth.email)
      .eq("role", "customer")
      .maybeSingle();

    if (error) {
      console.error("Error fetching customer profile:", error);
      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 },
      );
    }

    const response: CustomerProfileResponse = {
      name: (data?.name as string | null) ?? null,
      email: (data?.email as string | null) ?? auth.email,
      phone: (data?.phone as string | null) ?? null,
      preferred_contact_method:
        (data?.preferred_contact_method as string | null) ?? null,
      timezone: (data?.timezone as string | null) ?? null,
      address_line1: (data?.address_line1 as string | null) ?? null,
      address_city: (data?.address_city as string | null) ?? null,
      address_region: (data?.address_region as string | null) ?? null,
      address_postal_code: (data?.address_postal_code as string | null) ?? null,
    };

    return NextResponse.json({ profile: response }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in customer profile GET:", err);
    return NextResponse.json(
      { error: "Unexpected server error loading profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getCustomerAuth(req);
    if (!auth.ok || !auth.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as CustomerProfilePayload;

    const patch: Record<string, unknown> = {};
    if (typeof body.name === "string") {
      patch.name = body.name.trim();
    }
    if (typeof body.phone === "string") {
      patch.phone = body.phone.trim() || null;
    }
    if (typeof body.preferred_contact_method === "string") {
      patch.preferred_contact_method = body.preferred_contact_method.trim() || null;
    }
    if (typeof body.timezone === "string") {
      patch.timezone = body.timezone.trim() || null;
    }
    if (typeof body.address_line1 === "string") {
      patch.address_line1 = body.address_line1.trim() || null;
    }
    if (typeof body.address_city === "string") {
      patch.address_city = body.address_city.trim() || null;
    }
    if (typeof body.address_region === "string") {
      patch.address_region = body.address_region.trim() || null;
    }
    if (typeof body.address_postal_code === "string") {
      patch.address_postal_code = body.address_postal_code.trim() || null;
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
      .eq("email", auth.email)
      .eq("role", "customer")
      .select(
        "name, email, phone, preferred_contact_method, timezone, address_line1, address_city, address_region, address_postal_code",
      )
      .maybeSingle();

    if (error) {
      console.error("Error updating customer profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile", detail: error.message },
        { status: 500 },
      );
    }

    const response: CustomerProfileResponse = {
      name: (data?.name as string | null) ?? null,
      email: (data?.email as string | null) ?? auth.email,
      phone: (data?.phone as string | null) ?? null,
      preferred_contact_method:
        (data?.preferred_contact_method as string | null) ?? null,
      timezone: (data?.timezone as string | null) ?? null,
      address_line1: (data?.address_line1 as string | null) ?? null,
      address_city: (data?.address_city as string | null) ?? null,
      address_region: (data?.address_region as string | null) ?? null,
      address_postal_code: (data?.address_postal_code as string | null) ?? null,
    };

    return NextResponse.json({ profile: response }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in customer profile PATCH:", err);
    return NextResponse.json(
      { error: "Unexpected server error updating profile" },
      { status: 500 },
    );
  }
}

