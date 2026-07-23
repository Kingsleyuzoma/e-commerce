"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import ProductCard from './ProductCard';
import Pagination from './Pagination';

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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 20;

  // Real-time data fetch
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsArray: Product[] = snapshot.docs.map((doc) => {
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
          availableStock: Number(data.availableStock) || 0,
        };
      });
      setProducts(productsArray);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Categories
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  // Filtered products
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
      product.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

    return matchesCategory && matchesSearch;
  });

  // Pagination
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProductsPage = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-pink-600 font-medium">Loading beautiful products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-pink-50 via-purple-50 to-sky-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Filter & Search Bar */}
        <div className="mb-12 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <input
                type="text"
                placeholder="Search by name, brand, or description..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-pink-100 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 text-base transition-all"
              />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-400 text-xl">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-pink-500 hover:text-rose-600 text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-7 py-3.5 rounded-2xl font-medium whitespace-nowrap transition-all text-sm capitalize ${
                    selectedCategory === category
                      ? "bg-linear-to-r from-pink-500 via-purple-500 to-violet-500 text-white shadow-lg shadow-pink-300"
                      : "bg-white border border-pink-100 hover:bg-pink-50 hover:border-pink-200 text-gray-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {selectedCategory === 'All' 
              ? ' Latest Arrivals' 
              : ` ${selectedCategory} Collection`}
          </h1>
          <p className="text-gray-500 font-medium">
            Showing {indexOfFirstProduct + 1}–{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} items
          </p>
        </div>

        {/* Products Section */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-pink-200">
            <div className="text-7xl mb-6">🌸</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600 mb-8">Try adjusting your filters or search term</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                  availableStock: product.availableStock,
                };
                return <ProductCard key={product.id} product={cardCompatibleProduct} />;
              })}
            </div>

            {/* Pagination */}
            <div className="mt-16 flex justify-center">
              <Pagination
                totalItems={filteredProducts.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}