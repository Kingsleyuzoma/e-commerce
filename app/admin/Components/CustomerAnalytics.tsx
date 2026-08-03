
"use client";

import React, { useEffect, useState } from "react";
import { getCustomerMetrics, CustomerMetric } from "@/utils/dbAnalytics";

export default function CustomerAnalytics() {
  const [metrics, setMetrics] = useState<{
    topSpenders: CustomerMetric[];
    repeatBuyers: CustomerMetric[];
    totalUniqueCustomers: number;
  }>({
    topSpenders: [],
    repeatBuyers: [],
    totalUniqueCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await getCustomerMetrics();
        setMetrics(data);
      } catch (err) {
        console.error("Error loading customer analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return <div className="p-4 text-xs text-gray-400">Loading customer analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Stat Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">Total Unique Customers</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalUniqueCustomers}</h3>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">Repeat Customer Rate</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">
            {metrics.totalUniqueCustomers > 0
              ? `${((metrics.repeatBuyers.length / metrics.totalUniqueCustomers) * 100).toFixed(1)}%`
              : "0%"}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🏆 Top Spenders Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span>👑</span> Top Spenders
            </h3>
            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">
              Ranked by total spent
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {metrics.topSpenders.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No spenders recorded yet.</p>
            ) : (
              metrics.topSpenders.map((customer, idx) => (
                <div key={customer.email} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">#{idx + 1}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{customer.name}</p>
                      <p className="text-[11px] text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">
                      ${customer.totalSpent.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-400">{customer.totalOrders} order(s)</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 🔄 Repeat Buyers Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span>🔄</span> Repeat Buyers ({metrics.repeatBuyers.length})
            </h3>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
              2+ Orders
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {metrics.repeatBuyers.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                No repeat buyers yet.
              </p>
            ) : (
              metrics.repeatBuyers.map((customer) => (
                <div key={customer.email} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{customer.name}</p>
                    <p className="text-[11px] text-gray-500">{customer.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded">
                      {customer.totalOrders} Orders
                    </span>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Total: ${customer.totalSpent.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}