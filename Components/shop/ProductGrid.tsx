"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import ProductCard from './ProductCard'; // 🛒 Imported your custom card component

// 📐 Define variant structures to match your database payload
interface SizeVariant {
  size: string | number;
  stock: number;
}

interface ColorVariant {
  color: string;
  sizes: SizeVariant[];
}

interface Product {
  id: string;
  slug: string; // 🛡️ Added to the local type definition
  name: string;
  category: string;
  brand: string;
  price: number;
  salePercentage: number;
  availableStock: number;
  imageUrl: string;
  isNew: boolean; // 🏅 Matches form payload
  isOnSale: boolean; // 🔥 Matches form payload
  variants: ColorVariant[]; // 🎨 Unified variants array
  tags: string[]; // 🏷️ Array of tags
  description: string;
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 📡 Listen to the 'products' collection in real-time
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsArray = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          // 🛡️ Safe fallback: mapping data.slug, or doc.id if database document field is unpopulated
          slug: data.slug || doc.id, 
          name: data.name || '',
          category: data.category || '',
          brand: data.brand || '',
          price: Number(data.price) || 0,
          salePercentage: Number(data.salePercentage) || 0,
          availableStock: Number(data.availableStock) || 0,
          imageUrl: data.imageUrl || '',
          isNew: data.isNew || false,
          isOnSale: data.isOnSale || false,
          variants: Array.isArray(data.variants) ? data.variants : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          description: data.description || 'No description available.'
        };
      });
      setProducts(productsArray);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="text-center py-10 text-gray-500">Loading products...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">✨ Latest Arrivals</h2>
      
      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No products available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            // 🧩 Structure the exact object the ProductCard expects
            const cardCompatibleProduct = {
              id: product.id,
              slug: product.slug, // ✅ Safely passed down to ProductCard now!
              name: product.name,
              brand: product.brand,
              description: product.description,
              price: product.price,
              salePercentage: product.salePercentage, // 📉 Handled natively inside ProductCard now
              category: product.category,
              isNew: product.isNew,
              imageUrl: product.imageUrl,
              variants: product.variants, // 🎨 Passed directly down
              tags: product.tags // 🏷️ Passed directly down
            };

            return <ProductCard key={product.id} product={cardCompatibleProduct} />;
          })}
        </div>
      )}
    </div>
  );
}