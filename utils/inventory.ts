
import { db } from "@/config/firebase";
import { doc, runTransaction } from "firebase/firestore";

interface CartItem {
  product: {
    id: string;
    name: string;
  };
  quantity: number;
  selectedColor?: string;
  selectedSize?: string | number;
}

/**
 * Deducts stock levels safely in Firestore using a transaction.
 * Deducts both global "availableStock" and the specific variant color/size stock.
 */
export async function reduceProductStock(cartItems: CartItem[]): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // 1. First, read all product documents inside the transaction (All reads must happen first!)
    const productReads = [];
    for (const item of cartItems) {
      const productRef = doc(db, "products", item.product.id);
      productReads.push({
        item,
        ref: productRef,
        promise: transaction.get(productRef),
      });
    }

    // Resolve all reads
    const readResults = [];
    for (const read of productReads) {
      const docSnap = await read.promise;
      if (!docSnap.exists()) {
        throw new Error(`Product ${read.item.product.name} does not exist in the database!`);
      }
      readResults.push({
        ...read,
        data: docSnap.data(),
      });
    }

    // 2. Perform validation checks and calculate updates
    const writesToPerform: Array<{ ref: any; updateData: any }> = [];

    for (const record of readResults) {
      const productData = record.data;
      const cartQty = record.item.quantity;
      
      // Check total available stock
      const currentGlobalStock = Number(productData.availableStock) || 0;
      if (currentGlobalStock < cartQty) {
        throw new Error(`Insufficient stock for ${record.item.product.name}. Only ${currentGlobalStock} left!`);
      }

      const updatedGlobalStock = currentGlobalStock - cartQty;
      let updatedVariants = [...(productData.variants || [])];

      // If the customer selected a color and size, decrement that variant stock as well
      if (record.item.selectedColor && record.item.selectedSize) {
        let variantFound = false;

        updatedVariants = updatedVariants.map((colorGroup: any) => {
          // Find matching color
          if (colorGroup.color.toLowerCase() === record.item.selectedColor?.toLowerCase()) {
            const updatedSizes = colorGroup.sizes.map((sizeObj: any) => {
              // Find matching size
              if (String(sizeObj.size) === String(record.item.selectedSize)) {
                const currentVariantStock = Number(sizeObj.stock) || 0;
                if (currentVariantStock < cartQty) {
                  throw new Error(`Insufficient stock for ${record.item.product.name} (Color: ${record.item.selectedColor}, Size: ${record.item.selectedSize}). Only ${currentVariantStock} left!`);
                }
                variantFound = true;
                return { ...sizeObj, stock: currentVariantStock - cartQty };
              }
              return sizeObj;
            });
            return { ...colorGroup, sizes: updatedSizes };
          }
          return colorGroup;
        });

        if (!variantFound) {
          throw new Error(`The selected variation for ${record.item.product.name} was not found.`);
        }
      }

      // Add this update to our queue
      writesToPerform.push({
        ref: record.ref,
        updateData: {
          availableStock: updatedGlobalStock,
          variants: updatedVariants,
        },
      });
    }

    // 3. Write updates back to Firestore inside the transaction
    for (const write of writesToPerform) {
      transaction.update(write.ref, write.updateData);
    }
  });
}