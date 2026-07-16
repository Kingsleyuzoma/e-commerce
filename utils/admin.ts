
import { db } from "@/config/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

/**
 * Updates the status of an existing order (e.g. pending, processing, shipped, cancelled)
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, { status });
}

/**
 * Deletes an order (useful for cleaning up test orders)
 */
export async function deleteOrder(orderId: string): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  await deleteDoc(orderRef);
}