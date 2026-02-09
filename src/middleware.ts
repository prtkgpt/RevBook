import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes, static files, auth routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/signin") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Not logged in → go to signin
  if (!token) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  // Logged in but no business → go to onboarding
  if (!token.businessId && !pathname.startsWith("/app/onboarding")) {
    return NextResponse.redirect(new URL("/app/onboarding", req.url));
  }

  // Has business but on onboarding → go to dashboard
  if (token.businessId && pathname.startsWith("/app/onboarding")) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
