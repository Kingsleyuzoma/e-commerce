
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/Context/CartContext';

const PRODUCT_CATEGORIES = [
  { name: 'All Products', href: '/products' },
  { name: 'Wigs & Hair', href: '/products/hair' },
  { name: 'Makeup', href: '/products/makeup' },
  { name: 'Perfumes', href: '/products/perfumes' },
  { name: 'Apparel & Sneakers', href: '/products/apparel' },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // This is a placeholder for our future Firebase auth state
  const [user, setUser] = useState<{ email: string } | null>(null);

  const { getCartCount, isCartOpen, setIsCartOpen } = useCart();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link href="/" className="text-xl font-extrabold text-pink-600 tracking-wide">
            Femel👑
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
                  {PRODUCT_CATEGORIES.map((category) => (
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
          </div>

          {/* Auth Buttons & Cart (Desktop Right) */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Shopping Cart Button */}
            <button onClick={() => setIsCartOpen(true)} className="p-2 text-gray-600 hover:text-pink-600 transition-colors relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <span className="absolute top-1 right-1 bg-pink-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center scale-90">{getCartCount()}</span>
            </button>

            {user ? (
              <button 
                onClick={() => setUser(null)} 
                className="text-sm font-medium text-gray-700 hover:text-rose-600 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button 
                onClick={() => setUser({ email: 'user@test.com' })} 
                className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-pink-700 transition-colors shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <div className="flex md:hidden items-center space-x-4">
            
            {/* Always visible mobile Cart */}
            <button onClick={() => setIsCartOpen(true)} className="p-2 text-gray-600 hover:text-pink-600 relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <span className="absolute top-1 right-1 bg-pink-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center scale-90">{getCartCount()}</span>
            </button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-pink-600 focus:outline-none"
            >
                
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
          <Link href="/" className="block py-2 text-base font-medium text-gray-700 hover:text-pink-600">Home</Link>
          
          <div className="py-2">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Categories</span>
            <div className="mt-1 pl-3 border-l border-pink-100 space-y-1">
              {PRODUCT_CATEGORIES.map((category) => (
                <Link key={category.name} href={category.href} className="block py-1.5 text-sm text-gray-600 hover:text-pink-600">
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          
          <Link href="/contact" className="block py-2 text-base font-medium text-gray-700 hover:text-pink-600">Contact</Link>
          
          <div className="pt-4 border-t border-gray-100">
            {user ? (
              <button onClick={() => setUser(null)} className="w-full text-center bg-gray-100 text-gray-700 py-2 rounded-lg font-medium">Sign Out</button>
            ) : (
              <button onClick={() => setUser({ email: 'user@test.com' })} className="w-full text-center bg-pink-600 text-white py-2 rounded-lg font-semibold">Sign In</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;