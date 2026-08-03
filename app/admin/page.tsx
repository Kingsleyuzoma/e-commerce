"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HeroManager from "@/Components/HeroManager"; 
import CategoryManager from "@/Components/CategoryManager"; 
import { loginAdmin, logoutAdmin } from "@/app/actions/auth";
import CustomerAnalytics from "@/app/admin/Components/CustomerAnalytics";
import LowStockAlerts from "@/app/admin/Components/LowStockAlerts";

export default function AdminDashboardHome() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔀 Read tab query parameter from URL (e.g. ?tab=low-stock or ?tab=customer-insights)
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await loginAdmin(password);
      if (response.success) {
        setIsAuthenticated(true);
      } else {
        alert(response.error);
      }
    } catch (err) {
      alert("Something went wrong during login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    window.location.reload(); 
  };

  // 🚪 1. Security Gate UI (If not authenticated yet)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLoginSubmit} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full text-center">
          <h1 className="text-xl font-extrabold text-gray-950 mb-2">Admin Portal</h1>
          <p className="text-xs text-black mb-6 font-medium">Please verify credentials to manage assets & orders.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Security Password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs mb-4 outline-none focus:border-gray-900 transition-colors"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {isSubmitting ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    );
  }

  // 🖥️ 2. Clean Tabbed Admin UI (Once authenticated)
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 text-sm p-4 md:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 👋 Header Section with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back, Admin!</h1>
            <p className="text-sm text-black mt-1">
              Manage your store assets, promotions, and incoming requests below.
            </p>
          </div>
          
          {/* Quick Controls */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="bg-gray-900 text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              📦 View Customer Orders Feed
            </Link>
            
            <button
              onClick={handleLogout}
              className="border border-gray-200 bg-white hover:bg-gray-50 text-red-500 text-xs font-bold px-4 py-3 rounded-xl transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* 🏷️ Top Tab Switcher Bar */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-4 overflow-x-auto">
          <Link
            href="/admin"
            className={`px-4 py-2 rounded-xl text-lg font-bold transition-all ${
              activeTab === "overview"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-black hover:bg-gray-100 border border-gray-200"
            }`}
          >
            🏠 Overview & Asset Managers
          </Link>

          <Link
            href="/admin?tab=low-stock"
            className={`px-4 py-2 rounded-xl text-lg font-bold transition-all ${
              activeTab === "low-stock"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-red-500 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            ⚠️ Low Stock Warnings
          </Link>

          <Link
            href="/admin?tab=customer-insights"
            className={`px-4 py-2 rounded-xl text-lg font-bold transition-all ${
              activeTab === "customer-insights"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-green-500 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            👥 Customer Insights & Analytics
          </Link>
        </div>

        {/* 🔀 DYNAMIC TAB CONTENT VIEW */}
        <div className="pt-2">
          {/* VIEW 1: LOW STOCK ALERTS ONLY */}
          {activeTab === "low-stock" && (
            <div className="bg-red-100 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Low Stock Inventory Warnings</h2>
              <LowStockAlerts threshold={5} />
            </div>
          )}

          {/* VIEW 2: CUSTOMER INSIGHTS ONLY */}
          {activeTab === "customer-insights" && (
            <div className="bg-green-100 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Top Spenders and Repeat Buyers</h2>
              <CustomerAnalytics />
            </div>
          )}

          {/* VIEW 3: DEFAULT OVERVIEW (Category & Hero Managers) */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <CategoryManager />
              <HeroManager />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}