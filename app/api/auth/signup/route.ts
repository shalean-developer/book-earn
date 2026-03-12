import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const password = typeof body?.password === "string" ? String(body.password) : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      const msg = authError.message?.toLowerCase() ?? "";
      if (msg.includes("already registered") || msg.includes("duplicate key")) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: authError.message || "Failed to create account" },
        { status: 400 },
      );
    }

    const profileId = authData?.user?.id;
    if (!profileId) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    const profileRow = {
      name,
      email,
      phone: phone || null,
      role: "customer" as const,
    };

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update(profileRow)
      .eq("id", profileId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      const msg = updateError.message?.toLowerCase() ?? "";
      if (msg.includes("violates foreign key constraint") || msg.includes("foreign key")) {
        return NextResponse.json(
          {
            error:
              "Profile could not be linked to auth user. Please contact support or try again later.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: "Failed to save customer profile", detail: updateError.message },
        { status: 500 },
      );
    }

    if (!updated) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: profileId,
        ...profileRow,
      });
      if (insertError) {
        return NextResponse.json(
          { error: "Failed to save customer profile", detail: insertError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { id: profileId, message: "Account created successfully" },
      { status: 201 },
    );
  } catch (err) {
    console.error("Unexpected error in signup route:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

