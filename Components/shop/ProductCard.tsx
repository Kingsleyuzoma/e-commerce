
"use client";
import { useCart } from '@/Context/CartContext';
import React from 'react';

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  isNew: boolean;
  imageUrl: string;
  availableStock: number;
  colors?: string[]; // 🎨 Supported colors array
  sizes?: string[];  // 📏 Supported sizes array
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cart } = useCart();
  
  const cartItem = cart.find(item => item.product.id === product.id);
  const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
  
  const isSoldOut = product.availableStock <= 0;
  const isMaxStockReached = currentQuantityInCart >= product.availableStock;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full relative">
      
      {/* 🏷️ Badges Container */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {product.isNew && (
          <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
            New
          </span>
        )}
        {product.salePrice && (
          <span className="bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
            Sale
          </span>
        )}
      </div>

      {/* 🖼️ Product Image */}
      <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
        <img
          src={product.imageUrl || "/placeholder.jpg"}
          alt={product.name}
          className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* 📝 Product Details */}
      <div className="p-4 flex flex-col grow">
        <span className="text-xs font-semibold uppercase tracking-widest text-pink-600 mb-1">
          {product.brand}
        </span>
        
        <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1">
          {product.name}
        </h3>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 grow">
          {product.description}
        </p>

        {/* 🎨 Variations Previews (Colors & Sizes) */}
        <div className="space-y-2 mb-4">
          {product.colors && product.colors.length > 0 && (
            <div className="flex gap-1 items-center flex-wrap">
              <span className="text-[10px] text-gray-400 font-medium">Colors:</span>
              <div className="flex gap-1 flex-wrap">
                {product.colors.map(color => (
                  <span key={color} className="text-[10px] px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600">
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="flex gap-1 items-center flex-wrap">
              <span className="text-[10px] text-gray-400 font-medium">Sizes:</span>
              <div className="flex gap-1 flex-wrap">
                {product.sizes.map(size => (
                  <span key={size} className="text-[10px] px-1.5 py-0.5 font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded">
                    {size}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 💰 Pricing Logic & Stock Tracking */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            {product.salePrice ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-rose-600">
                  ${product.salePrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-xl font-extrabold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
            )}
            
            <p className="text-sm text-gray-500 mt-1">
              In Stock: {product.availableStock ?? 0}
            </p>
          </div>
          
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
            {product.category}
          </span>
        </div>

        {/* 🛒 Add to Cart Button */}
        <button
          onClick={() => addToCart(product)}
          disabled={isSoldOut || isMaxStockReached}
          className={`mt-4 w-full text-sm font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] ${
            isSoldOut || isMaxStockReached
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" 
              : "bg-gray-950 text-white hover:bg-pink-600"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {isSoldOut 
            ? "Sold Out" 
            : isMaxStockReached 
              ? "Max Stock Added 📦" 
              : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;