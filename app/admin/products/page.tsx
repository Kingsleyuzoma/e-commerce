
"use client";

import { useState, useEffect } from "react";
import { db } from "@/config/firebase"; // 📁 Adjust this path to match your Firebase config file
import { collection, getDocs } from "firebase/firestore";

// 📋 Define the Product type for TypeScript
type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  imageUrl?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]); // 🛍️ Live products state
  const [isLoading, setIsLoading] = useState(true); // ⏳ Loading state for the fetch
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  // 📥 Fetch live products from Firestore when the component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const fetchedProducts: Product[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedProducts.push({
            id: doc.id,
            name: data.name || "",
            category: data.category || "",
            brand: data.brand || "",
            price: data.price || 0,
            imageUrl: data.imageUrl || "",
          });
        });

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate indices for slicing data
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const displayedProducts = products.slice(startIndex, endIndex);

  // Calculate total number of pages
  const totalPages = Math.ceil(products.length / productsPerPage);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">
          Loading live product catalog... ⏳
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 All Products ({products.length})</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50 text-gray-700 font-semibold">
              <th className="p-3">#</th>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Price</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No products found. Use the admin form to upload your first item! 🛍️
                </td>
              </tr>
            ) : (
              displayedProducts.map((product, index) => {
                const rowNumber = startIndex + index + 1;
                return (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 text-gray-600 items-center">
                    <td className="p-3 font-medium">{rowNumber}</td>
                    
                    <td className="p-3">
                      <div className="w-12 h-12 relative bg-gray-100 rounded overflow-hidden border border-gray-200">
                        <img 
                          src={product.imageUrl || "/placeholder-image.jpg"} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if the image URL fails to load
                            (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                          }}
                        />
                      </div>
                    </td>

                    <td className="p-3">{product.name}</td>
                    <td className="p-3">{product.category}</td>
                    <td className="p-3">{product.brand}</td>
                    <td className="p-3">${product.price.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                        <button className="text-red-600 hover:underline text-sm font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 🧭 Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-sm font-medium"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}