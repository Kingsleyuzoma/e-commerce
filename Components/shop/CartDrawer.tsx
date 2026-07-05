"use client";

import React from 'react';
import { useCart } from '@/Context/CartContext';
import Link from 'next/link';

const CartDrawer: React.FC = () => {
  // 🔌 Pulling the management functions from our custom hook
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart 
  } = useCart();

  // 🧮 Calculate total price based on item quantities
  const totalPrice = cart.reduce((accumulator, item) => {
    const displayPrice = item.product.salePrice ?? item.product.price;
    return accumulator + (displayPrice * item.quantity);
  }, 0);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 🌫️ Backdrop shadow overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* 📥 Drawer Panel container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-xl flex flex-col h-full">
          
          {/* 🏷️ Header Area */}
          <div className='flex items-center justify-between p-4 border-b border-gray-100'>
            <h2 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
              <span>Your Cart</span>
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 rounded-lg hover:bg-gray-50 transition-colors hover:text-gray-500 focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* 📦 Cart Items List area */}
          <div className='flex-1 overflow-y-auto p-4 space-y-4'>
            {cart.length === 0 ? ( 
              <div className='text-center py-12 text-gray-500'>
                <p className='text-lg font-medium'>Your cart is empty</p>
                <p className='text-sm mt-1'>Add some products to your cart to get started</p>
              </div>
            ) : (
              cart.map((item) => {
                const displayPrice = item.product.salePrice ?? item.product.price;
                
                return (
                  <div key={item.product.id} className='flex items-start gap-4 py-4 border-b border-gray-100 relative group'>
                    <img 
                      src={item.product.imageUrl || "/placeholder.jpg"} 
                      alt={item.product.name} 
                      className='w-20 h-20 object-cover rounded-lg bg-gray-100 flex-shrink-0' 
                    />
                     
                    {/* 📝 Product Info & Controls */}
                    <div className='flex-1 min-w-0'>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className='font-medium text-gray-950 truncate pr-4'>{item.product.name}</h4>
                        {/* 🗑️ Remove Item Button */}
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                      <p className='text-xs text-gray-500 uppercase tracking-wider'>{item.product.brand}</p>
                      
                      <div className='flex items-center justify-between mt-3'>
                        <p className='text-sm text-gray-900 font-semibold'>
                          ${(displayPrice * item.quantity).toFixed(2)}
                        </p>
                        
                        {/* 🔢 Quantity Selector Controls */}
                        <div className='flex items-center border border-gray-200 rounded-lg bg-white shadow-sm'>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className='px-2.5 py-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors rounded-l-lg'
                          >
                            ➖
                          </button>
                          <span className='px-3 py-1 text-sm font-medium text-gray-900 bg-gray-50 min-w-[32px] text-center'>
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className='px-2.5 py-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors rounded-r-lg'
                          >
                            ➕
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
       
          {/* 💰 Footer area */}
          <div className='p-4 border-t border-gray-100 bg-gray-50'>
            <div className='flex items-center justify-between mb-4'>
              <span className='text-base font-medium text-gray-900'>Subtotal</span>
              <span className='text-xl font-bold text-gray-900'>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <Link href='/checkout' className='w-full' onClick={() => setIsCartOpen(false)}>
              <button className='w-full bg-pink-600 text-white py-3 px-4 rounded-xl text-lg font-semibold hover:bg-pink-700 transition-colors shadow-sm'>
                Proceed to Checkout
              </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;