
"use client";

import { useState, useEffect } from "react";
import { db } from "@/config/firebase"; 
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

// 📐 Define variant interfaces to match the ProductCard structure
interface SizeVariant {
  size: string | number;
  stock: number;
}

interface ColorVariant {
  color: string;
  sizes: SizeVariant[];
}

// 🗂️ Updated Product type definition with all payload fields
type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  price: number;
  salePercentage: number;
  costPrice: number; // 🎯 SAVED: Explicitly tracking cost parameters
  tags: string[];
  isNew: boolean;
  isOnSale: boolean;
  imageUrl?: string;
  variants: ColorVariant[];
  availableStock: number; 
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); 
  const productsPerPage = 10;

  // 📥 Fetch live products from Firestore with all fields mapped
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
          description: data.description || "",
          price: Number(data.price) || 0,
          salePercentage: Number(data.salePercentage) || 0,
          costPrice: Number(data.costPrice) || 0, // 🎯 SAVED: Mapping cost metrics
          tags: Array.isArray(data.tags) ? data.tags : [],
          isNew: Boolean(data.isNew),
          isOnSale: Boolean(data.isOnSale),
          imageUrl: data.imageUrl || "",
          variants: Array.isArray(data.variants) ? data.variants : [],
          availableStock: Number(data.availableStock) || 0, 
        });
      });

      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 🗑️ Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((product) => product.id !== id));
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product: ", error);
      alert("Failed to delete product.");
    }
  };

  // 💾 Handle Update/Edit Save (Preserves all fields)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const productRef = doc(db, "products", editingProduct.id);
      await updateDoc(productRef, {
        name: editingProduct.name,
        category: editingProduct.category,
        brand: editingProduct.brand,
        description: editingProduct.description,
        price: Number(editingProduct.price),
        salePercentage: Number(editingProduct.salePercentage) || 0,
        costPrice: Number(editingProduct.costPrice) || 0, // 🎯 SAVED: Upating back down to Firestore docs
        tags: editingProduct.tags || [],
        isNew: Boolean(editingProduct.isNew),
        isOnSale: Boolean(editingProduct.isOnSale),
        variants: editingProduct.variants || [],
        availableStock: Number(editingProduct.availableStock),
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
      );
      
      alert("Product updated successfully!");
      setEditingProduct(null); 
    } catch (error) {
      console.error("Error updating product: ", error);
      alert("Failed to update product.");
    }
  };

  // 🔄 Helper function to update stock for a specific color and size variant inside the state handler
  const handleVariantStockChange = (colorIdx: number, sizeIdx: number, newStock: number) => {
    if (!editingProduct) return;

    const updatedVariants = [...editingProduct.variants];
    updatedVariants[colorIdx].sizes[sizeIdx].stock = newStock;

    // Recalculate total available stock automatically based on the sum of variants
    const totalStock = updatedVariants.reduce((total, v) => {
      return total + v.sizes.reduce((sSum, s) => sSum + s.stock, 0);
    }, 0);

    setEditingProduct({
      ...editingProduct,
      variants: updatedVariants,
      availableStock: totalStock // Kept synchronized!
    });
  };

  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const displayedProducts = products.slice(startIndex, endIndex);
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
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 All Products ({products.length})</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-300">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
              <th className="p-3">#</th>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Description</th>
              <th className="p-3">Category / Brand</th>
              
              {/* 🎯 HEADERS: Added financial layout metrics */}
              <th className="p-3">Cost Price</th>
              <th className="p-3">Retail Price</th>
              <th className="p-3">Est. Profit</th>
              
              <th className="p-3">Stock</th> 
              <th className="p-3">Variants</th>
              <th className="p-3">Badges</th>
              <th className="p-3">Tags</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedProducts.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-8 text-center text-gray-400">
                  No products found.
                </td>
              </tr>
            ) : (
              displayedProducts.map((product, index) => {
                const rowNumber = startIndex + index + 1;
                
                // 🧮 Calculate pricing and profit parameters
                const retailPrice = product.isOnSale && product.salePercentage > 0 
                  ? product.price * (1 - product.salePercentage / 100) 
                  : product.price;
                const cost = product.costPrice || 0;
                const profit = retailPrice - cost;
                const marginPercentage = retailPrice > 0 ? ((profit / retailPrice) * 100).toFixed(0) : "0";

                return (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 text-gray-600 text-sm">
                    <td className="p-3 font-medium text-gray-900">{rowNumber}</td>
                    <td className="p-3">
                      <div className="w-12 h-12 relative bg-gray-100 rounded overflow-hidden border border-gray-200">
                        <img 
                          src={product.imageUrl || "/placeholder-image.jpg"} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-gray-800">{product.name}</td>
                    <td className="p-3 max-w-xs truncate" title={product.description}>
                      {product.description || <span className="text-gray-300 italic">No description</span>}
                    </td>
                    <td className="p-3">
                      <div className="text-gray-900 font-medium">{product.category}</div>
                      <div className="text-xs text-gray-400">{product.brand}</div>
                    </td>
                    
                    {/* 💰 CELLS: Rendered new finance values columns */}
                    <td className="p-3 font-medium text-gray-600">
                      ${cost.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">${retailPrice.toFixed(2)}</div>
                      {product.isOnSale && product.salePercentage > 0 && (
                        <div className="text-[10px] text-green-600 font-bold uppercase">-{product.salePercentage}% Sale</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className={`font-bold ${profit >= 0 ? "text-gray-900" : "text-red-600"}`}>
                        ${profit.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">{marginPercentage}% Margin</div>
                    </td>

                    <td className="p-3 font-semibold text-gray-900">{product.availableStock}</td> 
                    
                    {/* 🎨 Variants Column */}
                    <td className="p-3">
                      {product.variants && product.variants.length > 0 ? (
                        <div className="flex flex-col gap-1 max-h-20 overflow-y-auto pr-1">
                          {product.variants.map((v, vIdx) => (
                            <div key={vIdx} className="text-xs">
                              <span className="font-medium text-gray-800">{v.color}: </span>
                              <span className="text-gray-500">
                                {v.sizes?.map((s) => `${s.size}(${s.stock})`).join(", ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">None</span>
                      )}
                    </td>

                    {/* 🏷️ Status Badges Column */}
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        {product.isNew && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-700">
                            New Arrival
                          </span>
                        )}
                        {product.isOnSale && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-green-100 text-green-700">
                            On Sale
                          </span>
                        )}
                        {!product.isNew && !product.isOnSale && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* 🏷️ Tags Column */}
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-37.5">
                        {product.tags && product.tags.length > 0 ? (
                          product.tags.map((tag, tagIdx) => (
                            <span key={tagIdx} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]">
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">None</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:underline text-sm font-medium"
                        >
                          Delete
                        </button>
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

      {/* ✍️ Quick Edit Modal/Form Pop-up */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800">✏️ Edit Product</h2>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingProduct.brand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Slug</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  />
                </div>
              </div>

              {/* MODAL PRICING UPDATES: Added input item for Cost Pricing configuration adjustments */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                    value={editingProduct.costPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Stock (Calculated)</label>
                <input
                  type="number"
                  disabled
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100 font-semibold text-gray-600 cursor-not-allowed"
                  value={editingProduct.availableStock}
                />
              </div>

              {/* 🎨 Dynamic Variants Editor Section */}
              <div className="border border-gray-200 rounded p-3 bg-gray-50/50 space-y-2">
                <label className="block text-sm font-semibold text-gray-800">🎨 Manage Color & Size Stocks</label>
                {editingProduct.variants && editingProduct.variants.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {editingProduct.variants.map((v, colorIdx) => (
                      <div key={colorIdx} className="bg-white p-2 rounded border border-gray-200 space-y-1.5 shadow-sm">
                        <div className="text-xs font-bold text-gray-700 uppercase">Color: {v.color}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {v.sizes?.map((s, sizeIdx) => (
                            <div key={sizeIdx} className="flex items-center gap-2 justify-between bg-gray-50 p-1.5 rounded text-xs">
                              <span className="font-medium text-gray-600">Size {s.size}:</span>
                              <input
                                type="number"
                                min="0"
                                className="w-16 p-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                                value={s.stock}
                                onChange={(e) => handleVariantStockChange(colorIdx, sizeIdx, Number(e.target.value))}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs italic text-gray-400 bg-white p-2 text-center rounded border border-dashed">
                    No active variants attached to this item.
                  </div>
                )}
              </div>

              {/* 🔄 Interactive Badges Fields */}
              <div className="flex gap-4 p-2 bg-gray-50 rounded border border-gray-200">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    checked={editingProduct.isNew}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isNew: e.target.checked })}
                  />
                  New Arrival
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    checked={editingProduct.isOnSale}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isOnSale: e.target.checked })}
                  />
                  On Sale
                </label>
              </div>

              {editingProduct.isOnSale && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingProduct.salePercentage || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, salePercentage: Number(e.target.value) })}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-gray-200 rounded text-gray-700 font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}