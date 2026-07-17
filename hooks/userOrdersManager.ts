
import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  costPrice?: number; // 🔄 Made optional to support older orders safely
  quantity: number;
  color?: string;
  size?: string | number;
  imageUrl: string;
  refunded?: boolean;          
  refundedQuantity?: number;  
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
    totalCost?: number; 
    netProfit?: number; 
    refundedAmount?: number; 
  };
}

export const useOrdersManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const { salesMetrics, profitMetrics, chartData, uniqueCustomersCount, totalRefundedMoney, totalRefundedProducts } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let daily = 0; let weekly = 0; let monthly = 0; let total = 0;
    
    // 📊 Profit accumulators tracking variables
    let dailyProfit = 0; let weeklyProfit = 0; let monthlyProfit = 0; let totalProfit = 0;

    let refundedMoney = 0;
    let refundedProducts = 0;

    const customerEmails = new Set<string>();

    const dailySalesMap: { [dateKey: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailySalesMap[key] = 0;
    }

    orders.forEach((order) => {
      if (order.customer?.email) {
        customerEmails.add(order.customer.email.toLowerCase().trim());
      }

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

      // 🎯 DYNAMIC PROFIT CALCULATION FALLBACK SYSTEM
      // Loop over items directly to sum profit, avoiding reliance on missing top-level document properties
      let computedOrderProfit = 0;
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const itemPrice = item.price || 0;
          
          // 💡 If costPrice is missing from older checkout collections, estimate at a 40% margin base fallback so analytics don't break
          const itemCost = item.costPrice !== undefined ? item.costPrice : (itemPrice * 0.6);
          
          const activeQty = item.quantity || 1;
          const refundedQty = item.refunded ? (item.refundedQuantity || activeQty) : 0;
          const netQty = Math.max(0, activeQty - refundedQty);

          computedOrderProfit += (itemPrice - itemCost) * netQty;
        });
      } else {
        // Ultimate fallback if items array doesn't exist
        computedOrderProfit = (order.financials?.subtotal || totalAmount) * 0.4;
      }

      // Deduct external direct adjustments if needed
      if (!order.items?.some(i => i.refunded) && order.financials?.refundedAmount) {
        computedOrderProfit -= order.financials.refundedAmount;
      }

      total += totalAmount;
      totalProfit += computedOrderProfit;

      if (orderDate >= startOfToday) {
        daily += totalAmount;
        dailyProfit += computedOrderProfit;
      }
      if (orderDate >= startOfWeek) {
        weekly += totalAmount;
        weeklyProfit += computedOrderProfit;
      }
      if (orderDate >= startOfMonth) {
        monthly += totalAmount;
        monthlyProfit += computedOrderProfit;
      }

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
      profitMetrics: { daily: dailyProfit, weekly: weeklyProfit, monthly: monthlyProfit, total: totalProfit },
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
    profitMetrics, 
    chartData,
    uniqueCustomersCount,     
    totalRefundedMoney,       
    totalRefundedProducts,    
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    loading,
  };
};