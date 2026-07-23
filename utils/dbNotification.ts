
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  limit 
} from "firebase/firestore";
import { db } from "@/config/firebase";

export interface DBNotification {
  id: string;
  title: string;
  message: string;
  type: "order_placed" | "low_stock" | "general";
  read: boolean;
  createdAt: any; // Firestore Timestamp
  metadata?: {
    orderNumber?: string;
    grandTotal?: number;
  };
}

/**
 * Creates and saves a persistent notification inside Firestore.
 */
export const createPersistentNotification = async (
  title: string,
  message: string,
  type: "order_placed" | "low_stock" | "general" = "general",
  metadata?: { orderNumber?: string; grandTotal?: number }
) => {
  try {
    await addDoc(collection(db, "notifications"), {
      title,
      message,
      type,
      read: false,
      createdAt: new Date(), // Storing native JS Date (Firestore converts automatically)
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("Failed to save database notification:", error);
  }
};

/**
 * Real-time subscription to notifications list.
 */
export const subscribeToNotifications = (callback: (notifications: DBNotification[]) => void) => {
  const q = query(
    collection(db, "notifications"), 
    orderBy("createdAt", "desc"),
    limit(50) // Limit to last 50 notifications for performance
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications: DBNotification[] = [];
    snapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as DBNotification);
    });
    callback(notifications);
  });
};

/**
 * Marks a single notification as read.
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const docRef = doc(db, "notifications", notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
};

/**
 * Marks all unread notifications as read at once.
 */
export const markAllNotificationsAsRead = async (notifications: DBNotification[]) => {
  try {
    const batch = writeBatch(db);
    notifications.forEach((notif) => {
      if (!notif.read) {
        const ref = doc(db, "notifications", notif.id);
        batch.update(ref, { read: true });
      }
    });
    await batch.commit();
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
};

/**
 * 🗑️ Deletes a single notification from Firestore.
 */
export const deleteNotification = async (notificationId: string) => {
  try {
    const docRef = doc(db, "notifications", notificationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Failed to delete notification:", error);
    throw error;
  }
};

/**
 * 🧹 Deletes all provided notifications in a single batch.
 */
export const clearAllNotifications = async (notifications: DBNotification[]) => {
  try {
    const batch = writeBatch(db);
    notifications.forEach((notif) => {
      const ref = doc(db, "notifications", notif.id);
      batch.delete(ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Failed to clear all notifications:", error);
    throw error;
  }
};