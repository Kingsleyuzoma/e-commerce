
import { db, storage } from "./firebase"; // Adjust paths to your setup
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

export const addProduct = async (
  productData: any,
  imageFile: File,
  onProgress: (progress: number) => void // 🔄 Callback to send percentage to frontend
) => {
  try {
    // Storage 
    const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
    
    // 🚀 Start resumable upload
    const uploadTask = uploadBytesResumable(storageRef, imageFile);

    // ⏳ Wrap the upload listener in a Promise so we can await it
    const downloadUrl = await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // 📊 Calculate percentage: (bytes sent / total bytes) * 100
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress)); // Send it to the frontend
        },
        (error) => reject(error), // Handle upload failure
        async () => {
          // 🎉 Upload complete, get the final image URL
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });

    // 📝 Save product details + image URL to Firestore
    const docRef = await addDoc(collection(db, "products"), {
      name: productData.name,
      category: productData.category,
      brand: productData.brand,
      price: parseFloat(productData.price),
      salePercentage: productData.salePercentage ? parseInt(productData.salePercentage) : 0,
      imageUrl: downloadUrl,
      tags: productData.tags.split(",").map((tag: string) => tag.trim()),
      isNewArrival: productData.isNewArrival,
      createdAt: new Date(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding product:", error);
    return { success: false, error };
  }
};