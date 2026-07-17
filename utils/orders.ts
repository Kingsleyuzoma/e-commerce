
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
    salePrice?: number | null;
    costPrice?: number; 
    imageUrl: string;
  };
  costPrice?: number; // 🎯 Catch-all for flat cart structures
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

const generateOrderNumber = (): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const year = new Date().getFullYear();
  return `ORD-${year}-${result}`;
};

export async function createOrder(
  customer: CustomerDetails,
  cartItems: OrderItem[],
  financials: FinancialTotals
): Promise<string> {
  const orderRef = doc(collection(db, "orders")); 
  const orderNumber = generateOrderNumber();

  let computedTotalCost = 0;

  const formattedItems = cartItems.map((item) => {
    // 🎯 SMART COALESCING: Checks nested schema first, then flat schema, then falls back to 60% standard wholesale cost estimation
    const retailPrice = item.product.salePrice || item.product.price;
    
    let itemCostPrice = item.product.costPrice ?? item.costPrice;
    
    if (itemCostPrice === undefined || itemCostPrice === null) {
      itemCostPrice = retailPrice * 0.6; // Safe baseline fallback
    }
    
    computedTotalCost += itemCostPrice * item.quantity;

    return {
      productId: item.product.id,
      name: item.product.name,
      price: retailPrice,
      costPrice: itemCostPrice, 
      quantity: item.quantity,
      color: item.selectedColor || null,
      size: item.selectedSize || null,
      imageUrl: item.product.imageUrl,
    };
  });

  // Calculate clean profit metrics for the admin panel view
  const netProfit = financials.grandTotal - computedTotalCost;

  const orderData = {
    orderNumber,
    createdAt: serverTimestamp(),
    status: "pending",
    customer,
    items: formattedItems,
    financials: {
      ...financials,
      totalCost: computedTotalCost, 
      netProfit: netProfit,         
    },
  };

  const batch = writeBatch(db);
  batch.set(orderRef, orderData);
  await batch.commit();

  return orderNumber; 
}