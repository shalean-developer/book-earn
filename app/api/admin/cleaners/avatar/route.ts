import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string } | null)?.role;
  if (token && role === "admin") return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const profileId = formData.get("profileId") as string | null;

    if (!file || !profileId) {
      return NextResponse.json(
        { error: "Missing file or profileId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `cleaners/${profileId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Error uploading cleaner avatar:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload avatar", detail: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar: publicUrl })
      .eq("id", profileId);

    if (profileError) {
      console.error("Error updating profile avatar:", profileError);
      return NextResponse.json(
        { error: "Failed to save avatar URL", detail: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { avatarUrl: publicUrl, message: "Avatar uploaded successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Unexpected error uploading cleaner avatar:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

