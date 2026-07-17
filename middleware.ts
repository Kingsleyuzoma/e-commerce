
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Retrieve secure session cookies
  const adminSession = request.cookies.get("admin_session")?.value;
  
  // 👈 Retrieve customer session (change 'user_session' if your client-side auth cookie has a different name)
  const userSession = request.cookies.get("user_session")?.value; 

  // 2. Guard sub-routes starting with "/admin/" (Your original admin protection logic)
  if (pathname.startsWith("/admin/")) {
    if (adminSession !== "authenticated_true") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // 3. 🛒 NEW: Guard "/checkout" routes
  if (pathname.startsWith("/checkout")) {
    if (!userSession) {
      // If not authenticated, redirect them to the customer sign-in page
      // We also append the '?redirect=/checkout' parameter so they return straight to checkout after signing in!
      const signInUrl = new URL("/login", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

// ⚠️ Ensure this middleware matches both admin routes and checkout paths
export const config = {
  matcher: [
    "/admin/:path*",
    "/checkout/:path*", // 👈 Added checkout to the matcher list
  ],
};