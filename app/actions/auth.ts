
"use server";

import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminsecret2026";

/**
 * Verifies the admin password and sets an HTTP-only cookie if correct.
 */
export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    
    // Set a secure session cookie that expires in 7 days
    cookieStore.set("admin_session", "authenticated_true", {
      httpOnly: true, // Prevents JavaScript access (XSS defense)
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // CSRF defense
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true };
  }

  return { success: false, error: "Incorrect admin password!" };
}

/**
 * Clears the session cookie to log the admin out.
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}