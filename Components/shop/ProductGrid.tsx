"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import ProductCard from './ProductCard'; // 🛒 Imported your custom card component

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  salePercentage: number;
  availableStock: number;
  imageUrl: string;
  isNewArrival: boolean;
  sizes?: string[];
  colors?: string[];
  description?: string; // Added to prevent TypeScript errors if missing
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 📡 Listen to the 'products' collection
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsArray = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          category: data.category || '',
          brand: data.brand || '',
          price: Number(data.price) || 0,
          salePercentage: Number(data.salePercentage) || 0,
          availableStock: Number(data.availableStock) || 0,
          imageUrl: data.imageUrl || '',
          isNewArrival: data.isNewArrival || false,
          sizes: data.sizes || [],
          colors: data.colors || [],
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            // 💵 Convert salePercentage into the exact salePrice format ProductCard wants
            const hasSale = product.salePercentage > 0;
            const calculatedSalePrice = hasSale 
              ? product.price * (1 - product.salePercentage / 100) 
              : undefined;

            // 🧩 Construct a card-compatible object matching the ProductCard interface
            const cardCompatibleProduct = {
              id: product.id,
              name: product.name,
              brand: product.brand,
              description: product.description || '',
              price: product.price,
              salePrice: calculatedSalePrice, // 👈 Mapped dynamically
              category: product.category,
              isNew: product.isNewArrival,    // 👈 Mapped dynamically
              imageUrl: product.imageUrl,
              availableStock: product.availableStock,
              colors: product.colors,
              sizes: product.sizes
            };

            // 🎨 Render your official card component with the cart context integrated
            return <ProductCard key={product.id} product={cardCompatibleProduct} />;
          })}
        </div>
      )}
    </div>
  );
}