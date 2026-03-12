import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutesByRole: Record<string, ("admin" | "customer" | "cleaner")[]> = {
  "/admin": ["admin"],
  "/customer": ["customer"],
  "/cleaner": ["cleaner"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const matchedEntry = Object.entries(protectedRoutesByRole).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!matchedEntry) {
    return NextResponse.next();
  }

  const [route, allowedRoles] = matchedEntry;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (token as any).role as "admin" | "customer" | "cleaner" | undefined;

  if (!userRole || !allowedRoles.includes(userRole)) {
    const redirectTo =
      userRole === "admin"
        ? "/admin"
        : userRole === "customer"
        ? "/customer"
        : userRole === "cleaner"
        ? "/cleaner"
        : "/";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*", "/cleaner/:path*"],
};

