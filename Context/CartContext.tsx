
"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
// 📡 Bring in Firestore functions and your database configuration
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase"; 

// 📦 Explicitly matching the deep variant structure from your data layer
export interface SizeVariant {
  size: string | number;
  stock: number;
}

export interface ColorVariant {
  color: string;
  sizes: SizeVariant[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  salePrice?: number;
  salePercentage?: number;
  category: string;
  isNew?: boolean;
  imageUrl?: string;
  variants?: ColorVariant[];
  tags?: string[];
}

// 🛒 Expanded to store specific selection variants natively
export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface CartContextType {
  cart: CartItem[];
  products: Product[]; 
  addToCart: (cartItem: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  decreaseStock: (cartItems: CartItem[]) => void; 
  clearCart: () => void;
  getCartCount: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // 📥 Fetch live products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products from Firestore: ", error);
      }
    };
    fetchProducts();
  }, []);

  // 📉 Deduct stock quantities post-checkout
  const decreaseStock = (cartItems: CartItem[]) => {
    // Left intact for your processing logic
  };

  // 🔔 Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 📥 Load cart from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('shopping-cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (error) {
          console.error("Failed to parse cart data", error);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // 💾 Sync cart changes to localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('shopping-cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);



  // 🛠️ Add items as CartItem objects and compare by product/variant key:
const addToCart = (incomingItem: CartItem) => {
  const incomingKey = `${incomingItem.product.id}-${incomingItem.selectedColor || ''}-${incomingItem.selectedSize || ''}`;

  setCart((prevCart) => {
    const existingItemIndex = prevCart.findIndex((item) => {
      const itemKey = `${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`;
      return itemKey === incomingKey;
    });

    if (existingItemIndex > -1) {
      const updatedCart = [...prevCart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + incomingItem.quantity,
      };
      return updatedCart;
    }

    return [...prevCart, incomingItem];
  });
};







  // 🗑️ Uses a compound unique filter mapping rather than strict raw IDs 
  const removeFromCart = (cartItemId: string) => {
    // cartItemId should format out to `${product.id}-${selectedColor}-${selectedSize}`
    setCart((prevCart) => prevCart.filter(item => {
      const uniqueKey = `${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`;
      return uniqueKey !== cartItemId;
    }));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCart((prevCart) => {
      return prevCart.map((item) => {
        const uniqueKey = `${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`;
        if (uniqueKey === cartItemId) {
          const freshProduct = products.find(p => p.id === item.product.id);
          if (!freshProduct) return item;

          let maxAvailableStock = 0;
          if (freshProduct.variants && item.selectedColor && item.selectedSize) {
            const targetColor = freshProduct.variants.find(v => v.color === item.selectedColor);
            const targetSize = targetColor?.sizes.find(s => String(s.size) === String(item.selectedSize));
            maxAvailableStock = targetSize ? targetSize.stock : 0;
          } else {
            maxAvailableStock = (freshProduct as any).availableStock || 0;
          }

          if (quantity > maxAvailableStock) {
            alert(`Sorry, you have reached the maximum available variant limit (${maxAvailableStock})! 📦`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => setCart([]);
  const getCartCount = () => cart.reduce((total, item) => total + item.quantity, 0);
  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item.product.salePrice ?? item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      products, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      decreaseStock, 
      clearCart, 
      getCartCount, 
      getTotalPrice, 
      isCartOpen, 
      setIsCartOpen
    }}>
      {children}

      {/* 🔔 Global Toast Visual Element */}
      <div 
        className={`fixed top-4 right-4 z-[9999] max-w-sm bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-800 flex items-center gap-3 transition-all duration-300 pointer-events-none ${
          showToast 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 -translate-y-4 scale-95"
        }`}
      >
        <span className="text-sm font-medium">{toastMessage}</span>
      </div>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};