"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/config/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { updateOrderStatus, deleteOrder } from "@/utils/admin";
import Link from "next/link"; // 💡 Imported Link for navigation

interface Order {
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
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string | number;
    imageUrl: string;
  }>;
  financials: {
    subtotal: number;
    shipping: number;
    tax: number;
    grandTotal: number;
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Set up real-time listener for incoming orders (Guarded by middleware)
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(orderList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Order Actions
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order permanently?")) return;
    try {
      await deleteOrder(orderId);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      alert("Failed to delete order");
    }
  };

  // Search & Filter computation
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 text-sm p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* 👋 Header & Navigation Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            {/* ⬅️ Return link to Main Dashboard */}
            <Link 
              href="/admin" 
              className="text-xs text-gray-400 hover:text-gray-950 font-bold mb-2 inline-flex items-center gap-1 transition-colors"
            >
              ← Return to Main Dashboard
            </Link>
            <h1 className="text-2xl font-black text-gray-950 tracking-tight">Orders Management</h1>
            <p className="text-xs text-gray-400 font-medium mt-1">Monitor real-time sales activity and fulfillments.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search order #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-gray-900 transition-colors w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-gray-900 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Dashboard Grid split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <span className="font-bold text-gray-950 text-xs uppercase tracking-wider">Order Feed</span>
              <span className="bg-gray-200/60 text-gray-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading incoming data stream...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">No orders matching current conditions found.</div>
            ) : (
              <div className="divide-y divide-gray-50 overflow-y-auto max-h-[70vh]">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 transition-colors cursor-pointer hover:bg-gray-50 flex items-center justify-between gap-4 ${
                      selectedOrder?.id === order.id ? "bg-gray-50/70 border-l-4 border-gray-900" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-gray-950">{order.orderNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.status === "shipped"
                              ? "bg-green-50 text-green-700"
                              : order.status === "processing"
                              ? "bg-blue-50 text-blue-700"
                              : order.status === "cancelled"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-900">{order.customer.fullName}</p>
                      <p className="text-[11px] text-gray-400">
                        {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : "Syncing..."}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-extrabold text-gray-950">${order.financials.grandTotal.toFixed(2)}</p>
                      <p className="text-[11px] text-gray-400">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Order Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
            {selectedOrder ? (
              <div className="space-y-6">
                {/* Panel Header */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Selected Order</span>
                    <h2 className="font-mono font-black text-lg text-gray-950">{selectedOrder.orderNumber}</h2>
                  </div>
                  <button
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Delete Record
                  </button>
                </div>

                {/* Status Updater */}
                <div>
                  <label className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">Fulfillment Status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-gray-950 cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-50">
                  <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">Shipping Details</h3>
                  <div className="text-xs text-gray-600 space-y-1 pt-1">
                    <p className="text-gray-900 font-bold">{selectedOrder.customer.fullName}</p>
                    <p>{selectedOrder.customer.address}</p>
                    <p>{selectedOrder.customer.city}, {selectedOrder.customer.state} {selectedOrder.customer.zipCode}</p>
                    <p className="pt-2 font-medium">✉ {selectedOrder.customer.email}</p>
                    <p className="font-medium">📞 {selectedOrder.customer.phone}</p>
                  </div>
                </div>

                {/* Product Items Purchased */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">Line Items</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex gap-3 items-center border-b border-gray-50 pb-2 last:border-0">
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg border bg-gray-50" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-950 truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {item.color && `Color: ${item.color}`} {item.size && ` | Size: ${item.size}`}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{item.quantity}x @ ${item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Recap */}
                <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-700">${selectedOrder.financials.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping</span>
                    <span className="font-medium text-gray-700">${selectedOrder.financials.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax</span>
                    <span className="font-medium text-gray-700">${selectedOrder.financials.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-50 pt-2 font-bold text-gray-950">
                    <span>Grand Total</span>
                    <span>${selectedOrder.financials.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400 text-xs">
                Select an order from the list to view billing, delivery, and full item details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}