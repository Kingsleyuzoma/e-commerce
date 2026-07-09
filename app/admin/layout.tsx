
"use client";

import { useAuth } from "@/Context/AuthContext"; 
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react"; // 🔄 Added useState
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  
  // 📱 State to manage mobile sidebar visibility
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!isAdmin) {
        notFound();
      }
    }
  }, [user, isAdmin, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      
      {/* 📱 Mobile Top Header Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <h2 className="text-lg font-bold text-gray-800">Admin Panel</h2>
        <button 
          onClick={() => setIsAdminMenuOpen(true)}
          className="p-2 text-gray-600 hover:text-pink-600 focus:outline-none"
        >
          {/* Menu Hamburger Icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* 📁 Sidebar Navigation (Responsive Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md p-4 flex flex-col gap-4 transform transition-transform duration-300 ease-in-out
        md:static md:translate-x-0
        ${isAdminMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Mobile Sidebar Header with Close Button */}
        <div className="flex justify-between items-center md:hidden pb-2 border-b border-gray-100">
          <span className="font-bold text-gray-800">Navigation</span>
          <button 
            onClick={() => setIsAdminMenuOpen(false)}
            className="p-2 text-gray-500 hover:text-red-600 focus:outline-none"
          >
            {/* Close "X" Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4 hidden md:block">Admin Panel</h2>
        
        <nav className="flex flex-col gap-2">
          <Link 
            href="/admin" 
            onClick={() => setIsAdminMenuOpen(false)} // Close drawer on navigation
            className="p-2 hover:bg-gray-200 rounded text-gray-700 font-medium"
          >
            🏠 Admin Home
          </Link>
          <Link 
            href="/admin/products" 
            onClick={() => setIsAdminMenuOpen(false)}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 font-medium"
          >
            📊 All Products
          </Link>
          <Link 
            href="/admin/add-product" 
            onClick={() => setIsAdminMenuOpen(false)}
            className="p-2 hover:bg-gray-200 rounded text-gray-700 font-medium"
          >
            ➕ Add Product
          </Link>
        </nav>
      </aside>

      {/* 📁 Dark Overlay Background for Mobile when menu is open */}
      {isAdminMenuOpen && (
        <div 
          onClick={() => setIsAdminMenuOpen(false)}
          className="fixed inset-0 bg-black opacity-40 z-40 md:hidden"
        />
      )}

      {/* 🖥️ Main Content Area */}
      <main className="flex-1 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}