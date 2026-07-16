"use client";

import React, { useState } from "react";
import Link from "next/link";
import HeroManager from "@/Components/HeroManager"; 
import CategoryManager from "@/Components/CategoryManager"; 
import { loginAdmin, logoutAdmin } from "@/app/actions/auth";

export default function AdminDashboardHome() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <p className="text-xs text-gray-400 mb-6 font-medium">Please verify credentials to manage assets & orders.</p>
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

  // 🖥️ 2. Your Original UI + Security Options (Once authenticated)
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 text-sm p-4 md:p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 👋 Header Section with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back, Admin!</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your store assets, promotions, and incoming requests below.</p>
          </div>
          
          {/* Quick Hub Navigation Controls */}
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

        {/* 👟 Your Original Asset Managers */}
        <CategoryManager />
        <HeroManager />

      </div>
    </div>
  );
}