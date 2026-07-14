"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import ProductCard from './ProductCard'; 

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
  slug: string; 
  name: string;
  category: string;
  brand: string;
  price: number;
  salePercentage: number;
  availableStock: number;
  imageUrl: string;
  isNew: boolean; 
  isOnSale: boolean; 
  variants: ColorVariant[]; 
  tags: string[]; 
  description: string;
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔍 Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // 📡 Listen to the 'products' collection in real-time
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsArray = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          slug: data.slug || doc.id, 
          name: data.name || '',
          category: data.category || '',
          brand: data.brand || '',
          price: Number(data.price) || 0,
          salePercentage: Number(data.salePercentage) || 0,
          imageUrl: data.imageUrl || '',
          isNew: data.isNew || false,
          isOnSale: data.isOnSale || false,
          variants: Array.isArray(data.variants) ? data.variants : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          description: data.description || 'No description available.',
          availableStock: Number(data.availableStock) || 0
        };
      });
      setProducts(productsArray);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🗂️ Extract unique categories dynamically from database products for the filter UI
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // ⚙️ Live Filter Logic (Calculated on every render dynamically)
  const filteredProducts = products.filter((product) => {
    // 1. Category Matching
    const matchesCategory = 
      selectedCategory === 'All' || 
      product.category.toLowerCase() === selectedCategory.toLowerCase();

    // 2. Search Query Matching (Name, Description, Brand, or Tags/Keywords)
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      normalizedQuery === '' ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.brand.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));

    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return <div className="text-center py-10 text-gray-500">Loading products...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* 🛠️ FILTER & SEARCH CONTROL BAR */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between pb-6 border-b border-gray-100">
        
        {/* Search Bar Input */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search products by name, tag, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
          />
          {/* Search Icon */}
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          {/* Clear Button */}
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dynamic Category Pill Filters */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`text-xs px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all capitalize cursor-pointer ${
                selectedCategory === category
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Title indicating what is being looked at */}
      <div className="mb-6 flex justify-between items-end">
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedCategory === 'All' ? '✨ Latest Arrivals' : `📂 ${selectedCategory} Items`}
        </h2>
        {searchQuery && (
          <span className="text-xs text-gray-400 font-medium">
            Found {filteredProducts.length} results for "{searchQuery}"
          </span>
        )}
      </div>
      
      {/* 📦 PRODUCTS GRID OR EMPTY STATE */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="text-gray-500 font-medium mb-1">We couldn't find any items matching your search criteria.</p>
          <p className="text-xs text-gray-400">Try adjusting your spelling or filters!</p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-4 text-xs font-semibold text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const cardCompatibleProduct = {
              id: product.id,
              slug: product.slug, 
              name: product.name,
              brand: product.brand,
              description: product.description,
              price: product.price,
              salePercentage: product.salePercentage, 
              category: product.category,
              isNew: product.isNew,
              imageUrl: product.imageUrl,
              variants: product.variants, 
              tags: product.tags,
              availableStock: product.availableStock
            };

            return <ProductCard key={product.id} product={cardCompatibleProduct} />;
          })}
        </div>
      )}
    </div>
  );
}