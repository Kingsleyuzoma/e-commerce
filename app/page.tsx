
"use client";

import ProductCard from '@/Components/shop/ProductCard';
import { useAuth } from '@/Context/AuthContext';

import { useCart } from '@/Context/CartContext';

export default function HomePage() {
  // 🪝 Grab the live products state from context (which already contains your products with stock)
  const { products } = useCart();
  const { isAdmin } = useAuth();

  return (
    <>
      {/* 🧭 Top Navigation Bar so users can see their cart count */}
     {isAdmin && (
  <div className="bg-red-600 text-white p-2 text-center font-bold">
    ⚠️ Admin Mode Active
  </div>
)}
      
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-gray-950 mb-2">
              Femel Beauty & Apparel 👑
            </h1>
            <p className="text-gray-600">Explore our latest arrivals</p>
          </header>

          {/* 🛍️ Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products && products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}