
// utils/dbAnalytics.ts
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

export interface CustomerMetric {
  email: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: any;
}

export interface AnalyticsSummary {
  topSpenders: CustomerMetric[];
  repeatBuyers: CustomerMetric[];
  totalUniqueCustomers: number;
}

/**
 * Reads all orders from Firestore, calculates customer metrics, 
 * and returns Top Spenders and Repeat Buyers.
 */
export const getCustomerMetrics = async (): Promise<AnalyticsSummary> => {
  try {
    const ordersRef = collection(db, "orders");
    const snapshot = await getDocs(ordersRef);

    const customerMap: Record<string, CustomerMetric> = {};

    snapshot.forEach((doc) => {
      const order = doc.data();

      // Retrieve customer details (handling potential field variations)
      const email = order.email || order.customerEmail || order.shippingAddress?.email;
      const name = order.fullName || order.customerName || order.name || "Guest Customer";
      
      // Retrieve totals safely
      const grandTotal = Number(
        order.totals?.grandTotal || order.grandTotal || order.total || 0
      );
      const createdAt = order.createdAt;

      // Skip orders that don't have an email attached
      if (!email) return;

      const normalizedEmail = email.toLowerCase().trim();

      if (!customerMap[normalizedEmail]) {
        customerMap[normalizedEmail] = {
          email: normalizedEmail,
          name,
          totalOrders: 1,
          totalSpent: grandTotal,
          lastOrderDate: createdAt,
        };
      } else {
        customerMap[normalizedEmail].totalOrders += 1;
        customerMap[normalizedEmail].totalSpent += grandTotal;
        // Keep the latest customer name on file
        if (name && name !== "Guest Customer") {
          customerMap[normalizedEmail].name = name;
        }
      }
    });

    const customersArray = Object.values(customerMap);

    // 🏆 Top Spenders (Sorted by highest total amount spent, top 5)
    const topSpenders = [...customersArray]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // 🔄 Repeat Buyers (Customers with 2 or more orders)
    const repeatBuyers = customersArray.filter((c) => c.totalOrders > 1);

    return {
      topSpenders,
      repeatBuyers,
      totalUniqueCustomers: customersArray.length,
    };
  } catch (error) {
    console.error("Failed to fetch customer metrics:", error);
    throw error;
  }
};