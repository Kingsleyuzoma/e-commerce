
import { db } from "@/config/firebase";
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";

interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number;
    imageUrl: string;
  };
  quantity: number;
  selectedColor?: string;
  selectedSize?: string | number;
}

interface FinancialTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
}

/**
 * Generates a random, human-friendly order receipt number
 */
const generateOrderNumber = (): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const year = new Date().getFullYear();
  return `ORD-${year}-${result}`;
};

/**
 * Creates a pending order document in Firestore
 */
export async function createOrder(
  customer: CustomerDetails,
  cartItems: OrderItem[],
  financials: FinancialTotals
): Promise<string> {
  const orderRef = doc(collection(db, "orders")); // Generates a clean random ID
  const orderNumber = generateOrderNumber();

  const formattedItems = cartItems.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    price: item.product.salePrice || item.product.price,
    quantity: item.quantity,
    color: item.selectedColor || null,
    size: item.selectedSize || null,
    imageUrl: item.product.imageUrl,
  }));

  const orderData = {
    orderNumber,
    createdAt: serverTimestamp(),
    status: "pending",
    customer,
    items: formattedItems,
    financials,
  };

  // We write to Firestore
  const batch = writeBatch(db);
  batch.set(orderRef, orderData);
  await batch.commit();

  return orderNumber; // Return the order number to show on the success page
}