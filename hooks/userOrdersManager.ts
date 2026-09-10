import { useState, useEffect } from "react";
import { db } from "@/config/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  imageUrl?: string;
  costPrice?: number;
  refunded?: boolean;
  refundedQuantity?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "completed" | "cancelled" | "refunded";
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    shippingMethod?: string;
  };
  items: OrderItem[];
  financials: {
    subtotal: number;
    shipping: number;
    tax: number;
    grandTotal: number;
    refundedAmount?: number;
  };
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

export function useOrdersManager() {
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    
    // Listen to orders collection in Firestore
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: Order[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            orderNumber: data.orderNumber || doc.id.substring(0, 8),
            status: data.status || "pending",
            customer: data.customer || {},
            items: data.items || [],
            financials: data.financials || { subtotal: 0, shipping: 0, tax: 0, grandTotal: 0 },
            createdAt: data.createdAt || null,
          } as Order;
        });

        setRawOrders(fetchedOrders);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Orders Stream Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter orders based on search input and status drop-down
  const filteredOrders = rawOrders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" ? true : order.status?.toLowerCase() === statusFilter.toLowerCase();

    const queryLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      order.orderNumber?.toLowerCase().includes(queryLower) ||
      order.customer?.fullName?.toLowerCase().includes(queryLower) ||
      order.customer?.email?.toLowerCase().includes(queryLower) ||
      order.items?.some((item) => item.name?.toLowerCase().includes(queryLower));

    return matchesStatus && matchesSearch;
  });

  // Calculate dashboard metrics dynamically
  const now = new Date();
  const todayStr = now.toDateString();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let dailySales = 0;
  let monthlySales = 0;
  let totalSales = 0;

  let dailyProfit = 0;
  let monthlyProfit = 0;
  let totalProfit = 0;

  let totalRefundedMoney = 0;
  let totalRefundedProducts = 0;

  const customerEmails = new Set<string>();

  rawOrders.forEach((order) => {
    const grandTotal = order.financials?.grandTotal || 0;
    const refundedAmount = order.financials?.refundedAmount || 0;
    const netGrandTotal = grandTotal - refundedAmount;

    totalSales += netGrandTotal;
    totalRefundedMoney += refundedAmount;

    if (order.customer?.email) {
      customerEmails.add(order.customer.email.toLowerCase());
    }

    // Calculate profits across items
    let orderProfit = 0;
    (order.items || []).forEach((item) => {
      const retailPrice = item.price || 0;
      const costPrice = item.costPrice !== undefined ? item.costPrice : retailPrice * 0.6;
      const qty = item.quantity || 1;

      if (item.refunded) {
        totalRefundedProducts += qty;
      } else {
        orderProfit += (retailPrice - costPrice) * qty;
      }
    });

    totalProfit += orderProfit;

    if (order.createdAt?.seconds) {
      const orderDate = new Date(order.createdAt.seconds * 1000);

      if (orderDate.toDateString() === todayStr) {
        dailySales += netGrandTotal;
        dailyProfit += orderProfit;
      }

      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        monthlySales += netGrandTotal;
        monthlyProfit += orderProfit;
      }
    }
  });

  // Build chart dataset for the last 7 days
  const chartData = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const dayTotal = rawOrders.reduce((sum, order) => {
      if (!order.createdAt?.seconds) return sum;
      const orderDate = new Date(order.createdAt.seconds * 1000);
      if (orderDate.toDateString() === date.toDateString()) {
        return sum + ((order.financials?.grandTotal || 0) - (order.financials?.refundedAmount || 0));
      }
      return sum;
    }, 0);

    return { date: dateStr, Sales: dayTotal };
  });

  return {
    orders: filteredOrders,
    salesMetrics: { daily: dailySales, monthly: monthlySales, total: totalSales },
    profitMetrics: { daily: dailyProfit, monthly: monthlyProfit, total: totalProfit },
    chartData,
    uniqueCustomersCount: customerEmails.size,
    totalRefundedMoney,
    totalRefundedProducts,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    loading,
  };
}