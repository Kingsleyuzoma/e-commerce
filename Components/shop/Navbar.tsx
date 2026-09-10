"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/Context/CartContext';
import { useAuth } from '@/Context/AuthContext'; 
import { db } from '@/config/firebase'; 
import { collection, onSnapshot } from 'firebase/firestore';
import UserMenu from '@/Components/shop/UserMenu';

interface NavCategory {
  name: string;
  href: string;
}

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 📱 Mobile Accordion State for Products Submenu
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);

  // 🗂️ Live categories state initialized with 'All Products'
  const [categories, setCategories] = useState<NavCategory[]>([
    { name: 'All Products', href: '/products' }
  ]);
  
  const { user, isAdmin } = useAuth();
  const { getCartCount, setIsCartOpen } = useCart();

  // 📡 Real-time listener pointing directly to the linked 'categories' collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const dynamicCategories = snapshot.docs.map((doc) => {
        const data = doc.data();
        const categoryName = data.name || data.category || doc.id;
        
        return {
          name: categoryName,
          href: data.href || `/products/category/${encodeURIComponent(categoryName.toLowerCase())}`
        };
      });

      dynamicCategories.sort((a, b) => 
        (a.name || "").localeCompare(b.name || "")
      );

      setCategories([
        { name: 'All Products', href: '/' },
        ...dynamicCategories,
      ]);
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link href="/" className="text-3xl font-extrabold text-pink-600 tracking-wide">
            THE HORIZON
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-pink-600 transition-colors">
              Home
            </Link>

            {/* Products Dropdown Trigger */}
            <div 
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button className="text-sm font-medium text-gray-700 hover:text-pink-600 transition-colors flex items-center gap-1 py-2">
                Products
                <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {/* Dropdown Menu Overlay */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-0 w-52 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      href={category.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-pink-600 transition-colors">
              Contact
            </Link>

            <Link href="/testimonials" className="text-sm font-medium text-gray-700 hover:text-pink-600 transition-colors">
              Testimonials
            </Link>

            {/* Conditional Admin Link */}
            {user && isAdmin && (
              <Link href="/admin/dashboard" className="text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors">
                Admin
              </Link>
            )}
          </div>

          {/* Auth Buttons & Cart (Desktop Right) */}
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => setIsCartOpen(true)} className="p-2 text-gray-600 hover:text-pink-600 transition-colors relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <span className="absolute top-1 right-1 bg-pink-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center scale-90">{getCartCount()}</span>
            </button>

            <UserMenu />
          </div>

          {/* Mobile Menu Buttons (Mobile Right) */}
          <div className="flex md:hidden items-center space-x-4">
            <button onClick={() => setIsCartOpen(true)} className="p-2 text-gray-600 hover:text-pink-600 relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <span className="absolute top-1 right-1 bg-pink-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center scale-90">{getCartCount()}</span>
            </button>
            
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 hover:text-pink-600 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-2 shadow-inner">
          <Link 
            href="/" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="block py-2 text-base font-medium text-gray-700 hover:text-pink-600"
          >
            Home
          </Link>
          
          {/* Mobile Products Expandable Menu */}
          <div className="py-1">
            <button 
              onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
              className="w-full flex justify-between items-center py-2 text-base font-medium text-gray-700 hover:text-pink-600 focus:outline-none"
            >
              <span>Products</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isMobileProductsOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Mobile Categories Submenu Accordion */}
            {isMobileProductsOpen && (
              <div className="pl-4 border-l-2 border-pink-100 space-y-1 my-1">
                {categories.map((category) => (
                  <Link 
                    key={category.name} 
                    href={category.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-1.5 text-sm text-gray-600 hover:text-pink-600"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <Link 
            href="/contact" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="block py-2 text-base font-medium text-gray-700 hover:text-pink-600"
          >
            Contact
          </Link>

          {/* 🌟 Testimonials Link Added for Mobile View */}
          <Link 
            href="/testimonials" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="block py-2 text-base font-medium text-gray-700 hover:text-pink-600"
          >
            Testimonials
          </Link>

          {user && isAdmin && (
            <Link 
              href="/admin/dashboard" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="block py-2 text-base font-medium text-pink-600 hover:text-pink-700"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-center py-2">
              <UserMenu />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;