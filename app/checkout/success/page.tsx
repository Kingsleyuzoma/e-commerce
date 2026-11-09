"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/Context/CartContext";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const { clearCart } = useCart();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("FEMEL-XXXXXX");
  const [errorMessage, setErrorMessage] = useState("");

  const verificationRun = useRef(false);

  // 1. Fetch & Verify API 
  useEffect(() => {
    if (!reference || verificationRun.current) return;
    verificationRun.current = true;

    const verifyOrder = async () => {
      try {
        const res = await fetch(`/api/paystack/verify?reference=${reference}`);
        const result = await res.json();

        if (result.status === true) {
          setOrderNumber(result.orderNumber || "FEMEL-ORDER");
          setSuccess(true);
        } else {
          setSuccess(false);
          setErrorMessage(result.message || "Payment verification failed.");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setSuccess(false);
        setErrorMessage("An error occurred while confirming your payment.");
      } finally {
        setVerifying(false);
      }
    };

    verifyOrder();
  }, [reference]);

  // 2. Clear Cart & Handle Redirect Hook
  useEffect(() => {
    if (!success) return;

    // Clear cart immediately upon successful state confirmation
    try {
      clearCart();
    } catch (e) {
      console.error("Failed to clear cart:", e);
    }

    // Automatically redirect home after 4 seconds
    const timer = setTimeout(() => {
      router.push("/");
    }, 4000);

    return () => clearTimeout(timer);
  }, [success, router]); // clearCart removed from dependency array to prevent infinite re-renders

  if (!reference) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4 text-sm text-gray-800">
        <h1 className="text-2xl font-extrabold mb-2">Thank you for your purchase!</h1>
        <Link href="/" className="inline-block bg-gray-900 text-white font-bold py-3 px-6 rounded-xl mt-4">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="max-w-md mx-auto text-center py-28 px-4 text-sm text-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-6"></div>
        <h2 className="text-lg font-bold">Verifying your payment and recording order...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-24 px-4 text-sm text-gray-800">
      {success ? (
        <>
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 border border-green-100">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Thank you for your purchase!</h1>
          <p className="text-gray-500 mb-6">Payment verified. Redirecting you home...</p>

          <div className="bg-gray-50 rounded-xl border p-5 mb-8 text-left space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-bold uppercase">Order Number</span>
              <span className="font-mono text-xs font-bold bg-white border px-2 py-1 rounded">
                {orderNumber}
              </span>
            </div>
          </div>

          <button 
            onClick={() => {
              clearCart();
              router.push("/");
            }} 
            className="block w-full bg-gray-900 text-white font-bold py-3 rounded-xl transition-all hover:bg-gray-800"
          >
            Continue Shopping Now
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold mb-2">Verification Failed</h1>
          <p className="text-gray-500 mb-6">{errorMessage}</p>
          <Link href="/checkout" className="block w-full bg-pink-600 text-white font-bold py-3 rounded-xl">
            Return to Checkout
          </Link>
        </>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-28 text-xs">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}