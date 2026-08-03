
// utils/dbContact.ts
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { createPersistentNotification } from "@/utils/dbNotification";

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt?: any;
  read?: boolean;
}

/**
 * Saves a customer contact message to Firestore 
 * and notifies the admin panel.
 */
export const submitContactForm = async (data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) => {
  try {
    // 1. Save message to Firestore 'messages' collection
    const docRef = await addDoc(collection(db, "messages"), {
      name: data.name,
      email: data.email,
      subject: data.subject || "General Inquiry",
      message: data.message,
      read: false,
      createdAt: serverTimestamp(),
    });

    // 2. Trigger admin persistent notification
    await createPersistentNotification(
      `New Message from ${data.name}`,
      `Email: ${data.email} - "${data.message.slice(0, 60)}${data.message.length > 60 ? "..." : ""}"`,
      "general",
      { orderNumber: `MSG-${docRef.id.slice(0, 5)}` }
    );

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Failed to submit contact message:", error);
    throw error;
  }
};