
"use client";

import React, { useState } from "react";
import { useOrdersManager } from "@/hooks/userOrdersManager";
import { updateOrderStatus, deleteOrder } from "@/utils/admin";
import { Order, OrderItem } from "@/hooks/userOrdersManager";
import Link from "next/link";
import { downloadOrderReceipt } from "@/utils/receiptGenerator";
import { db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminOrdersPage() {
  const { 
    orders, 
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
    loading 
  } = useOrdersManager();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRefundPanel, setShowRefundPanel] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundedItemsState, setRefundedItemsState] = useState<{ [productId: string]: boolean }>({});

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

  const handleIssueRefund = async () => {
    if (!selectedOrder) return;

    const parsedRefundAmount = parseFloat(refundAmount) || 0;
    if (parsedRefundAmount < 0) {
      alert("Refund amount cannot be negative.");
      return;
    }

    const currentRefundedAmount = selectedOrder.financials.refundedAmount || 0;
    const newRefundedAmount = currentRefundedAmount + parsedRefundAmount;

    if (newRefundedAmount > selectedOrder.financials.grandTotal) {
      alert("Total refunds cannot exceed the grand total value of the order.");
      return;
    }

    try {
      const updatedItems = selectedOrder.items.map((item) => {
        const isSelectedForRefund = refundedItemsState[item.productId];
        if (isSelectedForRefund) {
          return {
            ...item,
            refunded: true,
            refundedQuantity: item.quantity,
          };
        }
        return item;
      });

      const orderRef = doc(db, "orders", selectedOrder.id);
      
      const updatePayload = {
        items: updatedItems,
        "financials.refundedAmount": newRefundedAmount,
      };

      await updateDoc(orderRef, updatePayload);

      setSelectedOrder((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: updatedItems,
          financials: {
            ...prev.financials,
            refundedAmount: newRefundedAmount,
          },
        };
      });

      setRefundAmount("");
      setRefundedItemsState({});
      setShowRefundPanel(false);
      alert("Refund issued and database synced successfully!");
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Failed to record refund transaction.");
    }
  };

  const toggleItemRefundSelection = (productId: string) => {
    setRefundedItemsState((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleDownloadReceipt = (order: Order) => {
    const mappedCustomer = {
      fullName: order.customer.fullName,
      email: order.customer.email,
      phone: order.customer.phone,
      address: order.customer.address,
      city: order.customer.city,
      state: order.customer.state,
      zipCode: order.customer.zipCode,
      shippingMethod: order.customer.shippingMethod || "standard",
    };

    const mappedCart = order.items.map((item) => ({
      product: {
        name: item.name,
        price: item.price,
        salePrice: null,
      },
      quantity: item.quantity,
      selectedColor: item.color || "",
      selectedSize: item.size || "",
    }));

    downloadOrderReceipt(
      order.orderNumber,
      mappedCustomer,
      mappedCart,
      order.financials
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 text-sm p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
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
              placeholder="Search ID, customer, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Today's Sales</p>
              <p className="text-lg md:text-2xl font-black text-emerald-600 mt-2">${salesMetrics.daily.toFixed(2)}</p>
              <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50/50 px-2 py-0.5 rounded mt-1.5 w-fit">Profit: ${profitMetrics.daily.toFixed(2)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">This Month</p>
              <p className="text-lg md:text-2xl font-black text-purple-600 mt-2">${salesMetrics.monthly.toFixed(2)}</p>
              <p className="text-[10px] text-purple-700 font-bold bg-purple-50/50 px-2 py-0.5 rounded mt-1.5 w-fit">Profit: ${profitMetrics.monthly.toFixed(2)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Revenue</p>
              <p className="text-lg md:text-2xl font-black text-gray-950 mt-2">${salesMetrics.total.toFixed(2)}</p>
              <p className="text-[10px] text-gray-950 font-bold bg-gray-100 px-2 py-0.5 rounded mt-1.5 w-fit">Profit: ${profitMetrics.total.toFixed(2)}</p>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Customers</p>
              <p className="text-lg md:text-2xl font-black text-blue-600 mt-2">{uniqueCustomersCount}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Refunded Cash</p>
              <p className="text-lg md:text-2xl font-black text-rose-600 mt-2">${totalRefundedMoney.toFixed(2)}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Refunded Items</p>
              <p className="text-lg md:text-2xl font-black text-amber-600 mt-2">{totalRefundedProducts} items</p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">7-Day Sales Trend</span>
              <h3 className="font-bold text-sm text-gray-950">Daily Revenues Overview</h3>
            </div>
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none', color: '#ffffff', fontSize: '11px' }}
                    labelStyle={{ fontSpread: 'bold', color: '#9ca3af' }}
                  />
                  <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <span className="font-bold text-gray-950 text-xs uppercase tracking-wider">Order Feed</span>
              <span className="bg-gray-200/60 text-gray-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading incoming data stream...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">No orders matching current conditions found.</div>
            ) : (
              <div className="divide-y divide-gray-50 overflow-y-auto max-h-[70vh]">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowRefundPanel(false);
                      setRefundAmount("");
                      setRefundedItemsState({});
                    }}
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

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
            {selectedOrder ? (
              <div className="space-y-6">
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

                <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-50">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">Shipping Details</h3>
                    <button
                      onClick={() => setShowRefundPanel(!showRefundPanel)}
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                        showRefundPanel 
                          ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                      }`}
                    >
                      {showRefundPanel ? "Cancel" : "Process Refund"}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 pt-1">
                    <p className="text-gray-900 font-bold">{selectedOrder.customer.fullName}</p>
                    <p>{selectedOrder.customer.address}</p>
                    <p>{selectedOrder.customer.city}, {selectedOrder.customer.state} {selectedOrder.customer.zipCode}</p>
                    <p className="pt-2 font-medium">✉ {selectedOrder.customer.email}</p>
                    <p className="font-medium">📞 {selectedOrder.customer.phone}</p>
                  </div>
                </div>

                {showRefundPanel && (
                  <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 space-y-3 transition-all duration-200">
                    <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Process Refund</h3>
                    
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-rose-800 font-bold">Select items returned/refunded:</p>
                      {selectedOrder.items.map((item) => (
                        <label 
                          key={item.productId} 
                          className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded-lg border border-gray-150 cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={!!refundedItemsState[item.productId] || !!item.refunded}
                            disabled={!!item.refunded}
                            onChange={() => toggleItemRefundSelection(item.productId)}
                            className="rounded text-rose-600 focus:ring-rose-500 accent-rose-600 h-3.5 w-3.5"
                          />
                          <span className="flex-1 truncate font-medium">
                            {item.name} {item.refunded && <span className="text-[9px] text-rose-600 font-bold">(Already Refunded)</span>}
                          </span>
                          <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-rose-800 font-bold">Amount to Credit back ($):</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-rose-500"
                      />
                    </div>

                    <button
                      onClick={handleIssueRefund}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer flex justify-center items-center gap-1"
                    >
                      Confirm Refund
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">Line Items</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item, index) => {
                      // 🎯 FIX: Core dynamic tracking fallback math for old records
                      const itemRetailPrice = item.price || 0;
                      const itemCostPrice = item.costPrice !== undefined ? item.costPrice : (itemRetailPrice * 0.6);
                      const singleItemProfit = itemRetailPrice - itemCostPrice;
                      const totalItemProfit = singleItemProfit * item.quantity;

                      return (
                        <div key={index} className="flex flex-col border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                          <div className="flex gap-3 items-center">
                            <div className="relative flex-shrink-0">
                              <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg border bg-gray-50" />
                              {item.refunded && (
                                <span className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 text-[8px] leading-none font-bold">
                                  ↩
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-gray-950 truncate">{item.name}</p>
                                {item.refunded && (
                                  <span className="bg-rose-50 text-rose-600 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Refunded</span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 font-medium">
                                {item.color && `Color: ${item.color}`} {item.size && ` | Size: ${item.size}`}
                              </p>
                            </div>
                            <div className="text-right text-xs flex-shrink-0">
                              <p className="font-bold text-gray-900">${(itemRetailPrice * item.quantity).toFixed(2)}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{item.quantity}x @ ${itemRetailPrice}</p>
                            </div>
                          </div>

                          {/* 💸 Private Individual Product Profit Display Overlay Tag */}
                          <div className="flex justify-between items-center bg-purple-50/40 text-[10px] font-semibold text-purple-800 rounded-md px-2 py-1 mt-1.5 border border-purple-100/30">
                            <span>Private Tracking Metrics:</span>
                            <span>
                              Cost: <span className="font-bold text-gray-600">${itemCostPrice.toFixed(2)}</span> | 
                              Profit: <span className="font-bold text-purple-700">+${totalItemProfit.toFixed(2)}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

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
                  
                  {(selectedOrder.financials.refundedAmount || 0) > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
                      <span>Amount Refunded</span>
                      <span>-${selectedOrder.financials.refundedAmount?.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                    <div>
                      <span className="block font-medium text-gray-400">Grand Total</span>
                      <span className="font-black text-gray-950 text-base">${selectedOrder.financials.grandTotal.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => handleDownloadReceipt(selectedOrder)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 hover:border-gray-950 hover:text-gray-950 text-gray-500 font-bold transition-all cursor-pointer bg-white text-[11px]"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Invoice PDF
                    </button>
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