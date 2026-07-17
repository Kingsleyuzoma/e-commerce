
import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string | number;
  imageUrl: string;
  refunded?: boolean;          // Track if item was refunded
  refundedQuantity?: number;  // How many of this item were refunded
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: any;
  status: "pending" | "processing" | "shipped" | "cancelled";
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItem[];
  financials: {
    subtotal: number;
    shipping: number;
    tax: number;
    grandTotal: number;
    refundedAmount?: number; // Total cash refunded on this order
  };
}

export const useOrdersManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 1. Listen to orders in real-time
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Filter orders by Order Number, Customer details, Product Name, and Status
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const lowerQuery = searchTerm.toLowerCase();
      
      const matchesOrderNumber = (order.orderNumber || "").toLowerCase().includes(lowerQuery);
      const matchesCustomerName = (order.customer?.fullName || "").toLowerCase().includes(lowerQuery);
      const matchesCustomerEmail = (order.customer?.email || "").toLowerCase().includes(lowerQuery);
      
      const matchesProductName = order.items ? order.items.some((item) => 
        (item.name || "").toLowerCase().includes(lowerQuery)
      ) : false;

      const matchesSearch = 
        matchesOrderNumber || 
        matchesCustomerName || 
        matchesCustomerEmail || 
        matchesProductName;

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // 3. Compute Sales Metrics, Customer counts, Refunds & Chart Data
  const { salesMetrics, chartData, uniqueCustomersCount, totalRefundedMoney, totalRefundedProducts } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    let total = 0;

    // Refund tracking accumulators
    let refundedMoney = 0;
    let refundedProducts = 0;

    // Unique customer tracker (using Set to handle deduplication automatically)
    const customerEmails = new Set<string>();

    // Structure a map to hold sales per day for the last 7 days
    const dailySalesMap: { [dateKey: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailySalesMap[key] = 0;
    }

    orders.forEach((order) => {
      // Record customer email for unique counts (ignore casing differences)
      if (order.customer?.email) {
        customerEmails.add(order.customer.email.toLowerCase().trim());
      }

      // 🛑 Track refund calculations regardless of overall order cancellation status
      if (order.financials?.refundedAmount) {
        refundedMoney += order.financials.refundedAmount;
      }

      if (order.items) {
        order.items.forEach((item) => {
          if (item.refunded) {
            refundedProducts += item.refundedQuantity || item.quantity;
          }
        });
      }

      if (order.status === 'cancelled') return;

      const totalAmount = order.financials?.grandTotal || 0;
      const orderDate = order.createdAt ? new Date(order.createdAt.seconds * 1000) : null;

      if (!orderDate) return;

      total += totalAmount;

      if (orderDate >= startOfToday) {
        daily += totalAmount;
      }
      if (orderDate >= startOfWeek) {
        weekly += totalAmount;
      }
      if (orderDate >= startOfMonth) {
        monthly += totalAmount;
      }

      // Populate chart keys
      const dateKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateKey in dailySalesMap) {
        dailySalesMap[dateKey] += totalAmount;
      }
    });

    const formattedChartData = Object.keys(dailySalesMap).map((date) => ({
      date,
      Sales: parseFloat(dailySalesMap[date].toFixed(2)),
    }));

    return {
      salesMetrics: { daily, weekly, monthly, total },
      chartData: formattedChartData,
      uniqueCustomersCount: customerEmails.size,
      totalRefundedMoney: refundedMoney,
      totalRefundedProducts: refundedProducts,
    };
  }, [orders]);

  return {
    orders: filteredOrders,
    allOrdersCount: orders.length,
    salesMetrics,
    chartData,
    uniqueCustomersCount,     // 👈 Returned: Number of unique shoppers
    totalRefundedMoney,       // 👈 Returned: Total dollar amount of refunds issued
    totalRefundedProducts,    // 👈 Returned: Number of physical products returned/refunded
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    loading,
  };
};