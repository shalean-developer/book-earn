import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string } | null)?.role;
  if (token && role === "admin") return true;
  return false;
}

function isPlaceholderEmail(email: string | null): boolean {
  if (!email || typeof email !== "string") return true;
  const e = email.toLowerCase();
  return (
    e.endsWith("@cleaner-import.local") || e.includes("cleaner-import")
  );
}

/**
 * POST /api/admin/cleaners/[id]/reset-password
 * Body: { newPassword: string }
 * Resets the cleaner's auth password (admin only).
 * For imported cleaners with no auth user: if profile has a real email (edited by admin),
 * creates the auth user and migrates the profile so the cleaner can log in without a new profile.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const oldId = id;
    if (!oldId) {
      return NextResponse.json(
        { error: "Cleaner ID required" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword.trim() : "";

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", oldId)
      .eq("role", "cleaner")
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Cleaner not found" },
        { status: 404 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      oldId,
      { password: newPassword }
    );

    if (!authError) {
      return NextResponse.json({ message: "Password reset successfully" });
    }

    const msg = authError.message || "";
    const isMissingUser =
      /database error loading user|user not found|record not found/i.test(msg);

    if (!isMissingUser) {
      console.error("Error resetting cleaner password:", authError);
      return NextResponse.json(
        { error: authError.message || "Failed to reset password" },
        { status: 500 }
      );
    }

    // No auth user: offer to create login if they have a real email (admin can edit email on the same profile).
    if (isPlaceholderEmail(profile.email)) {
      return NextResponse.json(
        {
          error:
            "This cleaner was imported and has no login account. Edit their email to a real address (e.g. estery@example.com), save, then try Reset password again to create their login—no new profile is created.",
        },
        { status: 400 }
      );
    }

    // Create auth user with the profile's (edited) email and migrate profile to the new user id.
    const email = String(profile.email).trim().toLowerCase();
    const { data: authData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
        user_metadata: { name: profile.name || "" },
      });

    if (createError) {
      console.error("Error creating auth user for imported cleaner:", createError);
      if (createError.message?.toLowerCase().includes("already registered")) {
        return NextResponse.json(
          {
            error:
              "A user with this email already exists. Use a different email for this cleaner in Edit, then try again.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error:
            createError.message ||
            "Could not create login for this cleaner. Try again or use Add New Cleaner.",
        },
        { status: 500 }
      );
    }

    const newId = authData?.user?.id;
    if (!newId) {
      return NextResponse.json(
        { error: "Failed to create login" },
        { status: 500 }
      );
    }

    // Copy profile to the new auth user id (same profile data, no new profile—just linked to new login).
    const { id: _omit, ...rest } = profile as Record<string, unknown>;
    const profileRow = { ...rest, id: newId } as Record<string, unknown>;

    const { error: updateNewError } = await supabase
      .from("profiles")
      .update(rest)
      .eq("id", newId);

    if (updateNewError) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert(profileRow);
      if (insertError) {
        console.error("Error copying profile to new id:", insertError);
        return NextResponse.json(
          {
            error:
              "Login was created but profile could not be linked. Contact support.",
          },
          { status: 500 }
        );
      }
    }

    await supabase.from("bookings").update({ cleaner_id: newId }).eq("cleaner_id", oldId);
    await supabase.from("cleaner_payouts").update({ cleaner_id: newId }).eq("cleaner_id", oldId);
    await supabase.from("booking_messages").update({ sender_cleaner_id: newId }).eq("sender_cleaner_id", oldId);
    await supabase.from("profiles").update({ referred_by: newId }).eq("referred_by", oldId);
    await supabase.from("referrals").update({ referrer_id: newId }).eq("referrer_id", oldId);
    await supabase.from("referrals").update({ referee_id: newId }).eq("referee_id", oldId);

    const { error: deleteErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", oldId);

    if (deleteErr) {
      console.error("Error removing old profile row:", deleteErr);
      return NextResponse.json(
        {
          error:
            "Login created and profile updated, but old profile row could not be removed. Contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "Login created successfully. This cleaner can now sign in with the email you set and the new password.",
    });
  } catch (error) {
    console.error("Unexpected error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
