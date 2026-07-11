
"use client";

import { useState, useEffect } from "react";
import { addProduct } from "@/config/firebaseAction";
import { db } from "@/config/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    category: "", 
    brand: "",
    price: "",
    salePercentage: "",
    availableStock: "", 
    imageFile: null as File | null,
    tags: "",
    colors: "", // 🎨 Tracks optional color inputs
    sizes: "",  // 📏 Tracks optional size inputs
    isNewArrival: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0); 

  useEffect(() => {
    const q = query(collection(db, 'Product Categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesArray = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        slug: doc.data().slug
      }));
      setCategories(categoriesArray);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageFile) {
      alert("Please select an image file first");
      return;
    }

    setIsLoading(true);
    setUploadProgress(0); 

    // 🧹 Convert comma-separated strings into arrays, or empty arrays if blank
    const processedColors = formData.colors.trim() 
      ? formData.colors.split(",").map((c) => c.trim()) 
      : [];

    const processedSizes = formData.sizes.trim() 
      ? formData.sizes.split(",").map((s) => s.trim()) 
      : [];

    const productData = {
      ...formData,
      price: Number(formData.price) || 0,
      salePercentage: Number(formData.salePercentage) || 0,
      availableStock: Number(formData.availableStock) || 0,
      tags: formData.tags.trim() ? formData.tags.split(",").map((t) => t.trim()) : [],
      colors: processedColors,
      sizes: processedSizes,
    };

    const result = await addProduct(productData, formData.imageFile, (progress) => {
      setUploadProgress(progress);
    });

    setIsLoading(false);

    if (result.success) {
      alert("Product added successfully!");
      setFormData({
        name: "",
        category: "",
        brand: "",
        price: "",
        salePercentage: "",
        availableStock: "", 
        imageFile: null,
        tags: "",
        colors: "", // 🧹 Clears field on success
        sizes: "",  // 🧹 Clears field on success
        isNewArrival: false,
  });
    } else {
      alert("Failed to add product. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">➕ Add New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 📝 Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:outline-none"
            placeholder="e.g., Luxury Human Hair Wig"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* 🗂️ Category & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input
              type="text"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:outline-none"
              placeholder="e.g., Femel Collection"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>
        </div>

        {/* 💰 Price, 📉 Sale Percentage, & 📦 Available Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:outline-none"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:outline-none"
              placeholder="0 (Optional)"
              value={formData.salePercentage}
              onChange={(e) => setFormData({ ...formData, salePercentage: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              min="0"
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:outline-none"
              placeholder="0"
              value={formData.availableStock}
              onChange={(e) => setFormData({ ...formData, availableStock: e.target.value })}
            />
          </div>
        </div>

        {/* 🖼️ Local Image File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Product Image</label>
          <input
            type="file"
            accept="image/*"
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
            onChange={(e) => setFormData({ 
              ...formData, 
              imageFile: e.target.files ? e.target.files[0] : null 
            })}
          />
        </div>

        {/* 🏷️ Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:outline-none"
            placeholder="e.g., new-arrival, silky, waterproof"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>

        {/* 🎨 Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Colors (comma separated, optional)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:outline-none"
            placeholder="e.g., Black, Honey Blonde, Burgundy"
            value={formData.colors}
            onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
          />
        </div>

        {/* 📏 Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma separated, optional)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:outline-none"
            placeholder="e.g., 12 inch, 14 inch, Short, Medium"
            value={formData.sizes}
            onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
          />
        </div>

        {/* 🔲 New Arrival Badge Checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isNewArrival"
            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
            checked={formData.isNewArrival}
            onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
          />
          <label htmlFor="isNewArrival" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
            Mark as New Arrival (Displays Badge) ⭐
          </label>
        </div>

        {/* 📊 Real-time Percentage Indicator */}
        {isLoading && (
          <div className="text-center text-sm font-semibold text-pink-600 animate-pulse mt-2">
            Uploading Image: {uploadProgress}%
          </div>
        )}

        {/* 🔘 Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-pink-600 text-white p-3 rounded font-bold hover:bg-pink-700 transition-colors shadow-sm mt-4 disabled:bg-pink-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Uploading..." : "Publish Product"}
        </button>
      </form>
    </div>
  );
}