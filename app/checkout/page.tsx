
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/Context/CartContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext'; // 🔑 Import your global auth hook

export default function CheckoutPage() {
  const { cart, getTotalPrice, updateQuantity, removeFromCart, clearCart, decreaseStock } = useCart();
  const { user, login } = useAuth();
  const router = useRouter();

  // 📝 Form States
  const [shippingData, setShippingData] = useState({
    fullName: '', email: '', phone: '', address: '', city: '', postalCode: ''
  });
  const [paymentData, setPaymentData] = useState({
    cardName: '', cardNumber: '', expiry: '', cvv: ''
  });

  // ⚖️ Legal Compliance States
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const [error, setError] = useState('');

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingData({ ...shippingData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // 🏁 Process Complete Order (Now Asynchronous)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔒 1. Check Shipping
    if (!shippingData.fullName || !shippingData.email || !shippingData.phone || !shippingData.address || !shippingData.city || !shippingData.postalCode) {
      setError('Please fill in all delivery details before submitting.');
      return;
    }

    // 🔒 2. Check Payment
    if (!paymentData.cardName || !paymentData.cardNumber || !paymentData.expiry || !paymentData.cvv) {
      setError('Please complete your payment configuration inputs to proceed.');
      return;
    }

    // 🔒 3. Check Terms Agreement
    if (!isTermsAccepted) {
      setError('You must read and agree to the Terms and Conditions to place an order.');
      return;
    }

    try {
      // 💥 Success Sequence
      // ⏳ Wait for Firestore to permanently deduct stock numbers before wiping local states
      await decreaseStock(cart);
      clearCart();
      router.push("/checkout/success");
    } catch (err) {
      console.error("Checkout transaction failed: ", err);
      setError("An inventory error occurred while processing your order. Please try again.");
    }
  };

  // 🔒 Step 3: Authentication guard layer
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-4xl mb-4 block">🔒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
          <p className="text-sm text-gray-500 mb-6">
            Please sign in to your account to complete your order.
          </p>
          <Link href="/login" className="w-full block">
            <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm mb-4">
              Sign In Instantly
            </button>
          </Link>
          <p className="text-xs text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-pink-600 font-medium hover:underline">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-6xl mb-4 block">🛒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <Link href="/" className="inline-block mt-4 w-full bg-gray-950 text-white font-medium py-3 rounded-xl hover:bg-pink-600 transition-colors">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Secure Checkout</h1>
          <Link href="/" className="text-sm font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1">
            ← Back to Shop
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100">
                ⚠️ {error}
              </div>
            )}

            {/* Block 1: Shipping */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Shipping Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                  <input type="text" name="fullName" value={shippingData.fullName} onChange={handleShippingChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all" placeholder="Jane Doe" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                    <input type="email" name="email" value={shippingData.email} onChange={handleShippingChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all" placeholder="jane@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={shippingData.phone} onChange={handleShippingChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all" placeholder="08012345678" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Street Address</label>
                  <input type="text" name="address" value={shippingData.address} onChange={handleShippingChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all" placeholder="123 Luxury Lane" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
                    <input type="text" name="city" value={shippingData.city} onChange={handleShippingChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all" placeholder="Port Harcourt" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Postal Code</label>
                    <input type="text" name="postalCode" value={shippingData.postalCode} onChange={handleShippingChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all" placeholder="500101" />
                  </div>
                </div>
              </div>
            </div>

            {/* Block 2: Payment */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Payment Information
              </h2>
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Name on Card</label>
                  <input type="text" name="cardName" value={paymentData.cardName} onChange={handlePaymentChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all" placeholder="JANE DOE" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Card Number</label>
                  <input type="text" name="cardNumber" maxLength={16} value={paymentData.cardNumber} onChange={handlePaymentChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all" placeholder="4242 •••• •••• 4242" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expiration Date</label>
                    <input type="text" name="expiry" maxLength={5} value={paymentData.expiry} onChange={handlePaymentChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all" placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Security Code (CVV)</label>
                    <input type="password" name="cvv" maxLength={3} value={paymentData.cvv} onChange={handlePaymentChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all" placeholder="•••" />
                  </div>
                </div>
                <button type="submit" className="hidden" id="hidden-submit-btn" />
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar Summary */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-h-80 overflow-y-auto space-y-4">
              <h2 className="text-md font-bold text-gray-900 tracking-wide">Review Cart Items</h2>
              {cart.map((item) => {
                const currentPrice = item.product.salePrice ?? item.product.price;
                return (
                  <div key={item.product.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <img src={item.product.imageUrl || "/placeholder.jpg"} alt={item.product.name} className="w-12 h-12 object-cover rounded-xl bg-gray-50 border" />
                      <div>
                        <h3 className="font-semibold text-gray-800 text-xs line-clamp-1">{item.product.name}</h3>
                        <p className="text-xs text-gray-400">${currentPrice.toFixed(2)} each</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-700">Qty: {item.quantity}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-3">
                  <span>Total Amount</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>

              {/* ⚖️ Terms and Conditions Tick Box */}
              <div className="pt-2 flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  id="termsCheckbox"
                  checked={isTermsAccepted}
                  onChange={(e) => setIsTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-pink-600 rounded cursor-pointer"
                />
                <label htmlFor="termsCheckbox" className="text-xs text-gray-500 leading-tight cursor-pointer select-none">
                  I have read and agree to the website{' '}
                  <button 
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="text-pink-600 font-semibold underline hover:text-pink-700"
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>

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

      {/* 🔮 TERMS AND CONDITIONS MODAL */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[70vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Terms and Conditions</h3>
              <button onClick={() => setIsTermsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-800">1. Order Processing & Acceptance</p>
              <p>By clicking "Place Order", you agree that all stock counts and processed inventory deductions are final representations of point-of-sale layout confirmations.</p>
              <p className="font-semibold text-gray-800">2. Mock Payment Protocols</p>
              <p>This store is handling standard validation flows. All details entered into card configurations are validated locally on client device layouts and are not captured maliciously.</p>
              <p className="font-semibold text-gray-800">3. Shipping Policies</p>
              <p>Estimated timelines are standard mock calculations subject to live fulfillment settings once database pipelines are active.</p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex justify-end">
              <button
                onClick={() => {
                  setIsTermsAccepted(true);
                  setIsTermsModalOpen(false);
                }}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs py-2.5 px-5 rounded-lg transition-colors"
              >
                Accept and Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}