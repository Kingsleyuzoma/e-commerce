import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

function initFirebaseAdmin() {
  if (getApps().length === 0) {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = rawKey ? rawKey.replace(/\\n/g, "\n") : undefined;

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  }
  return getApp();
}

export function getAdminAuth() {
  initFirebaseAdmin();
  return getAuth();
}

export function getFirestore() {
  initFirebaseAdmin();
  return getAdminFirestore();
}