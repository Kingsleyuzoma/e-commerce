
"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/config/firebase'; 
import { collection, addDoc, onSnapshot, query, doc, deleteDoc } from 'firebase/firestore';

export default function CategoryManager() {
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  // 📡 Listen to categories collection in real-time
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

  // 🚀 Save a new category to Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'Product Categories'), {
        name: categoryName.trim(),
        slug: categoryName.trim().toLowerCase().replace(/\s+/g, '-')
      });
      setCategoryName(''); 
    } catch (error) {
      console.error("Error adding category: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ Delete a category from Firestore
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    
    try {
      await deleteDoc(doc(db, 'Product Categories', id));
    } catch (error) {
      console.error("Error deleting category: ", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-6">
      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Add New Category 🏷️</label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Skincare, New Arrivals"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-blue-300 transition-colors"
            >
              {isLoading ? 'Saving...' : 'Add'}
            </button>
          </div>
        </div>
      </form>

      {/* Categories Grid List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Existing Categories 🗂️</h3>
        {categories.length === 0 ? (
          <p className="text-xs text-gray-400">No categories added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span 
                key={cat.id} 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
              >
                {cat.name}
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors focus:outline-none"
                  title="Delete Category"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}