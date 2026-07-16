"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("ord") || "ORD-XXXXXX";

  return (
    <div className="max-w-md mx-auto text-center py-24 px-4 text-sm text-gray-800">
      <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 border border-green-100 animate-bounce">
        ✓
      </div>
      
      <h1 className="text-2xl font-extrabold text-gray-950 mb-2 tracking-tight">
        Thank you for your purchase!
      </h1>
      
      <p className="text-gray-500 mb-6 font-medium">
        Your order has been received and is being processed.
      </p>

      {/* 📦 Order Card Box */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-8 text-left">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Order Number</span>
          <span className="font-mono text-xs font-bold text-gray-800 bg-white border px-2 py-1 rounded">
            {orderNumber}
          </span>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          A confirmation email will be sent shortly with shipment tracking.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link 
          href="/" 
          className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors text-center text-xs"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    // Wrapped in Suspense because useSearchParams() requires it in Next.js App Router static builds
    <Suspense fallback={
      <div className="text-center py-24 text-gray-500 text-xs">Loading receipt...</div>
    }>
      <SuccessContent />
    </Suspense>
  );
}