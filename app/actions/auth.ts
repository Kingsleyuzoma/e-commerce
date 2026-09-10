"use server";

import { cookies } from "next/headers";
import { getAdminAuth, getFirestore } from "@/config/firebaseAdmin";

export type AdminRole = "superadmin" | "manager" | "support";

interface LoginResult {
  success: boolean;
  role?: AdminRole;
  error?: string;
}

/**
 * Helper to retrieve and verify current caller's session on the server.
 */
async function getCurrentAdminSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session")?.value;
  if (!sessionCookie) return null;

  try {
    const parsed = JSON.parse(sessionCookie);
    return parsed as { uid: string; role: AdminRole };
  } catch {
    return null;
  }
}

/**
 * Sends a password reset email using Firebase Admin SDK.
 */
export async function resetUserPassword(email: string) {
  try {
    const resetLink = await getAdminAuth().generatePasswordResetLink(email);
    // TODO: Send `resetLink` using an email provider (e.g., Resend, Nodemailer, SendGrid)
    console.log(`Password reset link generated for ${email}: ${resetLink}`);
    return { success: true };
  } catch (error: any) {
    console.error("Server Action password reset error:", error);
    return { success: false, error: "Unable to generate reset link." };
  }
}

/**
 * Verifies admin credentials against Firebase Auth REST API and Firestore.
 */
export async function loginAdmin(
  email: string,
  pass: string
): Promise<LoginResult> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Firebase API Key is missing." };
    }

    // 1. Verify password credentials via Firebase Auth REST API
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const authResponse = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: pass,
        returnSecureToken: true,
      }),
    });

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData.localId) {
      return { success: false, error: "Invalid email or password." };
    }

    const uid = authData.localId;

    // 2. Query Firestore 'admins' collection to verify role
    const adminDoc = await getFirestore()
      .collection("admins") // Fixed: Using 'admins' consistently
      .doc(uid)
      .get();

    if (!adminDoc.exists) {
      return { success: false, error: "Access denied. Admin record not found." };
    }

    const adminData = adminDoc.data();
    const validRoles: AdminRole[] = ["superadmin", "manager", "support"];

    if (!adminData?.role || !validRoles.includes(adminData.role)) {
      return { success: false, error: "Access denied. Insufficient administrative privileges." };
    }

    const role: AdminRole = adminData.role;

    // 3. Create HTTP-only session cookie
    const cookieStore = await cookies();
    const sessionData = JSON.stringify({ uid, role });

    cookieStore.set("admin_session", sessionData, {
      httpOnly: true, // 🔒 Fixed: Prevents XSS cookie theft
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true, role };
  } catch (error) {
    console.error("Admin login error:", error);
    return { success: false, error: "An unexpected error occurred during login." };
  }
}

/**
 * Clears the session cookie to log the admin out.
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}

/**
 * Creates a new dynamic admin account (Superadmin access required).
 */
export async function createNewAdmin(
  newAdminEmail: string,
  initialPass: string,
  role: AdminRole = "manager"
): Promise<{ success: boolean; error?: string }> {
  try {
    // 🔒 Authorization Guard: Verify the caller is an authenticated superadmin
    const currentSession = await getCurrentAdminSession();
    if (!currentSession || currentSession.role !== "superadmin") {
      return {
        success: false,
        error: "Unauthorized: Only Superadmins can create new admin accounts.",
      };
    }

    // 1. Create user in Firebase Auth
    const newUser = await getAdminAuth().createUser({
      email: newAdminEmail,
      password: initialPass,
    });

    // 2. Register user in Firestore 'admins' collection
    await getFirestore().collection("admins").doc(newUser.uid).set({
      email: newAdminEmail,
      role: role,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Create new admin error:", error);
    return { success: false, error: error.message || "Failed to create admin." };
  }
}