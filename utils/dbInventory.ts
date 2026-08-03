// utils/dbInventory.ts
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

export interface LowStockProduct {
  id: string;
  name: string;
  imageUrl?: string;
  stock: number;
  category?: string;
}

/**
 * Calculates total stock matching the exact structure from ProductCard.tsx
 */
function calculateProductStock(data: any): number {
  // 1. If product has color/size variants, calculate the sum of all size stocks
  if (Array.isArray(data.variants) && data.variants.length > 0) {
    return data.variants.reduce((totalAcc: number, variant: any) => {
      if (Array.isArray(variant.sizes)) {
        const variantTotal = variant.sizes.reduce((sum: number, sizeObj: any) => {
          const num = Number(sizeObj.stock ?? sizeObj.quantity ?? 0);
          return sum + (isNaN(num) ? 0 : num);
        }, 0);
        return totalAcc + variantTotal;
      }
      return totalAcc;
    }, 0);
  }

  // 2. Fallback to `availableStock` (used in ProductCard) or root `stock` / `quantity`
  const rawStock = data.availableStock ?? data.stock ?? data.quantity ?? 0;
  const parsed = parseInt(String(rawStock).trim(), 10);
  
  return isNaN(parsed) ? 0 : parsed;
}

export const getLowStockProducts = async (threshold: number = 5): Promise<LowStockProduct[]> => {
  try {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);

    const lowStockItems: LowStockProduct[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const totalStock = calculateProductStock(data);

      // Trigger low stock warning if total stock is <= threshold (e.g., 5)
      if (totalStock <= threshold) {
        lowStockItems.push({
          id: doc.id,
          name: data.name || data.title || "Unnamed Product",
          imageUrl: data.imageUrl || data.image,
          stock: totalStock,
          category: data.category || "Uncategorized",
        });
      }
    });

    // Sort by lowest stock first (out of stock on top)
    return lowStockItems.sort((a, b) => a.stock - b.stock);
  } catch (error) {
    console.error("Failed to fetch low stock products:", error);
    return [];
  }
};