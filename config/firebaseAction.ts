import { db, storage } from "./firebase"; 
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

// 📤 1. Uploads image file immediately when selected
export const uploadProductImage = async (
  imageFile: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
  const uploadTask = uploadBytesResumable(storageRef, imageFile);

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(Math.round(progress)); 
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

// 📝 2. Saves the final product details to Firestore
export const addProduct = async (productData: any, imageUrl: string) => {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      name: productData.name,
      category: productData.category,
      brand: productData.brand,
      price: parseFloat(productData.price),
      salePercentage: productData.salePercentage ? parseInt(productData.salePercentage) : 0,
      availableStock: productData.availableStock ? parseInt(productData.availableStock) : 0,
      imageUrl: imageUrl, 
      tags: productData.tags, 
      colors: productData.colors,
      sizes: productData.sizes,
      isNewArrival: productData.isNewArrival,
      createdAt: new Date(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding product:", error);
    return { success: false, error };
  }
};