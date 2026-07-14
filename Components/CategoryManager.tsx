
"use client";

import { useState, useEffect } from "react";
import { db } from "@/config/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 📥 Fetch live categories from the database
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      const list: Category[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          name: data.name || "",
          slug: data.slug || "",
        });
      });
      // Sort alphabetically for clean UI experience
      setCategories(list.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 🚀 Add Category handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    // Generate a clean slug (e.g., "Men's Hoodies" -> "mens-hoodies")
    const slug = newCategoryName
      .trim()
      .toLowerCase()
      .replace(/['’]/g, "") // remove apostrophes
      .replace(/[^a-z0-9]+/g, "-") // replace symbols/spaces with hyphens
      .replace(/(^-|-$)/g, ""); // trim hyphens from ends

    // Prevent duplicate local names or slugs
    if (categories.some((c) => c.slug === slug || c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      alert("This category already exists!");
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "categories"), {
        name: newCategoryName.trim(),
        slug: slug,
        createdAt: new Date(),
      });

      // Instantly update local UI state
      setCategories((prev) =>
        [...prev, { id: docRef.id, name: newCategoryName.trim(), slug }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setNewCategoryName("");
      alert("🎉 Category added successfully!");
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🗑️ Delete Category handler
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${name}"?`)) return;

    try {
      await deleteDoc(doc(db, "categories", id));
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      alert("Category deleted successfully!");
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg space-y-6 text-gray-800 text-sm">
      <h2 className="text-xl font-bold border-b pb-2 text-gray-900">📁 Category Manager</h2>

      {/* ➕ Add New Category Form */}
      <form onSubmit={handleAddCategory} className="space-y-2">
        <label className="block font-medium text-gray-700">New Category Name</label>
        <div className="flex gap-2">
          <input
            type="text"
            required
            placeholder="e.g., Running Shoes, Winter Hoodies"
            className="w-full p-2 border rounded text-gray-900"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      {/* 📋 List View of Created Categories */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 border-t pt-4">Current Active Categories</h3>
        
        {isLoading ? (
          <div className="text-xs text-gray-400 animate-pulse py-2">Loading catalog categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-xs italic text-gray-400 bg-gray-50 p-4 text-center rounded border border-dashed">
            No categories created yet. Add one above!
          </div>
        ) : (
          <div className="border rounded divide-y max-h-60 overflow-y-auto bg-gray-50/50">
            {categories.map((cat) => (
              <div key={cat.id} className="flex justify-between items-center p-2.5 bg-white shadow-sm hover:bg-gray-50 text-xs">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800">{cat.name}</span>
                  <span className="text-[10px] text-gray-400">Slug: {cat.slug}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="text-red-500 hover:text-red-700 font-semibold hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}