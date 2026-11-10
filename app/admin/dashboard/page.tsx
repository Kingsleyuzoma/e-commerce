"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, notFound } from "next/navigation";
import HeroManager from "@/Components/HeroManager"; 
import CategoryManager from "@/Components/CategoryManager"; 
import CustomerAnalytics from "@/app/admin/Components/CustomerAnalytics";
import LowStockAlerts from "@/app/admin/Components/LowStockAlerts";
import AdminMessagesPage from "@/app/admin/messages/page";

import { auth, db } from "@/config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, limit, getDocs } from "firebase/firestore";

interface Visitor {
  id: string;
  timestamp: any;
  path: string;
  location?: string;
  country?: string;
  city?: string;
  userAgent: string;
  referrer: string;
}

function AdminVisitorSection() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const q = query(collection(db, "visitors"), orderBy("timestamp", "desc"), limit(50));
        const snapshot = await getDocs(q);
        const visitorList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Visitor[];
        setVisitors(visitorList);
      } catch (error) {
        console.error("Error fetching visitors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitors();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading live visitor logs...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Live Visitor Traffic</h3>
          <p className="text-xs text-gray-500">Recent visitor activity and geographical data from your store</p>
        </div>
        <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full">
          {visitors.length} Recent Logs
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="p-3.5">Time</th>
              <th className="p-3.5">Location</th>
              <th className="p-3.5">Page Visited</th>
              <th className="p-3.5">Referrer</th>
              <th className="p-3.5">Device</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visitors.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50/55 transition-colors">
                <td className="p-3.5 whitespace-nowrap text-xs text-gray-500">
                  {v.timestamp?.toDate ? v.timestamp.toDate().toLocaleString() : "Just now"}
                </td>
                <td className="p-3.5 whitespace-nowrap font-medium text-gray-900">
                  {v.city && v.country ? `${v.city}, ${v.country}` : v.country || v.location || "Unknown"}
                </td>
                <td className="p-3.5 text-pink-600 font-medium">{v.path}</td>
                <td className="p-3.5 truncate max-w-50 text-xs text-gray-500">{v.referrer}</td>
                <td className="p-3.5 truncate max-w-45 text-xs text-gray-400">
                  {v.userAgent}
                </td>
              </tr>
            ))}
            {visitors.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                  No visitor logs found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminDashboardHome() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  // 🔑 Firebase Auth & Role Verification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data()?.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Failed to verify admin status:", error);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 📩 Real-time listener for unread messages count
  useEffect(() => {
    if (!isAdmin) return;

    const messagesQuery = query(
      collection(db, "messages"),
      where("read", "==", false)
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setUnreadMessageCount(snapshot.size);
      },
      (error) => {
        console.error("Error fetching unread message count:", error);
      }
    );

    return () => unsubscribeMessages();
  }, [isAdmin]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  // ⏳ Checking Firebase session status
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xs text-gray-500">
        Checking admin permissions...
      </div>
    );
  }

  // 🚪 Redirect non-admins straight to 404
  if (!isAdmin) {
    notFound();
  }

  // 🖥️ Unlocked Admin UI
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 text-sm p-4 md:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back, Admin!</h1>
            <p className="text-sm text-black mt-1">
              Manage your store assets, promotions, and incoming requests below.
            </p>
          </div>
          
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-4 overflow-x-auto">
          <Link
            href="/admin/dashboard"
            className={`px-4 py-2 rounded-xl text-lg font-bold transition-all ${
              activeTab === "overview"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-black hover:bg-gray-100 border border-gray-200"
            }`}
          >
            🏠 Overview & Asset Managers
          </Link>

          <Link
            href="/admin/dashboard?tab=messages"
            className={`px-4 py-2 rounded-xl text-lg font-bold transition-all flex items-center gap-2 ${
              activeTab === "messages"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-blue-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <span>📬 Contact Messages</span>
            {unreadMessageCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                {unreadMessageCount}
              </span>
            )}
          </Link>

          <Link
            href="/admin/dashboard?tab=low-stock"
            className={`px-4 py-2 rounded-xl text-lg font-bold transition-all ${
              activeTab === "low-stock"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-red-500 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            ⚠️ Low Stock Warnings
          </Link>

          <Link
            href="/admin/dashboard?tab=customer-insights"
            className={`px-4 py-2 rounded-xl text-lg font-bold transition-all ${
              activeTab === "customer-insights"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-green-500 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            👥 Customer Insights & Analytics
          </Link>

          <Link
            href="/admin/dashboard?tab=visitors"
            className={`px-4 py-2 rounded-xl text-lg font-bold transition-all ${
              activeTab === "visitors"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-purple-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            🌐 Live Visitors
          </Link>
        </div>

        {/* Dynamic Tab Content */}
        <div className="pt-2">
          {activeTab === "messages" && (
            <AdminMessagesPage />
          )}

          {activeTab === "low-stock" && (
            <div className="bg-red-100 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Low Stock Inventory Warnings</h2>
              <LowStockAlerts threshold={5} />
            </div>
          )}

          {activeTab === "customer-insights" && (
            <div className="bg-green-100 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Top Spenders and Repeat Buyers</h2>
              <CustomerAnalytics />
            </div>
          )}

          {activeTab === "visitors" && (
            <div className="bg-purple-50 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <AdminVisitorSection />
            </div>
          )}

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