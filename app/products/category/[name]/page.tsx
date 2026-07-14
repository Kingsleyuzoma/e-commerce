"use client";

import { useEffect, useState, use } from "react";
import { db } from "@/config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import ProductCard from "@/Components/shop/ProductCard"; 
import Pagination from "@/Components/shop/Pagination"; // 💡 Imported Pagination
import Link from "next/link";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default function CategoryPage(props: PageProps) {
  const params = use(props.params);
  const categoryName = params?.name;

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔍 Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // 🎯 20 items per page

  useEffect(() => {
    if (!categoryName) return;

    const fetchCategoryProducts = async () => {
      try {
        const q = query(
          collection(db, "products"), 
          where("category", "==", categoryName.toLowerCase())
        );
        const querySnapshot = await getDocs(q);
        
        const loadedProducts = querySnapshot.docs.map(doc => {
          const data = doc.data() as any;
          
          const firestoreStock = 
            data.availableStock !== undefined ? data.availableStock :
            data.stock !== undefined ? data.stock :
            data.quantity !== undefined ? data.quantity : 0;

          return {
            id: doc.id,
            slug: data.slug || doc.id, 
            name: data.name || "",
            brand: data.brand || "",
            description: data.description || "",
            price: Number(data.price) || 0,
            salePercentage: Number(data.salePercentage) || 0,
            category: data.category || "",
            isNew: Boolean(data.isNew),
            imageUrl: data.imageUrl || "",
            variants: data.variants || [],
            tags: data.tags || [],
            availableStock: Number(firestoreStock)
          };
        });

        setProducts(loadedProducts);
        setCurrentPage(1); // Reset page on category change
      } catch (error) {
        console.error("Error fetching category products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categoryName]);

  // 🧮 Slice products for the active page
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentCategoryProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium text-sm">Loading {categoryName?.replace(/-/g, " ")}... 🛒</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-gray-800">
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center space-x-2 text-xs text-gray-400 font-medium">
        <Link href="/" className="hover:text-pink-600 transition-colors">Home</Link>
        <span>/</span>
        <span className="capitalize text-gray-600">{categoryName?.replace(/-/g, " ")}</span>
      </div>

      <div className="flex justify-between items-end mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 capitalize tracking-tight">
          {categoryName?.replace(/-/g, " ")} Collection
        </h1>
        {products.length > 0 && (
          <span className="text-xs text-gray-400 font-medium">
            Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, products.length)} of {products.length} items
          </span>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed">
          <p className="text-gray-500 font-medium">No items found inside this category layout section yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentCategoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* 🎯 PAGINATION COMPONENT */}
          <Pagination
            totalItems={products.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth scroll back up
            }}
          />
        </>
      )}
    </div>
  );
}