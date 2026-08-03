"use client";

import React, { useEffect, useState } from "react";
import { getLowStockProducts, LowStockProduct } from "@/utils/dbInventory";
import Link from "next/link";

export default function LowStockAlerts({ threshold = 5 }: { threshold?: number }) {
  const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const items = await getLowStockProducts(threshold);
      setLowStockItems(items);
    } catch (err) {
      console.error("Error loading low stock alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [threshold]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse text-xs text-gray-400">
        Checking inventory levels...
      </div>
    );
  }

  if (lowStockItems.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-xs font-bold text-green-900">Inventory Healthy</p>
            <p className="text-[11px] text-green-700">All products have sufficient stock levels (above {threshold} items).</p>
          </div>
        </div>
        <button 
          onClick={fetchAlerts}
          className="text-[11px] text-green-800 font-semibold underline hover:text-green-950"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
      {/* Alert Header */}
      <div className="bg-amber-50/80 border-b border-amber-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <h3 className="font-bold text-amber-950 text-sm">Low Stock Warnings</h3>
            <p className="text-[11px] text-amber-800">
              {lowStockItems.length} product(s) have {threshold} or fewer items remaining.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchAlerts}
            className="text-xs text-amber-900 font-medium underline hover:text-amber-950 mr-2"
          >
            Refresh
          </button>
          <span className="bg-amber-200/60 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-full">
            {lowStockItems.length} Action Needed
          </span>
        </div>
      </div>

      {/* Product List */}
      <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
        {lowStockItems.map((item) => (
          <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-9 h-9 object-cover rounded-lg border border-gray-100" />
              ) : (
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">📦</div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                <p className="text-[10px] text-gray-400 capitalize">{item.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {item.stock === 0 ? (
                <span className="bg-red-100 text-red-800 font-bold text-[10px] px-2 py-0.5 rounded">
                  OUT OF STOCK
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded">
                  {item.stock} left
                </span>
              )}

              <Link
                href={`/admin/products?edit=${item.id}`}
                className="text-xs font-semibold text-gray-700 hover:text-gray-900 underline"
              >
                Restock
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}