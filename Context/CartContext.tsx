
"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product } from '@/Components/shop/ProductCard';
// 📡 Bring in Firestore functions and your database configuration
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase"; 

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  products: Product[]; // 📦 Central source of truth for live products
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  decreaseStock: (cartItems: CartItem[]) => void; // 📉 Triggered post-checkout
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

  // 📦 Initialize products as an empty array to await live database items
  const [products, setProducts] = useState<Product[]>([]);

  // 📥 Fetch live products from the Firestore "products" collection on load
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
    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        const cartItem = cartItems.find((item) => item.product.id === product.id);
        if (cartItem) {
          return { ...product, availableStock: Math.max(0, product.availableStock - cartItem.quantity) };
        }
        return product;
      });
    });
  };

  // 🔔 Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // ⏱️ Ref to keep track of the active timer ID across renders
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

  // 📝 Add to Cart with strict stock boundaries and a toast trigger
  const addToCart = (product: Product) => {
    // 🔍 Find the fresh product data from our source of truth
    const freshProduct = products.find(p => p.id === product.id);
    let stockIsAvailable = true;

    // 🛡️ Safety check: if the product wasn't found in our master list, fallback safely
    if (!freshProduct) return;

    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // 🔒 Guardrail: Check if adding 1 more exceeds live available stock
        if (existingItem.quantity >= freshProduct.availableStock) {
          stockIsAvailable = false;
          return prevCart;
        }
        
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // 🔒 Guardrail: Check if the fresh product itself has stock before initial add
      if (freshProduct.availableStock <= 0) {
        stockIsAvailable = false;
        return prevCart;
      }

      return [...prevCart, { product, quantity: 1 }];
    });

    // 💥 Toast Notification Sequence
    if (stockIsAvailable) {
      setToastMessage(`Added "${product.name}" to your cart! 🛒`);
      setShowToast(true);

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      toastTimeoutRef.current = setTimeout(() => {
        setShowToast(false);
      }, 1000);
    } else {
      setToastMessage(`Sorry, you cannot add more "${product.name}". It has reached its stock limit! 📦`);
      setShowToast(true);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // 🔍 Find the fresh product data from our source of truth
    const freshProduct = products.find(p => p.id === productId);

    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          // 🛡️ Safety check: if product metadata isn't found in master list, keep item intact
          if (!freshProduct) return item;

          // 🔒 Safety Lock: Check if the requested quantity exceeds live available inventory
          if (quantity > freshProduct.availableStock) {
            alert(`Sorry, you have reached the maximum available limit (${freshProduct.availableStock}) for this item! 📦`);
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
        className={`fixed top-4 right-4 z-9999 max-w-sm bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-800 flex items-center gap-3 transition-all duration-300 pointer-events-none ${
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