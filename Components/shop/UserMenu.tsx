"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/Context/AuthContext"; 
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, storage } from "@/config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import Link from "next/link";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
  imageUrl?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: any;
  items: OrderItem[];
  financials: {
    grandTotal: number;
  };
}


// 🎨 Helper function for all your active order statuses
const getStatusBadgeStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "processing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "delivered":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "cancelled":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "refunded":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "pending":
    default:
      return "bg-amber-100 text-amber-800 border-amber-200";
  }
};


export default function UserMenu() {
  const { user, logout } = useAuth(); 
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPhotoURL, setLocalPhotoURL] = useState<string | null>(null);
  
  // 📦 Customer Orders Modal State
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync the local state image whenever the user object is fully loaded
  useEffect(() => {
    if (user) {
      setLocalPhotoURL(user.photoURL);
    }
  }, [user]);

  // Close dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
 // 📥 Fetch Customer's Orders from Firestore
  const fetchCustomerOrders = async () => {
    if (!user || !user.email) return;
    setLoadingOrders(true);
    try {
      const userEmailLower = user.email.toLowerCase();

      // Query Firestore for orders where customer.email matches
      const q = query(
        collection(db, "orders"),
        where("customer.email", "==", userEmailLower)
      );

      const querySnapshot = await getDocs(q);
      const fetchedOrders: Order[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      // Sort manually on the client side to avoid Firestore missing index errors
      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching customer orders: ", error);
    } finally {
      setLoadingOrders(false);
    }
  };


  const handleOpenOrders = () => {
    setIsOpen(false); // Close dropdown
    setIsOrdersModalOpen(true); // Open modal
    fetchCustomerOrders();
  };

  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-pink-600 transition-colors">
          Login
        </Link>
        <Link href="/signup" className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-pink-700 transition-colors shadow-sm">
          Sign Up
        </Link>
      </div>
    );
  }

  // Handle uploading custom profile photo to Firebase Storage
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await updateProfile(user, { photoURL });

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { photoURL });

      setLocalPhotoURL(photoURL);

      alert("Profile picture updated successfully! 🎉");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload profile image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* 👤 Trigger Button: User Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-hidden group"
      >
        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-200 shadow-xs group-hover:border-pink-500 transition">
          {localPhotoURL ? (
            <img
              src={localPhotoURL}
              alt={user.displayName || "User profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm uppercase">
              {user.displayName ? user.displayName[0] : (user.email ? user.email[0] : "U")}
            </div>
          )}
        </div>
      </button>

      {/* 📂 Dropdown Menu Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* User Info Header */}
          <div className="px-4 py-2 border-b border-gray-50 flex flex-col space-y-1">
            <span className="font-semibold text-gray-950 text-sm truncate">
              {user.displayName || "My Profile"}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {user.email}
            </span>
          </div>

          {/* 📦 View Orders Link */}
          <button
            onClick={handleOpenOrders}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2 transition"
          >
            🛍️ My Orders
          </button>

          {/* Upload Profile Pic Trigger */}
          <div className="px-4 py-2">
            <label className="text-xs font-semibold text-pink-600 hover:text-pink-700 cursor-pointer block">
              {uploading ? "Uploading..." : "📷 Change Profile Picture"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <div className="border-t border-gray-50 my-1" />

          {/* Logout Action */}
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* 🧾 Orders Modal Pop-up */}
      {isOrdersModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📦 Order History
              </h2>
              <button
                onClick={() => setIsOrdersModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {loadingOrders ? (
              <div className="p-8 text-center text-gray-500 animate-pulse">
                Fetching your order history... ⏳
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
                You haven't placed any orders yet. 🛍️
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const orderDate = order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Recent";

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 hover:border-pink-200 transition-colors shadow-2xs"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2 border-b border-gray-100 pb-2">
                        <div>
                          <span className="font-semibold text-gray-900 block">{order.orderNumber}</span>
                          <span>{orderDate}</span>
                        </div>

                       {/* Inside orders.map in UserMenu.tsx */}
                        <div className="text-right">
                         <span className="font-bold text-gray-900 text-sm block">
                          ${order.financials?.grandTotal?.toFixed(2) || "0.00"}
                         </span>
                          <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${getStatusBadgeStyle(
                          order.status
                          )}`}
                          >
                         {order.status || "Pending"}
                         </span>
                        </div>


                      </div>

                      {/* Purchased Line Items */}
                      <div className="divide-y divide-gray-50 space-y-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="pt-2 flex items-center justify-between text-xs gap-3">
                            <div className="flex items-center gap-2">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-10 h-10 object-cover rounded-md border border-gray-100"
                                />
                              )}
                              <div>
                                <p className="font-semibold text-gray-800">{item.name}</p>
                                <p className="text-gray-400">
                                  Qty: {item.quantity}{" "}
                                  {item.color && `| Color: ${item.color}`}{" "}
                                  {item.size && `| Size: ${item.size}`}
                                </p>
                              </div>
                            </div>
                            <span className="font-medium text-gray-700">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}