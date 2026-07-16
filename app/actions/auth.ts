
"use server";

import { cookies } from "next/headers";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/config/firebase";

/**
 * Sends a password reset email to the specified email address.
 */
export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    // Standard Firebase Auth Error handling
    let errorMessage = "An error occurred while trying to send the reset email.";
    
    if (error.code === "auth/user-not-found") {
      errorMessage = "No account exists with this email address.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address.";
    }
    
    throw new Error(errorMessage);
  }
};

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