
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const [orderNumber, setOrderNumber] = useState('');

  // 🎲 Generate a mock order number on the client side upon arrival
  useEffect(() => {
    const generatedNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(generatedNum);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center space-y-6">
        
        {/* 🎉 Animated Success Checkmark Ring */}
        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100 animate-bounce">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading Confirmation */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">Order Confirmed!</h1>
          <p className="text-sm text-gray-500">
            Thank you for your purchase. Your order has been logged and is now being packaged for shipping.
          </p>
        </div>

        {/* 📋 Order Tracking Details Panel */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-left space-y-2.5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-gray-500 uppercase tracking-wider">Order ID</span>
            <span className="font-mono font-bold text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">
              {orderNumber || "Processing..."}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-gray-500 uppercase tracking-wider">Estimated Delivery</span>
            <span className="font-medium text-gray-800">3 - 5 Business Days</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-gray-500 uppercase tracking-wider">Shipping Method</span>
            <span className="font-medium text-emerald-600">Standard (Free)</span>
          </div>
        </div>

        {/* Friendly Notice */}
        <p className="text-xs text-gray-400 italic">
          A receipt and shipment tracking details have been sent to the email address provided during checkout.
        </p>

        {/* 🧭 Navigation Actions */}
        <div className="pt-2">
          <Link 
            href="/" 
            className="block w-full bg-gray-950 hover:bg-pink-600 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors text-center shadow-md active:scale-[0.99]"
          >
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}