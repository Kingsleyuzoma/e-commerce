"use client";

import React, { useState } from "react";
import { useCart } from "@/Context/CartContext"; 
import { calculateUSTax, calculateUSShipping } from "@/utils/usTaxShippingCalculator";
import { SHIPPING_CONFIG } from "@/config/checkoutConfig";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { reduceProductStock } from "@/utils/inventory";
import { createOrder } from "@/utils/orders"

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const router = useRouter();

  //processing state to disable checkout butoon click spam
  const [isProcessing, setIsProcessing] = useState(false)


  // 📝 Customer Shipping Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "", 
    zipCode: "",
  });

  // 📜 Terms & Conditions Checkbox State
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // 🧮 Calculate Cart Subtotal
  const subtotal = cart.reduce((total, item) => {
    const itemPrice = item.product.salePrice || item.product.price;
    return total + itemPrice * item.quantity;
  }, 0);

  // 🚚 Dynamic Tax and Shipping Calculations
  const shippingCost = formData.state ? calculateUSShipping(subtotal, formData.state) : 0;
  const taxCost = formData.state ? calculateUSTax(subtotal, formData.state) : 0;
  const grandTotal = subtotal + shippingCost + taxCost;

  // Calculate how close they are to free shipping (if they are in a state that qualifies)
  const isNonContiguous = ["AK", "HI", "PR"].includes(formData.state.toUpperCase());
  const amountLeftForFreeShipping = Math.max(0, SHIPPING_CONFIG.freeShippingThreshold - subtotal);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.state) {
      alert("Please select a shipping state to calculate shipping and taxes!");
      return;
    }

    if (!agreeToTerms) {
      alert("You must agree to the Terms and Conditions to proceed!");
      return;
    }

    try {
      setIsProcessing(true);

      // 1. 📉 Deduct stock levels inside transaction
      await reduceProductStock(cart);

      // 2. 📝 Save Order details to Firestore
      const orderNumber = await createOrder(
        formData, // Customer details
        cart,     // Cart items
        {         // Financial totals
          subtotal,
          shipping: shippingCost,
          tax: taxCost,
          grandTotal,
        }
      );

      // 3. 🚀 Clear active shopping bag
      clearCart();

      // 4. 🚀 Route to your success screen, passing the Order Number in the URL!
      router.push(`/checkout/success?ord=${orderNumber}`);
    } catch (error: any) {
      console.error("Failed to process order:", error);
      alert(error.message || "An error occurred while placing your order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <span className="text-4xl block mb-4">🛒</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-500 mb-6">Add some products to your bag before checking out.</p>
        <Link href="/" className="bg-gray-900 text-white text-xs font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
          Go Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-gray-800">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-8 tracking-tight">Secure Checkout</h1>
      

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 📝 LEFT COLUMN: Shipping Form & Legal Accords */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">📦 Shipping Address</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="johndoe@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 555-5555"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Street Address</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="New Orleans"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">State</label>
                  <select
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-xs bg-white"
                  >
                    <option value="">Select State</option>
                    <option value="AL">Alabama (AL)</option>
                    <option value="AK">Alaska (AK)</option>
                    <option value="AZ">Arizona (AZ)</option>
                    <option value="AR">Arkansas (AR)</option>
                    <option value="CA">California (CA)</option>
                    <option value="CO">Colorado (CO)</option>
                    <option value="CT">Connecticut (CT)</option>
                    <option value="DE">Delaware (DE)</option>
                    <option value="FL">Florida (FL)</option>
                    <option value="GA">Georgia (GA)</option>
                    <option value="HI">Hawaii (HI)</option>
                    <option value="ID">Idaho (ID)</option>
                    <option value="IL">Illinois (IL)</option>
                    <option value="IN">Indiana (IN)</option>
                    <option value="IA">Iowa (IA)</option>
                    <option value="KS">Kansas (KS)</option>
                    <option value="KY">Kentucky (KY)</option>
                    <option value="LA">Louisiana (LA) - Nexus 🏠</option>
                    <option value="ME">Maine (ME)</option>
                    <option value="MD">Maryland (MD)</option>
                    <option value="MA">Massachusetts (MA)</option>
                    <option value="MI">Michigan (MI)</option>
                    <option value="MN">Minnesota (MN)</option>
                    <option value="MS">Mississippi (MS)</option>
                    <option value="MO">Missouri (MO)</option>
                    <option value="MT">Montana (MT)</option>
                    <option value="NE">Nebraska (NE)</option>
                    <option value="NV">Nevada (NV)</option>
                    <option value="NH">New Hampshire (NH)</option>
                    <option value="NJ">New Jersey (NJ)</option>
                    <option value="NM">New Mexico (NM)</option>
                    <option value="NY">New York (NY)</option>
                    <option value="NC">North Carolina (NC)</option>
                    <option value="ND">North Dakota (ND)</option>
                    <option value="OH">Ohio (OH)</option>
                    <option value="OK">Oklahoma (OK)</option>
                    <option value="OR">Oregon (OR)</option>
                    <option value="PA">Pennsylvania (PA)</option>
                    {/* 🇵🇷 ADDED PUERTO RICO */}
                    <option value="PR">Puerto Rico (PR)</option> 
                    <option value="RI">Rhode Island (RI)</option>
                    <option value="SC">South Carolina (SC)</option>
                    <option value="SD">South Dakota (SD)</option>
                    <option value="TN">Tennessee (TN)</option>
                    <option value="TX">Texas (TX)</option>
                    <option value="UT">Utah (UT)</option>
                    <option value="VT">Vermont (VT)</option>
                    <option value="VA">Virginia (VA)</option>
                    <option value="WA">Washington (WA)</option>
                    <option value="WV">West Virginia (WV)</option>
                    <option value="WI">Wisconsin (WI)</option>
                    <option value="WY">Wyoming (WY)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    maxLength={5}
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="70112"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ⚖️ TERMS AND CONDITIONS ACCORD CHECKBOX */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-950 cursor-pointer"
            />
            <label htmlFor="agreeToTerms" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
              I have read and agree to the website's{" "}
              <Link href="/terms" target="_blank" className="font-bold text-gray-900 underline hover:text-gray-700">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="font-bold text-gray-900 underline hover:text-gray-700">
                Privacy Policy
              </Link>.
            </label>
          </div>

     <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-gray-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer text-sm"
          >
            {isProcessing ? "Processing Order..." : `Complete Purchase ($${grandTotal.toFixed(2)})`}
          </button>

        </form>

        {/* 💳 RIGHT COLUMN: Order Summary Card */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">🛒 Order Summary</h2>
            
            {/* Free Shipping Progress bar */}
            {!formData.state ? (
              <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg mb-4 font-medium border border-gray-100">
                Please enter your shipping state to check shipping options.
              </p>
            ) : isNonContiguous ? (
              <p className="text-xs text-amber-800 bg-amber-50/50 p-2.5 rounded-lg mb-4 font-medium border border-amber-100">
                ✈️ Flat premium rate applies to non-continental shipping destinations (AK, HI, PR).
              </p>
            ) : amountLeftForFreeShipping > 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg mb-4 font-medium border border-amber-100">
                Add <span className="font-bold">${amountLeftForFreeShipping.toFixed(2)}</span> more to unlock free shipping!
              </p>
            ) : (
              <p className="text-xs text-green-700 bg-green-50 p-2.5 rounded-lg mb-4 font-medium border border-green-100">
                🎉 Congrats! Your order qualifies for Free Shipping.
              </p>
            )}

            {/* List items */}
            <div className="max-h-48 overflow-y-auto mb-4 pr-1 divide-y divide-gray-100">
              {cart.map((item, idx) => {
                const itemPrice = item.product.salePrice || item.product.price;
                return (
                  <div key={idx} className="flex gap-3 py-3 items-center">
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="w-10 h-10 rounded-md object-cover border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400">
                        Qty: {item.quantity} {item.selectedColor && `| ${item.selectedColor}`} {item.selectedSize && `| Size ${item.selectedSize}`}
                      </p>
                    </div>
                    <span className="font-semibold">${(itemPrice * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div className="space-y-3 pt-4 border-t border-gray-100 text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-gray-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-gray-800">
                  {!formData.state ? (
                    <span className="text-xs text-gray-400 font-normal">Select state first</span>
                  ) : shippingCost === 0 ? (
                    <span className="text-green-600 font-bold">FREE</span>
                  ) : (
                    `$${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sales Tax (5% LA Only)</span>
                <span className="font-medium text-gray-800">
                  {!formData.state ? (
                    <span className="text-xs text-gray-400 font-normal">Select state first</span>
                  ) : (
                    `$${taxCost.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-gray-900 font-extrabold text-base">
                <span>Grand Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}