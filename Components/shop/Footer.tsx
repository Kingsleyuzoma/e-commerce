
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/config/firebase'; // Ensure this points to your Firebase configuration
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    try {
      // 🚀 Save the email directly to a 'newsletter' collection in Firestore
      await addDoc(collection(db, "newsletter"), {
        email: email.trim().toLowerCase(),
        subscribedAt: serverTimestamp(), // Saves the exact date/time of signup
      });

      alert(`Thank you for subscribing! 💖 Exclusive deals will be sent to ${email}`);
      setEmail("");
    } catch (error) {
      console.error("Newsletter submission failed:", error);
      alert("Something went wrong. Please try again!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-950 text-gray-400 font-sans mt-auto border-t border-gray-900">
      
      {/* 🌟 Main Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          
          {/* Column 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="text-2xl font-extrabold text-white tracking-wide">
              THE HORIZON<span className="text-pink-500"></span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              Discover your style with THE HORIZON. Curating the finest collections in beauty, premium footwear, and elegant apparel. Elevating your everyday look with modern essentials.
            </p>
            {/* Social Icons */}
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all duration-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.76-2.245 3.76-5.487 0-2.861-2.063-4.869-5.007-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.166-1.495-.69-2.433-2.878-2.433-4.617 0-3.77 2.743-7.236 7.907-7.236 4.15 0 7.378 2.951 7.378 6.91 0 4.123-2.599 7.44-6.208 7.44-1.213 0-2.357-.63-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C11.12 23.949 11.558 24 12.017 24c6.62 0 11.983-5.367 11.983-11.987C24 5.367 18.637 0 12.017 0z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Shop */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="hover:text-pink-500 transition-colors">Home Page</Link></li>
              <li><Link href="/products/category/shoes" className="hover:text-pink-500 transition-colors">Shoes</Link></li>
              <li><Link href="/products/category/beauty" className="hover:text-pink-500 transition-colors">Beauty & Personal Care</Link></li>
              <li><Link href="/products/category/apparel" className="hover:text-pink-500 transition-colors">Apparel</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Customer Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/contact" className="hover:text-pink-500 transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping" className="hover:text-pink-500 transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/returns" className="hover:text-pink-500 transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/faq" className="hover:text-pink-500 transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Stay Connected</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Subscribe to get notified about new arrivals, sales events, and VIP updates.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="w-full bg-gray-900 border border-gray-800 focus:border-pink-500 focus:outline-hidden text-white rounded-lg px-3.5 py-2 text-xs transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-lg text-xs transition active:scale-[0.98] disabled:bg-pink-800 disabled:cursor-not-allowed"
              >
                {submitting ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* 💳 Bottom Bar: Copyright & Payment Badges */}
      <div className="border-t border-gray-900 bg-black/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <p className="text-xs text-gray-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} THE HORIZON Inc. All rights reserved. Made with Love.
          </p>

          {/* Payment Badges */}
          <div className="flex items-center gap-2">
            <span className="text-xxs uppercase tracking-widest text-gray-600 mr-2">Secure Payments:</span>
            <div className="flex gap-1.5 opacity-60">
              <span className="bg-gray-900 text-xxs text-gray-400 px-2 py-1 rounded font-semibold border border-gray-800">VISA</span>
              <span className="bg-gray-900 text-xxs text-gray-400 px-2 py-1 rounded font-semibold border border-gray-800">MC</span>
              <span className="bg-gray-900 text-xxs text-gray-400 px-2 py-1 rounded font-semibold border border-gray-800">AMEX</span>
              <span className="bg-gray-900 text-xxs text-gray-400 px-2 py-1 rounded font-semibold border border-gray-800">PAYPAL</span>
            </div>
          </div>

        </div>
      </div>

    </footer>
  );
}