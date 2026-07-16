"use client";
import { db } from "@/config/firebase"; 
import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { uploadProductImage } from "@/config/firebaseAction";

interface SizeVariant {
  size: string | number;
  stock: number;
}

interface ColorVariant {
  color: string;
  sizes: SizeVariant[];
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

// Interface for Sub Image slots
interface SubImageSlot {
  file: File | null;
  preview: string | null;
  progress: number | null;
}

export default function AdminProductForm() {
  // 🗃️ Core Form State
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState(""); 
  const [description, setDescription] = useState(""); 
  const [price, setPrice] = useState("");
  const [salePercentage, setSalePercentage] = useState("");
  const [tags, setTags] = useState(""); 
  const [isNew, setIsNew] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false);
  
  // 🎨 Variants State
  const [variants, setVariants] = useState<ColorVariant[]>([]);
  const [colorName, setColorName] = useState("");
  const [sizeName, setSizeName] = useState("");
  const [stockQty, setStockQty] = useState("");
  
  // 📦 Non-variant Base Stock State
  const [baseStock, setBaseStock] = useState(""); 

  // 🔒 Submission Loading Lock State
  const [isPublishing, setIsPublishing] = useState(false);

  // 📁 Dynamic Categories
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 🖼️ Main Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null); 
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // 📸 Sub-Images State (Supports up to 5 additional perspective angles)
  const [subImages, setSubImages] = useState<SubImageSlot[]>([
    { file: null, preview: null, progress: null },
    { file: null, preview: null, progress: null },
    { file: null, preview: null, progress: null },
    { file: null, preview: null, progress: null },
    { file: null, preview: null, progress: null },
  ]);

  let uploadInterval: NodeJS.Timeout;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        const fetchedCats: CategoryItem[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedCats.push({
            id: doc.id,
            name: data.name || "",
            slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, "-") || "",
          });
        });
        
        setCategories(fetchedCats);
      } catch (error) {
        console.error("Error fetching categories for dropdown: ", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearInterval(uploadInterval);
    setUploadProgress(0);
    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    let currentProgress = 0;
    uploadInterval = setInterval(() => {
      currentProgress += 20;
      if (currentProgress >= 100) {
        setUploadProgress(100);
        clearInterval(uploadInterval);
        setTimeout(() => {
          setUploadProgress(null);
        }, 1000);
      } else {
        setUploadProgress(currentProgress);
      }
    }, 150);
  };

  // Handles updating a specific sub-image upload slot
  const handleSubImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    // Update state for selected slot
    setSubImages((prev) => {
      const updated = [...prev];
      updated[index] = {
        file,
        preview: previewUrl,
        progress: 0,
      };
      return updated;
    });

    // Simulate upload progress bar animation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setSubImages((prev) => {
        const updated = [...prev];
        if (progress >= 100) {
          updated[index].progress = null;
          clearInterval(interval);
        } else {
          updated[index].progress = progress;
        }
        return updated;
      });
    }, 150);
  };

  // Clear a selected sub image slot
  const removeSubImage = (index: number) => {
    setSubImages((prev) => {
      const updated = [...prev];
      updated[index] = { file: null, preview: null, progress: null };
      return updated;
    });
  };

  const [tempSizes, setTempSizes] = useState<SizeVariant[]>([]);
  const handleAddSize = () => {
    if (!sizeName || !stockQty) return alert("Enter size and stock!");
    
    setTempSizes([...tempSizes, {
      size: isNaN(Number(sizeName)) ? sizeName : Number(sizeName),
      stock: parseInt(stockQty, 10)
    }]);
    setSizeName("");
    setStockQty("");
  };

  const handleSaveColorGroup = () => {
    if (!colorName || tempSizes.length === 0) return alert("Add a color and at least one size!");
    
    setVariants([...variants, { color: colorName, sizes: tempSizes }]);
    setColorName("");
    setTempSizes([]);
  };

  // 🚀 Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double clicks if already processing
    if (isPublishing) return;

    if (!name || !price || !description || !category) {
      alert("Please fill out the required core fields (Name, Category, Price, and Description).");
      return;
    }

    if (!imageFile) {
      alert("Please select and upload a product image before publishing.");
      return;
    }

    let totalStock = 0;
    if (variants.length > 0) {
      totalStock = variants.reduce(
        (total, v) => total + v.sizes.reduce((sum, s) => sum + s.stock, 0),
        0
      );
    } else {
      if (!baseStock || parseInt(baseStock, 10) < 0) {
        alert("Please either add color variants or specify the 'Base Stock Quantity' below.");
        return;
      }
      totalStock = parseInt(baseStock, 10);
    }

    try {
      setIsPublishing(true); // 🔒 Lock form submission immediately

      // 1. Upload Main Cover Image
      const permanentImageUrl = await uploadProductImage(imageFile, () => {});

      // 2. Upload Selected Sub Images (Only upload slots that have files)
      const uploadedSubImageUrls: string[] = [];
      for (const slot of subImages) {
        if (slot.file) {
          try {
            const url = await uploadProductImage(slot.file, () => {});
            if (url) {
              uploadedSubImageUrls.push(url);
            }
          } catch (uploadErr) {
            console.error("Error uploading one of the sub-images:", uploadErr);
          }
        }
      }

      // 3. Assemble Payload
      const finalPayload = {
        name,
        brand,
        category, 
        description, 
        price: parseFloat(price),
        salePercentage: isOnSale ? parseInt(salePercentage, 10) || 0 : 0,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        isNew,
        isOnSale,
        imageUrl: permanentImageUrl,
        subImages: uploadedSubImageUrls, // Array containing sub-image urls saved to Firestore
        variants: variants || [], 
        availableStock: totalStock,
        createdAt: new Date(), 
      };

      const docRef = await addDoc(collection(db, "products"), finalPayload);
      console.log("Document written with ID: ", docRef.id);
      
      alert("🎉 Product successfully published to Firestore!");

      // 🧹 Reset Form
      setName("");
      setBrand("");
      setCategory("");
      setDescription("");
      setPrice("");
      setSalePercentage("");
      setTags("");
      setIsNew(false);
      setIsOnSale(false);
      setVariants([]);
      setBaseStock("");
      setImageFile(null);
      setImagePreview(null);
      setSubImages([
        { file: null, preview: null, progress: null },
        { file: null, preview: null, progress: null },
        { file: null, preview: null, progress: null },
        { file: null, preview: null, progress: null },
        { file: null, preview: null, progress: null },
      ]);

    } catch (error) {
      console.error("Error adding document to Firestore: ", error);
      alert("❌ Failed to save product. Check console for details.");
    } finally {
      setIsPublishing(false); // 🔓 Release lock
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg space-y-6 text-gray-800 text-sm">
      <h2 className="text-xl font-bold border-b pb-2 text-gray-900">📦 Simplified Product Creator</h2>

      {/* 🖼️ Main Image Upload Field */}
      <div className="space-y-2 border-2 border-dashed p-4 rounded-md bg-gray-50 text-center">
        <label className="block font-medium cursor-pointer text-blue-600 hover:underline">
          📷 Click to Upload Main Cover Image
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={isPublishing} />
        </label>
        
        {uploadProgress !== null && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 overflow-hidden">
            <div className="bg-blue-600 h-2.5 transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
            <p className="text-[10px] text-gray-500 mt-1">{uploadProgress}% uploaded</p>
          </div>
        )}

        {imagePreview && (
          <div className="mt-4">
            <img src={imagePreview} alt="Product Preview" className="w-32 h-32 mx-auto mt-2 object-cover rounded shadow" />
          </div>
        )}
      </div>

      {/* 📸 Sub Images Section (4-6 Alternative angles) */}
      <div className="p-4 border rounded-md bg-slate-50 space-y-3">
        <div>
          <h3 className="font-bold text-gray-900">🖼️ Additional Angle Images (Up to 5)</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">These display as sub-thumbnails beneath the main cover photo on the details page.</p>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {subImages.map((slot, index) => (
            <div key={index} className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-white p-1.5 h-24 relative overflow-hidden">
              {slot.preview ? (
                <div className="w-full h-full relative group">
                  <img src={slot.preview} alt={`Sub image ${index + 1}`} className="w-full h-full object-cover rounded" />
                  <button 
                    type="button" 
                    disabled={isPublishing}
                    onClick={() => removeSubImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold hover:bg-red-600 shadow cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-blue-500 text-center select-none">
                  <span className="text-xl">+</span>
                  <span className="text-[9px] font-semibold">Angle {index + 1}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    disabled={isPublishing}
                    onChange={(e) => handleSubImageChange(index, e)} 
                    className="hidden" 
                  />
                </label>
              )}

              {slot.progress !== null && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 transition-all" style={{ width: `${slot.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 🏷️ Core Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Product Name</label>
          <input type="text" required disabled={isPublishing} value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded mt-1 text-gray-900" />
        </div>
        <div>
          <label className="block font-medium">Brand Name</label>
          <input type="text" disabled={isPublishing} value={brand} onChange={e => setBrand(e.target.value)} className="w-full p-2 border rounded mt-1 text-gray-900" />
        </div>
        
        <div>
          <label className="block font-medium">Category</label>
          {loadingCategories ? (
            <div className="w-full p-2 text-xs border rounded bg-gray-50 text-gray-400 mt-1 animate-pulse">
              Loading categories... ⏳
            </div>
          ) : (
            <select
              required
              disabled={isPublishing}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded mt-1 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block font-medium">Tags (separated by commas)</label>
          <input type="text" disabled={isPublishing} placeholder="unisex, summer, vintage" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-2 border rounded mt-1 text-gray-900" />
        </div>
        <div className="col-span-2">
          <label className="block font-medium">Product Description</label>
          <textarea required disabled={isPublishing} rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded mt-1 text-gray-900" placeholder="Describe the product features, material, fit..." />
        </div>
      </div>

      {/* 💰 Price & Sales */}
      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <label className="block font-medium">Price ($)</label>
          <input type="number" required disabled={isPublishing} value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded mt-1 text-gray-900" />
        </div>
        {isOnSale && (
          <div>
            <label className="block font-medium">Discount Percentage (%)</label>
            <input type="number" disabled={isPublishing} value={salePercentage} onChange={e => setSalePercentage(e.target.value)} className="w-full p-2 border rounded mt-1 text-gray-900" />
          </div>
        )}
      </div>

      {/* 🛡️ Status Badges */}
      <div className="flex gap-6 border-y py-3 bg-gray-50 px-4 rounded">
        <label className="flex items-center gap-2 font-medium cursor-pointer">
          <input type="checkbox" disabled={isPublishing} checked={isNew} onChange={e => setIsNew(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
          🏷️ Mark as "New Arrival"
        </label>
        <label className="flex items-center gap-2 font-medium cursor-pointer">
          <input type="checkbox" disabled={isPublishing} checked={isOnSale} onChange={e => setIsOnSale(e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
          🔥 Mark as "On Sale"
        </label>
      </div>

      {/* 📦 Base Stock Input */}
      {variants.length === 0 && (
        <div className="p-4 border rounded bg-slate-50 space-y-2">
          <label className="block font-bold text-gray-900">Base Stock Quantity</label>
          <p className="text-xs text-gray-500">Since no color/size groups are configured, enter the total available stock for this item.</p>
          <input 
            type="number" 
            disabled={isPublishing}
            placeholder="e.g. 50" 
            value={baseStock} 
            onChange={e => setBaseStock(e.target.value)} 
            className="w-full p-2 border rounded text-gray-900 bg-white" 
          />
        </div>
      )}

      {/* 🛠️ Simplified Variant Builder */}
      <div className="p-4 border rounded bg-slate-50 space-y-4">
        <h3 className="font-bold text-gray-900">🎨 Step 1: Define Color Group</h3>
        <input type="text" disabled={isPublishing} placeholder="Color Name (e.g., Matte Black)" value={colorName} onChange={e => setColorName(e.target.value)} className="w-full p-2 border rounded text-gray-900 bg-white" />

        <div className="border-l-4 border-blue-500 pl-3 space-y-2 bg-white p-3 rounded-r shadow-sm">
          <span className="text-xs font-bold text-blue-700 block uppercase">Step 2: Add Sizes to {colorName || "this color"}</span>
          <div className="flex gap-2">
            <input type="text" disabled={isPublishing} placeholder="Size (e.g., M or 10)" value={sizeName} onChange={e => setSizeName(e.target.value)} className="w-full p-2 border rounded text-gray-900" />
            <input type="number" disabled={isPublishing} placeholder="Stock Qty" value={stockQty} onChange={e => setStockQty(e.target.value)} className="w-full p-2 border rounded text-gray-900" />
            <button type="button" disabled={isPublishing} onClick={handleAddSize} className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-700">Add</button>
          </div>
          
          {tempSizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tempSizes.map((s, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded font-medium">
                  Size {s.size} ({s.stock} left)
                </span>
              ))}
            </div>
          )}
        </div>

        <button type="button" disabled={isPublishing} onClick={handleSaveColorGroup} className="w-full bg-emerald-600 text-white py-2 rounded font-bold hover:bg-emerald-700">
          Save Color Group
        </button>

        {/* Saved Summary list */}
        {variants.length > 0 && (
          <div className="mt-2 space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Currently Configured Variants:</span>
            {variants.map((v, i) => (
              <div key={i} className="p-2 bg-white rounded border flex justify-between items-center text-xs shadow-sm">
                <span><strong>{v.color}:</strong> {v.sizes.map(s => `${s.size} (${s.stock} pcs)`).join(", ")}</span>
                <button type="button" disabled={isPublishing} onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-red-500 hover:underline">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🚀 Submit Button */}
      <button 
        type="submit" 
        disabled={isPublishing}
        className={`w-full bg-gray-900 text-white py-3 rounded-md font-bold transition-all shadow select-none ${
          isPublishing ? "opacity-50 cursor-not-allowed bg-gray-600" : "hover:bg-gray-800 cursor-pointer"
        }`}
      >
        {isPublishing ? "Publishing Product... ⏳" : "Publish Entire Product"}
      </button>
    </form>
  );
}