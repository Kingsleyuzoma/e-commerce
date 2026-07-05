
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/Context/CartContext';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { cart, getTotalPrice, updateQuantity, removeFromCart, clearCart, decreaseStock } = useCart();
  const router = useRouter();

  // 📝 Step 1: Shipping Form States
  const [shippingData, setShippingData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  // 💳 Step 2: Payment Form States
  const [paymentData, setPaymentData] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const [error, setError] = useState('');

  // 📥 Handle Input Changes for Shipping
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingData({
      ...shippingData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  // 📥 Handle Input Changes for Payment
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  // 🏁 Validate and Process Complete Order
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔒 1. Check Shipping Details
    if (!shippingData.fullName || !shippingData.email || !shippingData.phone || !shippingData.address || !shippingData.city || !shippingData.postalCode) {
      setError('Please fill in all delivery details before submitting.');
      return;
    }

    // 🔒 2. Check Payment Details
    if (!paymentData.cardName || !paymentData.cardNumber || !paymentData.expiry || !paymentData.cvv) {
      setError('Please complete your payment configuration inputs to proceed.');
      return;
    }

    // 💥 Success! Run state reductions and checkout wrap-up
    decreaseStock(cart);
    clearCart();
    
    router.push("/checkout/success");
  };

  // 🛒❌ Handle empty cart state fallback
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-6xl mb-4 block">🛒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">You haven't added any items to your checkout list yet.</p>
          <Link 
            href="/" 
            className="inline-block w-full bg-gray-950 text-white font-medium py-3 px-4 rounded-xl transition-colors text-center shadow-md hover:bg-pink-600"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Secure Checkout</h1>
          <Link 
            href="/" 
            className="text-sm font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1 group transition-colors"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform inline-block">←</span> 
            Back to Shop
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 📑 LEFT COLUMN: Shipping and Payment Input Sections */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Global Error Banner */}
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 shadow-sm">
                ⚠️ {error}
              </div>
            )}

            {/* 🏠 BLOCK 1: Shipping Information Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Shipping & Delivery Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" name="fullName" value={shippingData.fullName} onChange={handleShippingChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input 
                      type="email" name="email" value={shippingData.email} onChange={handleShippingChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                    <input 
                      type="tel" name="phone" value={shippingData.phone} onChange={handleShippingChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                      placeholder="08012345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Street Address</label>
                  <input 
                    type="text" name="address" value={shippingData.address} onChange={handleShippingChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                    placeholder="123 Luxury Lane"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">City</label>
                    <input 
                      type="text" name="city" value={shippingData.city} onChange={handleShippingChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                      placeholder="Port Harcourt"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Postal Code</label>
                    <input 
                      type="text" name="postalCode" value={shippingData.postalCode} onChange={handleShippingChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                      placeholder="500101"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 💳 BLOCK 2: Mock Payment Information Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Payment Information
              </h2>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Name on Card</label>
                  <input 
                    type="text" name="cardName" value={paymentData.cardName} onChange={handlePaymentChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                    placeholder="JANE DOE"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Card Number</label>
                  <input 
                    type="text" name="cardNumber" maxLength={16} value={paymentData.cardNumber} onChange={handlePaymentChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                    placeholder="4242 •••• •••• 4242"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Expiration Date</label>
                    <input 
                      type="text" name="expiry" maxLength={5} value={paymentData.expiry} onChange={handlePaymentChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Security Code (CVV)</label>
                    <input 
                      type="password" name="cvv" maxLength={3} value={paymentData.cvv} onChange={handlePaymentChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                      placeholder="•••"
                    />
                  </div>
                </div>

                {/* Hidden programmatic execution submission button */}
                <button type="submit" className="hidden" id="hidden-submit-btn" />
              </form>
            </div>

          </div>

          {/* 💳 RIGHT COLUMN: Sticky Order Summary Sidebar */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            
            {/* Items Review List Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-h-80 overflow-y-auto space-y-4">
              <h2 className="text-md font-bold text-gray-900 tracking-wide">Review Cart Items</h2>
              {cart.map((item) => {
                const currentPrice = item.product.salePrice ?? item.product.price;
                return (
                  <div key={item.product.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.product.imageUrl || "/placeholder.jpg"} 
                        alt={item.product.name} 
                        className="w-12 h-12 object-cover rounded-xl bg-gray-50 border border-gray-100"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-800 text-xs line-clamp-1">{item.product.name}</h3>
                        <p className="text-xs text-gray-400">${currentPrice.toFixed(2)} each</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 text-xs">
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-gray-200 text-gray-600 font-bold transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 font-semibold text-gray-800">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-gray-200 text-gray-600 font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculations Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-semibold">Free</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-3">
                  <span>Total Amount</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>

              {/* Connected to programmatic submit trigger */}
              <button 
                onClick={() => document.getElementById('hidden-submit-btn')?.click()}
                className="w-full mt-2 bg-gray-950 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition-all text-center shadow-md active:scale-[0.99]"
              >
                Place Order
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}