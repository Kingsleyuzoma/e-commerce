import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Retrieve our secure admin session cookie
  const adminSession = request.cookies.get("admin_session")?.value;

  // 2. ONLY guard sub-routes starting with "/admin/" (like /admin/orders)
  // This allows the main "/admin" page to load so you can type your password!
  if (pathname.startsWith("/admin/")) {
    if (adminSession !== "authenticated_true") {
      // If not authenticated, redirect them to the admin login page
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

// Ensure this middleware matches all admin routes
export const config = {
  matcher: ["/admin/:path*"],
};