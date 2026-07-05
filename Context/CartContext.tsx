"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product } from '@/Components/shop/ProductCard';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  products: Product[]; // 📦 Expose products array to the app
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  decreaseStock: (cartItems: CartItem[]) => void; // 📉 Added so checkout can trigger it
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

  // 📦 Global centralized source of truth for items & available stock
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: '24" HD Lace Frontal Body Wave Wig',
      brand: 'Femel Hair',
      description: 'Premium quality 100% human hair wig with pre-plucked hairline and invisible HD lace.',
      price: 350.00,
      salePrice: 299.99,
      category: 'Hair',
      isNew: true,
      imageUrl: '',
      availableStock: 10
    },
    {
      id: '2',
      name: 'Matte Liquid Lipstick - Crimson Velvet',
      brand: 'Femel Beauty',
      description: 'Long-lasting, smudge-proof liquid lipstick with a hydrating matte finish.',
      price: 22.00,
      category: 'Makeup',
      isNew: false,
      imageUrl: '',
      availableStock: 6
    },
    {
      id: '3',
      name: 'Oversized Satin Varsity Jacket',
      brand: 'Femel Apparel',
      description: 'Comfortable and stylish satin jacket featuring embroidered details and premium lining.',
      price: 85.00,
      category: 'Apparel',
      isNew: true,
      imageUrl: '',
      availableStock: 7
    }
  ]);

  // 📉 Deduct stock quantities post-checkout
  const decreaseStock = (cartItems: CartItem[]) => {
    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        // Look inside item.product.id rather than item.id
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

  // 📝 Add to Cart with automated Toast Trigger
 // 📝 Add to Cart with strict stock boundaries and a toast trigger
  const addToCart = (product: Product) => {
    let stockIsAvailable = true;

    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // 🔒 Guardrail: Check if adding 1 more exceeds available stock
        if (existingItem.quantity >= product.availableStock) {
          stockIsAvailable = false;
          return prevCart; // Return unchanged cart if out of stock
        }
        
        // ✨ Clean increment: Map through and add EXACTLY 1 to the item quantity
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // 🔒 Guardrail: Check if the product itself has stock before initial add
      if (product.availableStock <= 0) {
        stockIsAvailable = false;
        return prevCart;
      }

      // Add fresh item with quantity 1
      return [...prevCart, { product, quantity: 1 }];
    });

    // 💥 Toast Notification Sequence (Only fires if stock check passed!)
    if (stockIsAvailable) {
      setToastMessage(`Added "${product.name}" to your cart! 🛒`);
      setShowToast(true);

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      toastTimeoutRef.current = setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } else {
      alert(`Sorry, you cannot add more "${product.name}". It has reached its stock limit! 📦`);
    }
  };
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    // 🗑️ User specified: if quantity reaches 0, vanish from view entirely
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          // 🔒 Safety Lock: Check if the requested quantity exceeds available inventory
          if (quantity > item.product.availableStock) {
            alert(`Sorry, you have reached the maximum available limit (${item.product.availableStock}) for this item! 📦`);
            return item; // Keep the quantity right where it is
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
      products, // 🔑 Added here so components can read it!
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      decreaseStock, // 🔑 Added here so checkout view can call it!
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