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
    slug?: string;
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

  // Safe route param fallback (uses slug first, falls back to name)
  const productPath = `/products/details/${encodeURIComponent(product.slug || product.name)}`;

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
    <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[22px] border border-[#E7E4DC] bg-[#FAF9F6] p-4 text-[#1C1917] shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgba(28,25,23,0.25)]">
      <div>
        {/* Product Image */}
        <Link
          href={productPath}
          className="relative mb-4 block aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border border-[#E7E4DC] bg-[#F1EFE8]"
        >
          <img
            src={product.imageUrl || "/placeholder-image.jpg"}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />

          {/* Badges */}
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            {product.isNew && (
              <span className="rounded-full border border-[#1C1917]/10 bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1C1917] backdrop-blur-sm">
                New Arrival
              </span>
            )}
            {hasSale && (
              <span className="rounded-full bg-[#B23A2E] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
                −{product.salePercentage}% Off
              </span>
            )}
          </div>
        </Link>

        {/* Brand & Category */}
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#78716C]">
            {product.brand}
          </span>
          <span className="rounded-full bg-[#F1EFE8] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#78716C]">
            {product.category}
          </span>
        </div>

        {/* Product Name & Description */}
        <Link href={productPath} className="block cursor-pointer">
          <h3 className="mb-1 font-serif text-[1.05rem] font-medium leading-snug tracking-tight text-[#1C1917] line-clamp-1 transition-colors group-hover:text-[#B23A2E]">
            {product.name}
          </h3>
        </Link>
        <p className="mb-3.5 h-8 text-xs leading-relaxed text-[#78716C] line-clamp-2">
          {product.description}
        </p>

        {/* Colors Selection */}
        {hasVariants && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-[10px] uppercase tracking-[0.12em] text-[#A8A29E]">Color</span>
            {product.variants.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleColorChange(v.color)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition-all ${
                  selectedColor === v.color
                    ? "border-[#1C1917] bg-[#1C1917] text-white"
                    : "border-[#E7E4DC] bg-white text-[#57534E] hover:border-[#1C1917]/40"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full border border-black/10"
                  style={{ backgroundColor: v.color.toLowerCase() }}
                />
                {v.color}
              </button>
            ))}
          </div>
        )}

        {/* Sizes Display */}
        {activeVariant && activeVariant.sizes.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-[10px] uppercase tracking-[0.12em] text-[#A8A29E]">Size</span>
            {activeVariant.sizes.map((s, idx) => {
              const isOutOfStock = s.stock === 0;
              const isSelected = selectedSize === s.size;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setSelectedSize(s.size)}
                  className={`relative rounded-md border px-2 py-1 text-[11px] font-medium transition-all ${
                    isOutOfStock
                      ? "cursor-not-allowed border-[#E7E4DC] text-[#D6D3CD] line-through"
                      : isSelected
                      ? "border-[#1C1917] bg-[#1C1917] text-white"
                      : "border-[#E7E4DC] bg-white text-[#1C1917] hover:border-[#1C1917]/50"
                  }`}
                >
                  {s.size}
                  <span className={`ml-1 text-[9px] ${isSelected ? "text-white/60" : "text-[#A8A29E]"}`}>
                    {s.stock}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        {/* Stock Info Status */}
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-[#78716C]">
          <span className="relative flex h-2 w-2">
            {totalStock > 0 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5F7355] opacity-60" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${totalStock > 0 ? "bg-[#5F7355]" : "bg-[#B23A2E]"}`} />
          </span>
          <span>
            {totalStock > 0 ? (
              <>
                <span className="font-semibold text-[#1C1917]">{totalStock}</span> in stock
              </>
            ) : (
              <span className="font-semibold text-[#B23A2E]">Out of stock</span>
            )}
          </span>
        </div>

        {/* Price Row & Action Button */}
        <div className="flex items-center justify-between gap-3 border-t border-dashed border-[#E7E4DC] pt-3">
          <div className="relative">
            <span className="pointer-events-none absolute -left-[3px] top-1/2 z-10 h-[7px] w-[7px] -translate-y-1/2 rounded-full border border-[#E7E4DC] bg-[#FAF9F6]" />
            <div className="flex flex-col rounded-r-md rounded-l-[3px] border border-dashed border-[#D6D3CD] bg-white py-1 pl-3.5 pr-3">
              {hasSale ? (
                <>
                  <span className="text-[10px] leading-none text-[#A8A29E] line-through">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="font-serif text-lg font-semibold leading-tight text-[#B23A2E]">
                    ${salePrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="font-serif text-lg font-semibold leading-tight text-[#1C1917]">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={totalStock === 0}
            onClick={handleAddToCart}
            className="cursor-pointer whitespace-nowrap rounded-full bg-[#1C1917] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#B23A2E] disabled:cursor-not-allowed disabled:bg-[#E7E4DC] disabled:text-[#A8A29E]"
          >
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
}