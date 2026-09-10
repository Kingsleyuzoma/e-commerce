import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Retrieve session cookies
  const userSession = request.cookies.get("user_session")?.value;

  // 2. Guard Checkout Routes
  if (pathname.startsWith("/checkout")) {
    if (!userSession) {
      const signInUrl = new URL("/login", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

// Matching rules
export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/checkout",
    "/checkout/:path*",
  ],
};