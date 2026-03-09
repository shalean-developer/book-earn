import { NextResponse } from "next/server";
import { loadProfileForAccessToken } from "@/app/lib/load-profile-for-token";

/**
 * POST /api/auth/profile
 * Body: { accessToken: string }
 * Returns the profile for the session identified by the JWT.
 * Use this right after sign-in/sign-up when cookies may not be set yet.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    let accessToken = bearerToken;
    if (!accessToken) {
      const body = await request.json().catch(() => ({}));
      accessToken =
        typeof body?.accessToken === "string" ? body.accessToken : undefined;
    }
    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing accessToken" },
        { status: 400 }
      );
    }
    const result = await loadProfileForAccessToken(accessToken);
    if (!result.profile) {
      return NextResponse.json(
        { profile: null, error: result.error ?? "Profile could not be loaded." },
        { status: 200 }
      );
    }
    return NextResponse.json({ profile: result.profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
