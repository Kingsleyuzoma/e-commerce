"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from "@/Context/CartContext"; 

interface SizeVariant {
  size: string | number;
  stock: number;
}

interface ColorVariant {
  color: string;
  sizes: SizeVariant[];
}

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    description: string;
    price: number;
    salePercentage: number;
    category: string;
    isNew: boolean;
    imageUrl: string;
    variants: ColorVariant[];
    tags: string[];
    availableStock: number; 
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart(); 

  const hasVariants = product.variants && product.variants.length > 0;

  const [selectedColor, setSelectedColor] = useState<string | null>(
    hasVariants ? product.variants[0].color : null
  );
  const [selectedSize, setSelectedSize] = useState<string | number | null>(null);

  // 🧮 Evaluates variant stocks or global base storage numbers seamlessly
  const totalStock = hasVariants
    ? product.variants.reduce((total, variant) => {
        const variantStock = variant.sizes.reduce((sum, sizeItem) => sum + sizeItem.stock, 0);
        return total + variantStock;
      }, 0)
    : Number(product.availableStock) || 0;

  const hasSale = product.salePercentage > 0;
  const salePrice = hasSale ? product.price * (1 - product.salePercentage / 100) : product.price;

  const activeVariant = hasVariants 
    ? product.variants.find((v) => v.color === selectedColor)
    : undefined;

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setSelectedSize(null); 
  };

  const handleAddToCart = () => {
    if (hasVariants) {
      if (!selectedColor) {
        alert("Please choose a color before adding to the cart! 🎨");
        return;
      }
      if (!selectedSize) {
        alert("Please select a size before adding to the cart! 📐");
        return;
      }

      const specificSizeObj = activeVariant?.sizes.find(s => s.size === selectedSize);
      const availableStockForThisVariant = specificSizeObj ? specificSizeObj.stock : 0;

      if (availableStockForThisVariant <= 0) {
        alert("Sorry, this exact variant is out of stock! 📦");
        return;
      }
    } else {
      if (totalStock <= 0) {
        alert("Sorry, this item is out of stock! 📦");
        return;
      }
    }

    addToCart({
      id: hasVariants ? `${product.id}-${selectedColor}-${selectedSize}` : `${product.id}-default`,
      quantity: 1,
      selectedColor: hasVariants ? (selectedColor || "") : "",
      selectedSize: hasVariants ? String(selectedSize) : "",
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand || "Generic",
        price: product.price,
        salePrice: hasSale ? salePrice : undefined,
        imageUrl: product.imageUrl || "/placeholder-image.jpg",
        description: product.description,
        category: product.category,
      }
    });

    alert(`🎉 Added ${product.name} to your shopping bag!`);
  };

  return (
    <div className="group relative border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full text-sm text-gray-800">
      <div>
        {/* Badges */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-1">
          {product.isNew && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              New
            </span>
          )}
          {hasSale && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              -{product.salePercentage}%
            </span>
          )}
        </div>

        {/* Product Image */}
        <Link href={`/products/details/${product.name}`} className="block aspect-square w-full bg-gray-100 rounded-lg overflow-hidden relative border border-gray-100 mb-4 cursor-pointer">
          <img
            src={product.imageUrl || "/placeholder-image.jpg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Brand & Category */}
        <div className="flex justify-between items-center text-gray-400 uppercase tracking-wider mb-1">
          <span>{product.brand}</span>
          <span className="bg-gray-100 px-2 py-0.5 rounded text-[12px] font-medium tracking-normal normal-case">{product.category}</span>
        </div>

        {/* Product Name & Description */}
        <Link href={`/products/details/${product.name}`} className="block cursor-pointer">
          <h3 className="font-semibold text-gray-800 text-base line-clamp-1 mb-1 hover:text-gray-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">{product.description}</p>

        {/* Colors Selection */}
        {hasVariants && (
          <div className="flex flex-wrap gap-1 mb-3 items-center">
            <span className="text-[11px] text-gray-400 mr-1">Colors:</span>
            {product.variants.map((v, i) => (
              <button 
                key={i} 
                type="button"
                onClick={() => handleColorChange(v.color)}
                className={`text-xs px-2 py-0.5 border rounded font-medium transition-all ${
                  selectedColor === v.color
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {v.color}
              </button>
            ))}
          </div>
        )}

        {/* Sizes Display */}
        {activeVariant && activeVariant.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3 items-center">
            <span className="text-[11px] text-gray-400 mr-1">Sizes:</span>
            {activeVariant.sizes.map((s, idx) => {
              const isOutOfStock = s.stock === 0;
              const isSelected = selectedSize === s.size;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setSelectedSize(s.size)}
                  className={`text-[11px] px-1.5 py-0.5 border rounded font-medium transition-all ${
                    isOutOfStock
                      ? "bg-gray-100 border-gray-200 text-gray-400 line-through opacity-50 cursor-not-allowed"
                      : isSelected
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-300 text-gray-800 hover:border-gray-400"
                  }`}
                >
                  {s.size} <span className={`text-[9px] ${isSelected ? "text-gray-300" : "text-gray-400"}`}>({s.stock})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        {/* Stock Info Status */}
        <div className="mb-3 text-xs font-medium text-gray-500 flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${totalStock > 0 ? "bg-green-500" : "bg-red-500"}`}></span>
          <span>
            Total Stock:{" "}
            <span className={totalStock > 0 ? "text-gray-800 font-semibold" : "text-red-500 font-semibold"}>
              {totalStock > 0 ? totalStock : "Out of Stock"}
            </span>
          </span>
        </div>

        {/* Price Row & Action Button */}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            {hasSale ? (
              <>
                <span className="text-xs text-gray-400 line-through">${product.price.toFixed(2)}</span>
                <span className="text-lg font-bold text-red-500">${salePrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
            )}
          </div>

          <button
            type="button"
            disabled={totalStock === 0}
            onClick={handleAddToCart}
            className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}