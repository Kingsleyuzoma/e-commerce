"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import ProductCard from './ProductCard'; 
import Pagination from './Pagination'; // 💡 Imported Pagination

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

  // 🔍 Filter, Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // 🎯 Strictly 20 items per page

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

  // 🗂️ Extract unique categories dynamically
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // ⚙️ Reset current page to 1 when filters or search change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  // ⚙️ Live Filter Logic
  const filteredProducts = products.filter((product) => {
    const matchesCategory = 
      selectedCategory === 'All' || 
      product.category.toLowerCase() === selectedCategory.toLowerCase();

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

  // 🧮 CALCULATE PAGINATION SLICES FOR ACTIVE ITEMS
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProductsPage = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          {searchQuery && (
            <button 
              onClick={() => handleSearchChange('')}
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
              onClick={() => handleCategoryChange(category)}
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

      {/* Header Info */}
      <div className="mb-6 flex justify-between items-end">
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedCategory === 'All' ? '✨ Latest Arrivals' : `📂 ${selectedCategory} Items`}
        </h2>
        <span className="text-xs text-gray-400 font-medium">
          Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} items
        </span>
      </div>
      
      {/* 📦 PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="text-gray-500 font-medium mb-1">No products matched your layout.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {currentProductsPage.map((product) => {
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

          {/* 🎯 PAGINATION COMPONENT */}
          <Pagination
            totalItems={filteredProducts.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' }); // Scrolls smoothly back up for the user
            }}
          />
        </>
      )}
    </div>
  );
}